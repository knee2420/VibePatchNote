"""Recipe LLM workflow; successful output becomes HEAD immediately."""
from __future__ import annotations

import hashlib
import json

from agent_runtime import AgentRunInput, RunCost, current_run_id

from app.core.storage import ARTIFACT_PREFIX, RUN_PREFIX, new_id

from ..models import RecipeProvenance, RecipeRevision


class DistillRecipeUseCase:
    name = "recipes.distill"

    def __init__(self, reader, extractor, repository, runtime, telemetry, harness) -> None:
        self._reader, self._extractor, self._repository = reader, extractor, repository
        self._runtime, self._telemetry, self._harness = runtime, telemetry, harness

    def readiness(self, doc_id: str, scaffold_id: str | None) -> dict:
        missing, snapshot = self._reader.readiness(doc_id, scaffold_id)
        return {"ready": not missing, "missing": missing, "snapshot": snapshot}

    async def execute(self, doc_id: str, scaffold_id: str | None) -> dict:
        missing, snapshot = self._reader.readiness(doc_id, scaffold_id)
        if missing or snapshot is None:
            raise ValueError("Missing prerequisites: " + ", ".join(missing))
        if current_run_id():
            return await self._execute_snapshot(snapshot)
        _, result = await self._runtime.execute(
            self.name,
            lambda: self._execute_snapshot(snapshot),
            doc_id=doc_id,
            run_input=AgentRunInput(
                use_case=self.name,
                doc_id=doc_id,
                payload={"snapshot": snapshot.model_dump(mode="json", by_alias=True)},
            ),
        )
        return result

    async def resume(self, payload: dict) -> dict:
        from ..models import RecipeInputSnapshot

        return await self._execute_snapshot(RecipeInputSnapshot.model_validate(payload["snapshot"]))

    async def _execute_snapshot(self, snapshot) -> dict:
        run_id = current_run_id() or new_id(RUN_PREFIX)
        with self._telemetry.workflow_session(run_id=run_id, doc_id=snapshot.doc_id, target_name=snapshot.document_title):
            spec = await self._extractor.extract(snapshot)
            recipe_id = new_id("recipe")
            revision = RecipeRevision(
                provenance=RecipeProvenance(
                    recipeId=recipe_id,
                    revisionId=new_id(ARTIFACT_PREFIX),
                    origin="llm",
                    runId=run_id,
                    traceId=run_id,
                    model=self._harness.model,
                    promptHash=hashlib.sha256(
                        json.dumps(snapshot.model_dump(mode="json"), sort_keys=True).encode()
                    ).hexdigest(),
                    engineVersion="1",
                    sourceAnchors=snapshot.source_anchors,
                ),
                title=str(spec.pop("title", snapshot.document_title)),
                spec=spec,
            )
            self._repository.commit(revision)
            self._runtime.record_cost(run_id, RunCost(), model=self._harness.model, status="SUCCESS")
            return {"recipe": revision.model_dump(mode="json", by_alias=True), "runId": run_id}
