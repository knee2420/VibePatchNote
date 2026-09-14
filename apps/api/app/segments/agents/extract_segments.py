"""Agent use case that turns a source document into an immutable segment artifact."""
from __future__ import annotations

from agent_runtime import AgentRunInput, AgentRuntime, RunCost, current_run_id

from app.core.llm import BaseLlmHarness
from app.core.storage import ARTIFACT_PREFIX, RUN_PREFIX, new_id

from ..errors import SegmentExtractionEmptyError, SegmentNotFoundError
from ..models import SegmentArtifact, SegmentArtifactProvenance
from ..ports import (
    SegmentDocumentSource,
    SegmentExtractor,
    SegmentRepository,
    SegmentTelemetryPort,
)


class ExtractSegmentsUseCase:
    name = "segments.extract"

    def __init__(
        self,
        source: SegmentDocumentSource,
        extractor: SegmentExtractor,
        repository: SegmentRepository,
        agent_runtime: AgentRuntime,
        telemetry: SegmentTelemetryPort,
        llm_harness: BaseLlmHarness,
    ) -> None:
        self._source = source
        self._extractor = extractor
        self._repository = repository
        self._runtime = agent_runtime
        self._telemetry = telemetry
        self._harness = llm_harness

    async def execute(self, doc_id: str) -> SegmentArtifact:
        title = self._source.get_title(doc_id)
        if title is None:
            raise SegmentNotFoundError(f"Document not found: {doc_id}")
        if current_run_id():
            return await self._execute_internal(doc_id, title)
        _, artifact = await self._runtime.execute(
            self.name,
            lambda: self._execute_internal(doc_id, title),
            doc_id=doc_id,
            run_input=AgentRunInput(use_case=self.name, doc_id=doc_id, payload={"docId": doc_id}),
        )
        return artifact

    async def _execute_internal(self, doc_id: str, title: str) -> SegmentArtifact:
        run_id = current_run_id() or new_id(RUN_PREFIX)
        path = self._source.resolve_file(doc_id)
        with self._telemetry.workflow_session(
            run_id=run_id,
            doc_id=doc_id,
            target_name=title,
            workflow_name=self.name,
            workflow_label="문서 세그먼트 추출",
        ):
            extraction = await self._extractor.extract(path, display_name=title)

            if not extraction.segments:
                self._runtime.mark_failed(
                    run_id,
                    error_code="SEGMENT_SCAN_EMPTY",
                    detail="No visual segments were extracted.",
                )
                raise SegmentExtractionEmptyError("No visual segments were extracted.")

            artifact = SegmentArtifact(
                provenance=SegmentArtifactProvenance(
                    artifactId=new_id(ARTIFACT_PREFIX),
                    docId=doc_id,
                    status="SUCCESS",
                    runId=run_id,
                    traceId=run_id,
                    model=self._harness.model,
                    cost=RunCost(),
                    summary={"totalSegments": len(extraction.segments), "totalPages": extraction.total_pages},
                ),
                documentTitle=extraction.document_title,
                totalPages=extraction.total_pages,
                segments=extraction.segments,
            )
            self._repository.commit(artifact)
            self._runtime.record_cost(
                run_id,
                artifact.provenance.cost,
                model=self._harness.model,
                status="SUCCESS",
            )
            return artifact
