"""아웃라인 추출 Agent (Agent 경로).

LLM 이 개입하므로 Agent Runtime 을 통과하고, 결과는 **캐시가 아니라 아티팩트**로
커밋한다. 같은 PDF 를 같은 모델로 다시 돌려도 바이트가 같지 않기 때문에, 덮어쓰지
않고 새 버전을 쌓은 뒤 HEAD 만 옮긴다.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from agent_runtime import (
    DEFAULT_RETRY_POLICY,
    AgentRunInput,
    RunCost,
    current_run_id,
)
from agent_telemetry import SpanUsage, usage_to_product_dict
from scaffold_engine import OutlineDocument

from app.core.llm import BaseLlmHarness, ExecutionRecorder

from ..adapters import (
    DocumentOutlineArchiveAdapter,
    EngineOutlineExtractAdapter,
)
from ..errors import analysis_error, failure_code_of
from ..models import (
    DocumentMeta,
    OutlineExecutionResult,
)
from ..ports import (
    AgentRuntimePort,
    DocumentArtifactRepository,
    DocumentCacheRepository,
    DocumentSourceRepository,
    DocumentTelemetryPort,
    OutlineArchivePort,
    OutlineExtractPort,
)

logger = logging.getLogger(__name__)


class ExtractOutlineUseCase:
    """문서의 계층 아웃라인과 세부 엘리먼트를 추출한다."""

    name = "documents.extract_outline"

    def __init__(
        self,
        source: DocumentSourceRepository,
        artifacts: DocumentArtifactRepository | None = None,
        cache: DocumentCacheRepository | None = None,
        agent_runtime: AgentRuntimePort | None = None,
        recorder: ExecutionRecorder | None = None,
        llm_harness: BaseLlmHarness | None = None,
        telemetry: DocumentTelemetryPort | None = None,
        engine: OutlineExtractPort | None = None,
        archive: OutlineArchivePort | None = None,
    ) -> None:
        self._source = source
        self._artifacts = artifacts
        self._cache = cache
        self._runtime = agent_runtime
        self._recorder = recorder
        self._harness = llm_harness
        self._telemetry = telemetry

        # 포트-어댑터 기본 조립 (직접 주입되지 않은 경우 자동 구성하여 하위 호환성 보장)
        if engine is not None:
            self._engine = engine
        elif llm_harness is not None and cache is not None:
            self._engine = EngineOutlineExtractAdapter(harness=llm_harness, cache=cache)
        else:
            self._engine = None  # type: ignore

        if archive is not None:
            self._archive = archive
        elif artifacts is not None:
            self._archive = DocumentOutlineArchiveAdapter(artifacts=artifacts)
        else:
            self._archive = None  # type: ignore

    async def _run_pipeline(
        self,
        file_path: Any,
        context_dir: Any = None,
        display_name: str | None = None,
    ) -> OutlineDocument:
        """독립 문서 엔진 포트를 통해 OutlineDocument 추출을 실행합니다."""
        if self._engine:
            return await self._engine.extract(
                Path(file_path),
                context_dir=Path(context_dir) if context_dir else None,
                display_name=display_name,
            )
        raise RuntimeError("OutlineExtractPort 엔진 어댑터가 구성되지 않았습니다.")

    def load_adopted(self, doc_id: str) -> dict[str, Any] | None:
        """현재 채택본을 그대로 읽는다. LLM 을 호출하지 않는 일반 경로다."""
        meta = self._require(doc_id)
        return self._archive.load_adopted(meta)

    async def execute(self, doc_id: str, force_refresh: bool = False) -> dict[str, Any]:
        meta = self._require(doc_id)

        if not force_refresh:
            adopted = self._archive.load_adopted(meta)
            if adopted is not None:
                logger.info("[ExtractOutline] 채택본 재사용: %s", doc_id)
                return adopted
            logger.warning("[ExtractOutline] 내용 없는 채택본 재분석: %s", doc_id)

        file_path = self._source.resolve_file(doc_id)
        run_id = current_run_id()
        if run_id:
            document = await self._engine.extract(
                file_path,
                doc_id=doc_id,
                display_name=meta.original_name,
            )
        else:
            agent_run, document = await self._runtime.execute(
                self.name,
                lambda: self._engine.extract(
                    file_path,
                    doc_id=doc_id,
                    display_name=meta.original_name,
                ),
                doc_id=doc_id,
                run_input=AgentRunInput(
                    use_case=self.name,
                    doc_id=doc_id,
                    payload={"docId": doc_id, "forceRefresh": True},
                ),
            )
            run_id = agent_run.run_id

        pipeline_telemetry = (document.telemetry or {}).get("pipeline_telemetry")

        # 1. 비용 원장 기록 (SpanUsage -> RunCost 변환: usage_to_product_dict 단일 진실)
        cost = RunCost()
        if pipeline_telemetry:
            if isinstance(pipeline_telemetry, dict) and "total_usage" in pipeline_telemetry:
                cost = RunCost(**usage_to_product_dict(SpanUsage.model_validate(pipeline_telemetry["total_usage"])))
            elif hasattr(pipeline_telemetry, "total_usage"):
                cost = RunCost(**usage_to_product_dict(pipeline_telemetry.total_usage))
        self._runtime.record_cost(run_id, cost)

        # 2. 단계별 상세를 관측 원장(Inspector)에 남긴다 (실패해도 본 작업을 막지 않는다)
        if self._telemetry and run_id:
            self._telemetry.record_outline_telemetry(
                pipeline_telemetry,
                run_id=run_id,
                doc_id=doc_id,
                target_name=meta.original_name,
            )

        telemetry = document.telemetry or {}
        status_val = telemetry.get("status", "SUCCESS")

        provenance = None
        if status_val == "SUCCESS":
            default_m = self._harness.model if self._harness else ""
            provenance = self._archive.archive(meta, document, run_id=run_id, cost=cost, default_model=default_m)
        else:
            self._settle_failure(run_id, doc_id, telemetry)

        result = OutlineExecutionResult(
            status="completed" if status_val == "SUCCESS" else "failed",
            doc_id=doc_id,
            document_title=meta.original_name,
            total_pages=document.total_pages,
            total_outlines=len(document.outlines),
            total_elements=len(document.flat_elements),
            outlines=document.outlines,
            elements=document.flat_elements,
            markdown_outline=document.markdown_outline,
            manifest=telemetry,
            artifact_id=provenance.artifact_id if provenance else None,
            trace_id=run_id,
            agent_run_id=run_id,
            error=None if status_val == "SUCCESS" else analysis_error(telemetry),
        )
        return result.to_dict()

    # --- 내부 -----------------------------------------------------------

    def _require(self, doc_id: str) -> DocumentMeta:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        return meta

    def _settle_failure(self, run_id: str, doc_id: str, telemetry: dict[str, Any]) -> None:
        """실패를 정책에 따라 '대기' 또는 '실패'로 확정한다."""
        code = failure_code_of(telemetry)
        decision = DEFAULT_RETRY_POLICY.decide(code, attempt=1)
        if decision == "wait_for_configuration":
            self._runtime.mark_waiting(
                run_id,
                failure_code=code,
                doc_id=doc_id,
                reason="AI 공급자를 사용할 수 없어 사용자의 설정이 필요합니다.",
            )
            return
        self._runtime.mark_failed(
            run_id, error_code=code, detail=str(telemetry.get("error") or "")
        )
