"""아웃라인 추출 Agent (Agent 경로).

LLM 이 개입하므로 Agent Runtime 을 통과하고, 결과는 **캐시가 아니라 아티팩트**로
커밋한다. 같은 PDF 를 같은 모델로 다시 돌려도 바이트가 같지 않기 때문에, 덮어쓰지
않고 새 버전을 쌓은 뒤 HEAD 만 옮긴다.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.core.llm import BaseLlmHarness
from app.core.storage import RUN_PREFIX, new_id

from ..errors import analysis_error, failure_code_of
from ..models import (
    OutlineExecutionResult,
)
from ..ports import (
    AgentRunInput,
    AgentRuntimePort,
    OutlineArchivePort,
    OutlineDocumentSourcePort,
    OutlineExtractOutput,
    OutlineExtractPort,
    OutlineTelemetryPort,
    RunCost,
    current_run_id,
)

logger = logging.getLogger(__name__)


class ExtractOutlineUseCase:
    """문서의 계층 아웃라인과 세부 엘리먼트를 추출한다."""

    name = "documents.extract_outline"

    def __init__(
        self,
        source: OutlineDocumentSourcePort,
        engine: OutlineExtractPort,
        archive: OutlineArchivePort,
        agent_runtime: AgentRuntimePort,
        telemetry: OutlineTelemetryPort,
        llm_harness: BaseLlmHarness,
    ) -> None:
        """협력자는 전부 필수다. **유스케이스는 어댑터를 고르지 않는다.**

        예전에는 모든 인자가 `| None = None` 이었고, 빠진 것은 생성자가 직접
        `EngineOutlineExtractAdapter(...)` 를 만들어 채웠다. 세 가지가 한꺼번에
        깨졌다 — 어댑터 선택이 컨테이너 밖으로 샜고, 컨테이너가 하나를 빠뜨려도
        부팅이 성공한 뒤 사용자 요청이 `AttributeError` 로 발견했으며,
        유지할 대상이 없는 "하위 호환" 폴백이 그 위반을 데리고 살아 있었다.
        조립 오류는 요청이 아니라 부팅이 발견해야 한다.
        """
        self._source = source
        self._engine = engine
        self._archive = archive
        self._runtime = agent_runtime
        self._telemetry = telemetry
        self._harness = llm_harness

    async def _run_pipeline(
        self,
        file_path: Any,
        context_dir: Any = None,
        display_name: str | None = None,
    ) -> OutlineExtractOutput:
        """독립 문서 엔진 포트를 통해 OutlineExtractOutput 추출을 실행합니다."""
        return await self._engine.extract(
            Path(file_path),
            context_dir=Path(context_dir) if context_dir else None,
            display_name=display_name,
        )

    def load_adopted(self, doc_id: str) -> dict[str, Any] | None:
        """현재 채택본을 그대로 읽는다. LLM 을 호출하지 않는 일반 경로다."""
        meta = self._require(doc_id)
        return self._archive.load_adopted(meta)

    async def execute(self, doc_id: str, force_refresh: bool = False) -> dict[str, Any]:
        meta = self._require(doc_id)
        run_id = current_run_id()
        if not run_id:
            agent_run, result = await self._runtime.execute(
                self.name,
                lambda: self._execute_internal(meta, force_refresh=force_refresh),
                doc_id=doc_id,
                run_input=AgentRunInput(
                    use_case=self.name,
                    doc_id=doc_id,
                    payload={"docId": doc_id, "forceRefresh": force_refresh},
                ),
            )
            return result
        return await self._execute_internal(meta, force_refresh=force_refresh)

    async def _execute_internal(
        self, meta: Any, *, force_refresh: bool = False
    ) -> dict[str, Any]:
        doc_id = getattr(meta, "doc_id", None) or str(meta)
        original_name = getattr(meta, "original_name", "") or getattr(meta, "title", "document")
        run_id = current_run_id() or new_id(RUN_PREFIX)

        # 관측 세션: StepCollector 활성화 및 작업 완료 시 Inspector 원장 자동 영속화
        session_ctx = self._telemetry.workflow_session(
            run_id=run_id,
            doc_id=doc_id,
            target_name=original_name,
            workflow_name=self.name,
            workflow_label="문서 목차 추출",
        )

        with session_ctx:
            adopted = self._archive.load_adopted(meta)
            if not force_refresh:
                if adopted is not None:
                    logger.info("[ExtractOutline] 채택본 재사용: %s", doc_id)
                    return adopted
                logger.warning("[ExtractOutline] 내용 없는 채택본 재분석: %s", doc_id)
            else:
                logger.info("[ExtractOutline] 강제 재분석(force_refresh=True): %s", doc_id)

            file_path = self._source.resolve_file(doc_id)
            document = await self._engine.extract(
                file_path,
                doc_id=doc_id,
                display_name=original_name,
            )

            # 1. 비용 원장 기록 (Engine 어댑터가 계산한 RunCost 계약 활용)
            telemetry = document.telemetry or {}
            status_val = telemetry.get("status", "SUCCESS")

            # 원장은 성공만 적는 곳이 아니다. 실패한 실행도 토큰을 쓴다.
            cost = getattr(document, "cost", None) or RunCost()
            self._runtime.record_cost(
                run_id,
                cost,
                model=self._harness.model,
                status=status_val,
                failure_code=None if status_val == "SUCCESS" else failure_code_of(telemetry),
            )

            provenance = None
            if status_val == "SUCCESS":
                default_m = self._harness.model
                provenance = self._archive.archive(meta, document, run_id=run_id, cost=cost, default_model=default_m)
            else:
                self._settle_failure(run_id, doc_id, telemetry)

            result = OutlineExecutionResult(
                status="completed" if status_val == "SUCCESS" else "failed",
                doc_id=doc_id,
                document_title=original_name,
                total_pages=document.total_pages,
                total_outlines=len(document.outlines),
                total_elements=len(document.flat_elements),
                outlines=document.outlines,
                elements=document.flat_elements,
                markdown_outline=document.markdown_outline,
                manifest=telemetry,
                artifact_id=getattr(provenance, "artifact_id", None) if provenance else None,
                trace_id=run_id,
                agent_run_id=run_id,
                error=None if status_val == "SUCCESS" else analysis_error(telemetry),
            )
            return result.to_dict()

    # --- 내부 -----------------------------------------------------------

    def _require(self, doc_id: str) -> Any:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        return meta

    def _settle_failure(self, run_id: str, doc_id: str, telemetry: dict[str, Any]) -> None:
        """실패를 정책에 따라 런타임에 위임하여 '대기' 또는 '실패'로 확정한다."""
        code = failure_code_of(telemetry)
        self._runtime.settle_failure(
            run_id,
            error_code=code,
            doc_id=doc_id,
            detail=str(telemetry.get("error") or ""),
            reason="AI 공급자를 사용할 수 없어 사용자의 설정이 필요합니다.",
            attempt=1,
        )
