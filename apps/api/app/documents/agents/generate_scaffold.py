"""스캐폴드 생성 Agent (Agent 경로).

스캐폴드는 문서의 하위 구조가 아니라 자기 식별자와 수명주기를 가진 별개의
애그리거트다. 이 Agent는 `doc_id` 만 넘기고 그 안을 알지 못한다.
"""
from __future__ import annotations

import logging
from contextlib import nullcontext
from typing import Any

from agent_runtime import AgentRunInput, current_run_id
from scaffold_engine import ScaffoldExtractResult

from app.core.storage import RUN_PREFIX, new_id

from ..models import DocumentMeta
from ..ports import (
    AgentRuntimePort,
    DocumentSourceRepository,
    DocumentTelemetryPort,
    ScaffoldArchivePort,
    ScaffoldExtractPort,
)

logger = logging.getLogger(__name__)


class GenerateScaffoldUseCase:
    """PDF 문서로부터 Tiptap 스캐폴딩(HTML & Markdown)을 생성한다."""

    name = "documents.generate_scaffold"

    def __init__(
        self,
        source: DocumentSourceRepository,
        scaffolds: ScaffoldArchivePort,
        agent_runtime: AgentRuntimePort | None = None,
        engine: ScaffoldExtractPort | None = None,
        telemetry: DocumentTelemetryPort | None = None,
        llm_harness: Any = None,
    ) -> None:

        self._source = source
        self._scaffolds = scaffolds
        self._runtime = agent_runtime
        self._engine = engine
        self._telemetry = telemetry
        self._harness = llm_harness or getattr(engine, "_harness", None)

    async def _run_pipeline(
        self, file_path: Any, display_name: str | None = None
    ) -> tuple[ScaffoldExtractResult, Any]:
        """스캐폴드 추출 엔진 포트(ScaffoldExtractPort)에 위임하여 실행합니다."""
        return await self._engine.extract(file_path, display_name=display_name)

    async def execute(self, doc_id: str) -> dict[str, Any]:
        meta = self._require(doc_id)
        run_id = current_run_id()
        if not run_id and self._runtime:
            agent_run, result = await self._runtime.execute(
                self.name,
                lambda: self._execute_internal(meta),
                doc_id=doc_id,
                run_input=AgentRunInput(
                    use_case=self.name, doc_id=doc_id, payload={"docId": doc_id}
                ),
            )
            return result
        return await self._execute_internal(meta)

    async def _execute_internal(self, meta: DocumentMeta) -> dict[str, Any]:
        doc_id = meta.doc_id
        run_id = current_run_id() or new_id(RUN_PREFIX)

        # 관측 세션: StepCollector 활성화 및 작업 완료 시 Inspector 원장 자동 영속화
        session_ctx = (
            self._telemetry.workflow_session(
                run_id=run_id,
                doc_id=doc_id,
                target_name=meta.original_name,
                workflow_name=self.name,
                workflow_label="와이어프레임 생성",
            )
            if self._telemetry
            else nullcontext()
        )

        with session_ctx:
            file_path = self._source.resolve_file(doc_id)
            result, _ = await self._run_pipeline(
                file_path, display_name=meta.original_name
            )

            logger.info(
                "[GenerateScaffold] 완료: %s (slots=%d, html=%d자)",
                doc_id, len(result.slots), len(result.html_content),
            )

            # 아카이브 실패가 생성 결과 전체를 버리게 하지는 않는다. 본문은 응답에 실려 있다.
            archive_meta = None
            try:
                archive_meta = self._scaffolds.archive_scaffold(doc_id, file_path, result)
            except Exception as exc:
                logger.warning("[GenerateScaffold] 아카이브 실패(치명적 아님): %s", exc, exc_info=True)

            return {
                "status": "completed",
                "docId": doc_id,
                "meta": result.meta.model_dump(by_alias=True),
                "htmlContent": result.html_content,
                "markdownContent": result.markdown_content,
                "slots": [slot.model_dump(by_alias=True) for slot in result.slots],
                "archive": archive_meta.model_dump(by_alias=True) if archive_meta else None,
                "agentRunId": run_id,
            }

    def _require(self, doc_id: str) -> DocumentMeta:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        return meta


