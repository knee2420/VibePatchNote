"""백엔드 공통 LLM 진입점 (core/llm).

계약의 정본은 독립 모노레포 패키지인 `llm_driver`(`packages/llm-driver`)입니다.
이 패키지는 `llm_driver`의 핵심 계약을 재수출하며, 호스트 고유의 것(DI 조립, 원장/트레이스 파일 저장소)을 얹습니다.
"""
from llm_driver import (
    DEFAULT_MODEL_NAME,
    MODEL_REGISTRY,
    BaseLlmHarness,
    HarnessFactory,
    LlmExecutionResult,
    ModelSpec,
    UnsupportedProviderError,
    get_model_spec,
    parse_json_payload,
    register_model_spec,
    resolve_effort,
)

from app.core.llm.agy_status_snapshot import AgyStatusSnapshot
from app.core.llm.manager import LlmManager
from app.core.llm.policy_harness import RuntimePolicyHarness
from app.core.llm.ports import ExecutionRecorder, ModelExecutor
from app.core.llm.telemetry import LedgerExecutionRecorder, cost_of
from app.core.llm.tracer import (
    LlmSpan,
    LlmTrace,
    delete_traces_for_document,
    get_current_span,
    get_current_trace,
    get_trace,
    ingest_pipeline_telemetry,
    list_traces,
    purge_expired_traces,
    span_context,
    trace_session,
)

__all__ = [
    # 엔진 계약 재수출
    "BaseLlmHarness",
    "LlmExecutionResult",
    "ModelSpec",
    "MODEL_REGISTRY",
    "DEFAULT_MODEL_NAME",
    "HarnessFactory",
    "UnsupportedProviderError",
    "get_model_spec",
    "register_model_spec",
    "resolve_effort",
    "parse_json_payload",
    # 호스트 고유
    "LlmManager",
    "RuntimePolicyHarness",
    "AgyStatusSnapshot",
    # 계약
    "ModelExecutor",
    "ExecutionRecorder",
    # 관측
    "LedgerExecutionRecorder",
    "cost_of",
    "LlmTrace",
    "LlmSpan",
    "trace_session",
    "span_context",
    "get_current_trace",
    "get_current_span",
    "list_traces",
    "get_trace",
    "ingest_pipeline_telemetry",
    "purge_expired_traces",
    "delete_traces_for_document",
]
