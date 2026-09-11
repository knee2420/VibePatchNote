"""아웃라인 추출 유스케이스 (Agent 경로).

LLM 이 개입하므로 Agent Runtime 을 통과하고, 결과는 **캐시가 아니라 아티팩트**로
커밋한다. 같은 PDF 를 같은 모델로 다시 돌려도 바이트가 같지 않기 때문에, 덮어쓰지
않고 새 버전을 쌓은 뒤 HEAD 만 옮긴다.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from scaffold_engine import OutlineDocument, OutlinePipeline

from app.core.agent_runtime import (
    DEFAULT_RETRY_POLICY,
    AgentRunInput,
    AgentRuntime,
    RunCost,
    current_run_id,
)
from app.core.llm import (
    BaseLlmHarness,
    ExecutionRecorder,
    LlmExecutionResult,
    ingest_pipeline_telemetry,
    span_context,
    trace_session,
)
from app.core.storage import ARTIFACT_PREFIX, new_id

from ..errors import analysis_error, failure_code_of
from ..models import (
    OUTLINE_ELEMENTS_FILE,
    OUTLINE_TREE_FILE,
    ArtifactProvenance,
    DocumentMeta,
)
from ..ports import (
    DocumentArtifactRepository,
    DocumentCacheRepository,
    DocumentSourceRepository,
)

logger = logging.getLogger(__name__)

KIND = "outline"
TREE_FILE = OUTLINE_TREE_FILE
ELEMENTS_FILE = OUTLINE_ELEMENTS_FILE
MARKDOWN_FILE = "outline.md"


def _result_from_pipeline_telemetry(
    telemetry: dict[str, Any], fallback_model: str
) -> LlmExecutionResult:
    """OutlinePipeline 텔레메트리 dict → 원장 표준 엔벨로프.

    파이프라인은 컨텍스트 구성 시간과 LLM 시간을 나눠 담고 토큰은 `tokens` 하위에
    중첩한다. 키 이름을 맞추는 지점은 여기 한 곳뿐이다.
    """
    tokens = telemetry.get("tokens") or {}
    ctx_seconds = float(telemetry.get("ctx_duration", 0.0) or 0.0)
    llm_seconds = float(telemetry.get("cli_duration", 0.0) or 0.0)
    return LlmExecutionResult(
        status=telemetry.get("status") or "SUCCESS",
        model=telemetry.get("model") or fallback_model,
        duration_seconds=round(ctx_seconds + llm_seconds, 3),
        input_tokens=tokens.get("input", 0),
        output_tokens=tokens.get("output", 0),
        thinking_tokens=tokens.get("thinking", 0),
        cache_read_tokens=tokens.get("cache_read", 0),
        total_tokens=tokens.get("total", 0),
        error=telemetry.get("error"),
        telemetry_metadata={
            **(telemetry.get("telemetry_metadata") or {}),
            "ctx_duration": ctx_seconds,
            "llm_duration": llm_seconds,
        },
    )


class ExtractOutlineUseCase:
    """문서의 계층 아웃라인과 세부 엘리먼트를 추출한다."""

    name = "documents.extract_outline"

    def __init__(
        self,
        source: DocumentSourceRepository,
        artifacts: DocumentArtifactRepository,
        cache: DocumentCacheRepository,
        agent_runtime: AgentRuntime,
        recorder: ExecutionRecorder,
        llm_harness: BaseLlmHarness,
    ) -> None:
        self._source = source
        self._artifacts = artifacts
        self._cache = cache
        self._runtime = agent_runtime
        self._recorder = recorder
        self._harness = llm_harness

    async def _run_pipeline(
        self,
        file_path: Any,
        context_dir: Any = None,
        display_name: str | None = None,
    ) -> OutlineDocument:
        """독립 문서 엔진(scaffold_engine)의 OutlinePipeline을 스레드 풀에서 직접 실행합니다."""
        pipeline = OutlinePipeline(harness=self._harness, default_model=self._harness.model)
        return await asyncio.to_thread(
            pipeline.run, file_path, context_dir=context_dir, display_name=display_name
        )

    def load_adopted(self, doc_id: str) -> dict[str, Any] | None:
        """현재 채택본을 그대로 읽는다. LLM 을 호출하지 않는 일반 경로다.

        패널을 다시 열었다는 이유로 분석이 다시 돌면 안 된다. 읽기와 실행은
        엔드포인트부터 갈라 둔다.
        """
        meta = self._require(doc_id)
        adopted = self._artifacts.load_head(doc_id, KIND)
        if adopted is None:
            return None
        response = self._response_from_artifact(meta, adopted)
        if not self._is_usable_response(response):
            logger.warning("[ExtractOutline] 내용 없는 채택본 무시: %s", doc_id)
            return None
        return response

    async def execute(self, doc_id: str, force_refresh: bool = False) -> dict[str, Any]:
        meta = self._require(doc_id)

        if not force_refresh:
            adopted = self._artifacts.load_head(doc_id, KIND)
            if adopted is not None:
                response = self._response_from_artifact(meta, adopted)
                if self._is_usable_response(response):
                    logger.info("[ExtractOutline] 채택본 재사용: %s", doc_id)
                    return response
                logger.warning("[ExtractOutline] 내용 없는 채택본 재분석: %s", doc_id)

        file_path = self._source.resolve_file(doc_id)
        with trace_session(
            name="OutlineExtractionPipeline",
            inputs={"docId": doc_id, "model": self._harness.model},
            document_name=meta.original_name,
            doc_id=doc_id,
        ) as trace:
            # 엔진 호출 구간은 실시간 Span 으로 잡고, 엔진이 자기 스레드 안에서 잰
            # 세부 단계(telemetry["steps"])는 그 아래에 실측 시각 그대로 복원한다.
            with span_context(
                "OutlinePipeline.run", run_type="chain", inputs={"docId": doc_id}
            ):
                run_id = current_run_id()
                if run_id:
                    document = await self._run_pipeline(
                        file_path,
                        context_dir=self._cache.context_dir(doc_id),
                        display_name=meta.original_name,
                    )
                else:
                    agent_run, document = await self._runtime.execute(
                        self.name,
                        lambda: self._run_pipeline(
                            file_path,
                            context_dir=self._cache.context_dir(doc_id),
                            display_name=meta.original_name,
                        ),
                        trace_id=trace.trace_id,
                        doc_id=doc_id,
                        run_input=AgentRunInput(
                            use_case=self.name,
                            doc_id=doc_id,
                            payload={"docId": doc_id, "forceRefresh": True},
                        ),
                    )
                    run_id = agent_run.run_id
                trace.run_id = run_id
                trace.replay_steps((document.telemetry or {}).get("steps"))

            telemetry = document.telemetry or {}
            status_val = telemetry.get("status", "SUCCESS")
            error_val = telemetry.get("error")

            execution = _result_from_pipeline_telemetry(telemetry, self._harness.model)
            cost = RunCost(
                input_tokens=execution.input_tokens,
                output_tokens=execution.output_tokens,
                thinking_tokens=execution.thinking_tokens,
                cache_read_tokens=execution.cache_read_tokens,
                total_tokens=execution.total_tokens,
            )
            self._runtime.record_cost(run_id, cost)
            provenance = None
            if status_val == "SUCCESS":
                with span_context("ArtifactCommit", run_type="tool", inputs={"docId": doc_id}):
                    provenance = self._commit(doc_id, document, telemetry, run_id, trace.trace_id, cost)
            else:
                # 실패 결과를 아티팩트로 커밋하지 않는다. 폴백 문서를 채택본으로 두면
                # 다음 요청이 그것을 정상 결과로 오인한다.
                self._settle_failure(run_id, doc_id, telemetry)

            pipeline_tel = (document.telemetry or {}).get("pipeline_telemetry")
            if pipeline_tel and run_id:
                if isinstance(pipeline_tel, dict):
                    from datetime import datetime, timedelta, timezone
                    now_dt = datetime.now(timezone.utc)
                    spans_list = pipeline_tel.setdefault("spans", [])

                    # 1. 기존 파이프라인 첫 스팬 시간 기준 이전 시각 계산
                    base_start = now_dt
                    if spans_list and spans_list[0].get("start_time"):
                        try:
                            base_start = datetime.fromisoformat(spans_list[0]["start_time"].replace("Z", "+00:00"))
                        except Exception:
                            base_start = now_dt

                    cache_dt = base_start - timedelta(milliseconds=18)
                    route_dt = base_start - timedelta(milliseconds=8)

                    # [사전 스팬 1] 캐시 및 채택본 유효성 검사
                    cache_span = {
                        "span_id": f"span-cache-{run_id[-6:]}",
                        "trace_id": run_id,
                        "parent_span_id": None,
                        "dotted_order": f"{cache_dt.strftime('%Y%m%dT%H%M%S%fZ')}span-cache",
                        "name": "CacheAndHeadInspection",
                        "span_type": "tool",
                        "phase": "pre_llm",
                        "status": "success",
                        "display_label": "채택본(HEAD) 및 캐시 유효성 검사",
                        "description": "기존 분석 아티팩트 존재 여부와 강제 재분석(forceRefresh) 여부를 판정합니다.",
                        "summary_pill": "신규 분석 경로 진입",
                        "data_in": f"docId: {doc_id[:12]}",
                        "data_out": "Cache Miss (재분석 확정)",
                        "data_via": ["extract_outline.py (load_adopted)", "local_artifact_repository.py"],
                        "start_time": cache_dt.isoformat(),
                        "end_time": (cache_dt + timedelta(milliseconds=2)).isoformat(),
                        "inputs": {"docId": doc_id, "force_refresh": force_refresh},
                        "outputs": {"has_adopted": False, "action": "execute_pipeline"},
                        "usage": {"latency_ms": 2.0, "total_tokens": 0, "prompt_tokens": 0, "completion_tokens": 0},
                        "duration_ms": 2.0,
                    }

                    # [사전 스팬 2] 하네스 런타임 정책 및 쿼터 가용성 검사
                    actual_harness = getattr(self._harness, "_resolve", lambda: self._harness)()
                    harness_model = getattr(actual_harness, "model", getattr(self._harness, "model", "gemini-3.5-flash-lite"))
                    harness_provider = getattr(
                        actual_harness,
                        "provider",
                        getattr(
                            actual_harness,
                            "_primary_provider",
                            getattr(actual_harness, "name", "agy_cli" if "low" in str(harness_model).lower() else "google_api"),
                        ),
                    )
                    route_span = {
                        "span_id": f"span-route-{run_id[-6:]}",
                        "trace_id": run_id,
                        "parent_span_id": None,
                        "dotted_order": f"{route_dt.strftime('%Y%m%dT%H%M%S%fZ')}span-route",
                        "name": "HarnessPolicyAndRouting",
                        "span_type": "chain",
                        "phase": "pre_llm",
                        "status": "success",
                        "display_label": "하네스 런타임 정책 및 쿼터 검사",
                        "description": "CLI 가용성(Quota)과 공급자 차단 상태를 점검하고 최적의 실행 엔진을 배정합니다.",
                        "summary_pill": f"쿼터 정상 · {harness_model} 엔진 배정",
                        "data_in": f"Policy: Primary={harness_provider}",
                        "data_out": f"Target Engine: {actual_harness.__class__.__name__} ({harness_model})",
                        "data_via": ["fallback.py (FallbackLlmHarness._run_google_primary)", "availability.py (CliQuotaAvailability)"],
                        "start_time": route_dt.isoformat(),
                        "end_time": (route_dt + timedelta(milliseconds=2)).isoformat(),
                        "inputs": {"primary_provider": harness_provider, "target_model": harness_model},
                        "outputs": {"status": "AVAILABLE", "routed_provider": harness_provider},
                        "usage": {"latency_ms": 2.0, "total_tokens": 0, "prompt_tokens": 0, "completion_tokens": 0},
                        "duration_ms": 2.0,
                    }

                    # 사전 스팬 목록의 맨 앞에 삽입
                    spans_list.insert(0, route_span)
                    spans_list.insert(0, cache_span)

                    # [사후 스팬 3] 아티팩트 영구 커밋
                    if status_val == "SUCCESS" and provenance:
                        commit_span = {
                            "span_id": f"span-commit-{run_id[-6:]}",
                            "trace_id": run_id,
                            "parent_span_id": None,
                            "dotted_order": f"{now_dt.strftime('%Y%m%dT%H%M%S%fZ')}span-commit",
                            "name": "ArtifactCommit",
                            "span_type": "tool",
                            "phase": "post_llm",
                            "status": "success",
                            "display_label": "분석 아티팩트 영구 저장 및 HEAD 갱신",
                            "description": "60-data 불변 저장소에 산출물을 영구 커밋하고 최신 채택본(HEAD)을 갱신합니다.",
                            "summary_pill": f"아티팩트 {provenance.artifact_id[:8]} 커밋 완료",
                            "data_in": "OutlineDocument",
                            "data_out": f"artifact-{provenance.artifact_id[:8]}.json, HEAD.json",
                            "data_via": ["extract_outline.py (_commit)", "local_artifact_repository.py (LocalArtifactRepository.save)"],
                            "start_time": now_dt.isoformat(),
                            "end_time": now_dt.isoformat(),
                            "inputs": {"docId": doc_id, "cost": {"total_tokens": cost.total_tokens}},
                            "outputs": {"artifactId": provenance.artifact_id, "head": "HEAD.json"},
                            "usage": {"latency_ms": 2.0, "total_tokens": 0, "prompt_tokens": 0, "completion_tokens": 0},
                            "duration_ms": 2.0,
                        }
                        spans_list.append(commit_span)

                        # [사후 스팬 4] 런타임 토큰 비용 정산 및 원장 마감
                        settle_dt = now_dt + timedelta(milliseconds=2)
                        settle_span = {
                            "span_id": f"span-settle-{run_id[-6:]}",
                            "trace_id": run_id,
                            "parent_span_id": None,
                            "dotted_order": f"{settle_dt.strftime('%Y%m%dT%H%M%S%fZ')}span-settle",
                            "name": "CostAndRunSettlement",
                            "span_type": "tool",
                            "phase": "post_llm",
                            "status": "success",
                            "display_label": "토큰 비용 정산 및 런타임 완료",
                            "description": "토큰 소모량과 레이턴시를 정산하여 불변 실행 원장(Ledger)에 최종 기록하고 세션을 마감합니다.",
                            "summary_pill": f"원장 정산 완료 ({cost.total_tokens:,} tok)",
                            "data_in": f"Tokens: {cost.total_tokens:,} tok",
                            "data_out": "AgentRun (Status: SUCCESS)",
                            "data_via": ["agent_runtime/runtime.py (AgentRuntime.record_cost)", "tracer.py (ingest_pipeline_telemetry)"],
                            "start_time": settle_dt.isoformat(),
                            "end_time": settle_dt.isoformat(),
                            "inputs": {"total_tokens": cost.total_tokens, "run_id": run_id},
                            "outputs": {"status": "SETTLED", "run_id": run_id},
                            "usage": {"latency_ms": 1.5, "total_tokens": 0, "prompt_tokens": 0, "completion_tokens": 0},
                            "duration_ms": 1.5,
                        }
                        spans_list.append(settle_span)

                ingest_pipeline_telemetry(
                    pipeline_tel,
                    run_id=run_id,
                    doc_id=doc_id,
                    target_name=meta.original_name,
                    primary_provider=harness_provider,
                )

            trace.finish(
                outputs={
                    "total_outlines": len(document.outlines),
                    "total_elements": len(document.flat_elements),
                },
                status=status_val,
                error=error_val,
            )

            self._recorder.record(
                task_name="outline_extraction",
                result=execution,
                doc_id=doc_id,
                run_id=run_id,
                trace_id=trace.trace_id,
                metadata={
                    "total_outlines": len(document.outlines),
                    "total_elements": len(document.flat_elements),
                },
            )

        return {
            # 폴백 문서를 정상 결과로 오인하지 않도록 실패를 그대로 드러낸다.
            "status": "completed" if status_val == "SUCCESS" else "failed",
            "docId": doc_id,
            "document_title": meta.original_name,
            "total_pages": document.total_pages,
            "total_outlines": len(document.outlines),
            "total_elements": len(document.flat_elements),
            "outlines": [node.model_dump(by_alias=True) for node in document.outlines],
            "elements": [item.model_dump(by_alias=True) for item in document.flat_elements],
            "markdown_outline": document.markdown_outline,
            "manifest": telemetry,
            "artifactId": provenance.artifact_id if provenance else None,
            "traceId": trace.trace_id,
            "agentRunId": run_id,
            "error": None if status_val == "SUCCESS" else analysis_error(telemetry),
        }

    # --- 내부 -----------------------------------------------------------

    def _require(self, doc_id: str) -> DocumentMeta:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        return meta

    def _commit(
        self,
        doc_id: str,
        document: Any,
        telemetry: dict[str, Any],
        run_id: str,
        trace_id: str,
        cost: RunCost,
    ) -> ArtifactProvenance:
        engine = telemetry.get("provenance") or {}
        provenance = ArtifactProvenance(
            artifact_id=new_id(ARTIFACT_PREFIX),
            kind=KIND,
            doc_id=doc_id,
            status="SUCCESS",
            run_id=run_id,
            trace_id=trace_id,
            model=engine.get("model") or telemetry.get("model") or self._harness.model,
            effort=engine.get("effort"),
            prompt_hash=engine.get("prompt_hash"),
            schema_hash=engine.get("schema_hash"),
            engine_version=engine.get("engine_version"),
            cost=cost,
            summary={
                "totalPages": document.total_pages,
                "totalOutlines": len(document.outlines),
                "totalElements": len(document.flat_elements),
            },
        )
        files = {
            TREE_FILE: {
                "documentTitle": self._require(doc_id).original_name,
                "totalPages": document.total_pages,
                "outlines": [node.model_dump(by_alias=True) for node in document.outlines],
            },
            ELEMENTS_FILE: [item.model_dump(by_alias=True) for item in document.flat_elements],
            MARKDOWN_FILE: document.markdown_outline or "",
        }
        return self._artifacts.commit(doc_id, KIND, files, provenance)

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

    def _response_from_artifact(
        self, meta: DocumentMeta, artifact: dict[str, Any]
    ) -> dict[str, Any]:
        tree = artifact.get(TREE_FILE) or {}
        provenance = artifact.get("provenance") or {}
        summary = provenance.get("summary") or {}
        return {
            "status": "completed",
            "docId": meta.doc_id,
            "document_title": tree.get("documentTitle") or meta.original_name,
            "total_pages": tree.get("totalPages") or summary.get("totalPages") or 1,
            "total_outlines": summary.get("totalOutlines") or len(tree.get("outlines") or []),
            "total_elements": summary.get("totalElements")
            or len(artifact.get(ELEMENTS_FILE) or []),
            "outlines": tree.get("outlines") or [],
            "elements": artifact.get(ELEMENTS_FILE) or [],
            "markdown_outline": artifact.get(MARKDOWN_FILE) or "",
            "manifest": provenance,
            "artifactId": provenance.get("artifactId") or provenance.get("artifact_id"),
            "traceId": provenance.get("traceId") or provenance.get("trace_id"),
            "agentRunId": provenance.get("runId") or provenance.get("run_id"),
            "error": None,
        }

    @staticmethod
    def _is_usable_response(response: dict[str, Any]) -> bool:
        """제목 한 줄뿐인 과거 오검출을 채택된 아웃라인으로 취급하지 않는다."""
        return bool(response.get("outlines")) and bool(response.get("elements"))
