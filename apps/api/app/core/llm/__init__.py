"""백엔드 공통 LLM 진입점 (core/llm).

**계약의 정본은 `scaffold_engine.harness` 다.** 이 패키지는 그 계약을 다시 정의하지 않고
그대로 재수출하며, 호스트에만 있는 것 세 가지를 얹는다:

1. 설정 주입 — `settings.agent_cli_bin` / `agent_cli_model` / `agent_cli_timeout_seconds`
2. 프로바이더 확장 — 로컬 서빙 / SDK 직결 어댑터를 팩토리에 등록
3. 관측 — 원장(`data/ledger/`)과 디버그 트레이스(`state/log/traces/`)

의존 방향은 `apps/api → packages/scaffold-engine` 한쪽뿐이다(P1). 엔진이 이 패키지를
import 하는 일은 없어야 한다.
"""
from scaffold_engine.harness import (
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
