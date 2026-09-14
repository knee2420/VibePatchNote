"""와이어프레임(서식 틀) 생성 Agent (Agent 경로)."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.core.storage import RUN_PREFIX, new_id

from ..models import WireframeExecutionResult
from ..ports import (
    AgentRunInput,
    AgentRuntimePort,
    RunCost,
    WireframeArchivePort,
    WireframeDocumentSourcePort,
    WireframeExtractOutput,
    WireframeExtractPort,
    WireframeTelemetryPort,
    current_run_id,
)

logger = logging.getLogger(__name__)


class GenerateWireframeUseCase:
    """PDF 문서로부터 Tiptap 와이어프레임(HTML & Markdown)을 생성한다."""

    name = "documents.generate_scaffold"

    def __init__(
        self,
        source: WireframeDocumentSourcePort,
        engine: WireframeExtractPort,
        archive: WireframeArchivePort,
        agent_runtime: AgentRuntimePort,
        telemetry: WireframeTelemetryPort,
    ) -> None:
        """협력자는 전부 필수다. **유스케이스는 어댑터를 고르지 않는다.**

        예전에는 전부 `| None = None` 이었고, 빠진 것은 생성자가 직접
        `EngineWireframeExtractAdapter(...)` 를 만들어 채웠다. 어댑터 선택이
        컨테이너 밖으로 새고, 컨테이너가 하나를 빠뜨려도 부팅이 성공한 뒤
        사용자 요청이 그것을 발견한다. `scaffolds` / `archive` 두 이름으로 같은
        것을 받던 별칭도 없앴다 — 같은 것을 두 이름으로 받으면 어느 쪽이 정본인지
        호출부마다 달라진다. 쓰이지 않던 `llm_harness` 도 함께 뺐다 — 엔진
        어댑터가 하네스를 들고 있으므로 유스케이스가 또 받을 이유가 없다.
        """
        self._source = source
        self._engine = engine
        self._archive = archive
        self._runtime = agent_runtime
        self._telemetry = telemetry

    async def _run_pipeline(
        self,
        file_path: Any,
        display_name: str | None = None,
        doc_id: str | None = None,
        pages: list[int] | None = None,
    ) -> WireframeExtractOutput:
        raw = await self._engine.extract(
            Path(file_path), display_name=display_name, doc_id=doc_id, pages=pages
        )
        if isinstance(raw, WireframeExtractOutput):
            return raw
        if isinstance(raw, tuple) and len(raw) == 2:
            res, tel = raw
            return WireframeExtractOutput(
                meta=res.meta,
                html_content=res.html_content,
                markdown_content=res.markdown_content,
                slots=res.slots,
                telemetry=tel if isinstance(tel, dict) else {},
            )
        if hasattr(raw, "html_content") and hasattr(raw, "meta"):
            return WireframeExtractOutput(
                meta=raw.meta,
                html_content=raw.html_content,
                markdown_content=raw.markdown_content,
                slots=getattr(raw, "slots", []),
                cost=getattr(raw, "cost", None) or RunCost(),
                telemetry=getattr(raw, "telemetry", {}),
            )
        return raw  # type: ignore

    async def execute(self, doc_id: str, pages: list[int] | None = None) -> dict[str, Any]:
        meta = self._require(doc_id)
        run_id = current_run_id()
        if not run_id:
            agent_run, result = await self._runtime.execute(
                self.name,
                lambda: self._execute_internal(meta, pages=pages),
                doc_id=doc_id,
                run_input=AgentRunInput(
                    use_case=self.name, doc_id=doc_id, payload={"docId": doc_id, "pages": pages}
                ),
            )
            return result
        return await self._execute_internal(meta, pages=pages)

    async def _execute_internal(self, meta: Any, pages: list[int] | None = None) -> dict[str, Any]:
        doc_id = getattr(meta, "doc_id", None) or str(meta)
        original_name = getattr(meta, "original_name", "") or getattr(meta, "title", "document")
        run_id = current_run_id() or new_id(RUN_PREFIX)

        session_ctx = self._telemetry.workflow_session(
            run_id=run_id,
            doc_id=doc_id,
            target_name=original_name,
            workflow_name=self.name,
            workflow_label="와이어프레임 생성",
        )

        with session_ctx:
            file_path = self._source.resolve_file(doc_id)
            try:
                output: WireframeExtractOutput = await self._run_pipeline(
                    file_path, display_name=original_name, doc_id=doc_id, pages=pages
                )
            except Exception as exc:
                logger.error("[GenerateWireframe] 파이프라인 실패: %s", exc, exc_info=True)
                self._settle_failure(run_id, doc_id, str(exc))
                raise

            logger.info(
                "[GenerateWireframe] 완료: %s (slots=%d, html=%d자)",
                doc_id, len(output.slots), len(output.html_content),
            )

            cost = getattr(output, "cost", None) or RunCost()
            self._runtime.record_cost(run_id, cost, status="SUCCESS")

            archive_meta = None
            try:
                archive_meta = self._archive.archive_scaffold(
                    doc_id=doc_id,
                    pdf_path=file_path,
                    result=output,
                )
            except Exception as exc:
                logger.warning("[GenerateWireframe] 아카이빙 실패: %s", exc)

            result = WireframeExecutionResult(
                status="completed",
                doc_id=doc_id,
                meta=output.meta,
                html_content=output.html_content,
                markdown_content=output.markdown_content,
                slots=output.slots,
                archive=archive_meta.model_dump() if archive_meta and hasattr(archive_meta, "model_dump") else (archive_meta if isinstance(archive_meta, dict) else None),
                manifest=output.telemetry,
                trace_id=run_id,
                agent_run_id=run_id,
                error=None,
            )
            return result.to_dict()

    def _require(self, doc_id: str) -> Any:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        return meta

    def _settle_failure(self, run_id: str, doc_id: str, error_detail: str) -> None:
        self._runtime.settle_failure(
            run_id,
            error_code="PIPELINE_ERROR",
            doc_id=doc_id,
            detail=error_detail,
            reason="AI 공급자 또는 와이어프레임 생성 엔진 실행 실패",
            attempt=1,
        )


# 하위 호환성 alias
GenerateScaffoldUseCase = GenerateWireframeUseCase
