"""Thin boundary service for segments use cases."""
from __future__ import annotations

from typing import Any

from agent_runtime import AgentRunInput, AgentRuntime

from .agents import ExtractSegmentsUseCase
from .models import DocumentSegment, SegmentArtifact
from .schemas import to_run_result
from .use_cases import (
    GetAdoptedSegmentsUseCase,
    GetSegmentStructureViewUseCase,
    SaveSegmentRevisionUseCase,
    SetRelationshipOverrideUseCase,
)


class SegmentsService:
    def __init__(
        self,
        extract: ExtractSegmentsUseCase,
        adopted: GetAdoptedSegmentsUseCase,
        save_revision: SaveSegmentRevisionUseCase,
        structure: GetSegmentStructureViewUseCase,
        override: SetRelationshipOverrideUseCase,
        agent_runtime: AgentRuntime,
    ) -> None:
        self._extract = extract
        self._adopted = adopted
        self._save_revision = save_revision
        self._structure = structure
        self._override = override
        self._runtime = agent_runtime

    async def extract(self, doc_id: str):
        return await self._extract.execute(doc_id)

    async def start_extract(self, doc_id: str) -> dict[str, str]:
        # 런타임에는 **응답 모양의 dict** 를 넘긴다. 화면은 이 결과를 그대로 읽고,
        # 런타임은 dict 가 아닌 값을 이력에 남기지 못한다.
        async def operation() -> dict[str, Any]:
            return to_run_result(await self._extract.execute(doc_id))

        run = await self._runtime.submit(
            self._extract.name,
            operation,
            doc_id=doc_id,
            run_input=AgentRunInput(use_case=self._extract.name, doc_id=doc_id, payload={"docId": doc_id}),
        )
        return {"runId": run.run_id, "status": run.status}

    def adopted(self, doc_id: str) -> tuple[str, SegmentArtifact | None]:
        return self._adopted.execute(doc_id)

    def save_revision(self, doc_id: str, base_artifact_id: str | None, segments: list[DocumentSegment]):
        return self._save_revision.execute(
            doc_id,
            base_artifact_id=base_artifact_id,
            segments=segments,
        )

    def structure(self, doc_id: str):
        return self._structure.execute(doc_id)

    def set_override(self, doc_id: str, *, target_kind: str, target_id: str, primary_segment_id: str | None):
        return self._override.execute(
            doc_id,
            target_kind=target_kind,
            target_id=target_id,
            primary_segment_id=primary_segment_id,
        )
