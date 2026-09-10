"""core/llm 이 양쪽에 노출하는 계약.

두 방향이 있다.

1. **엔진 방향** — `packages/scaffold-engine` 은 `ModelExecutor` Protocol 만 안다.
   엔진이 `app.core.llm` 을 import 하는 일은 없어야 한다. 구현을 넣어 주는 것은
   `bootstrap/container.py` 의 일이다.

2. **도메인 방향** — 도메인은 "누가 실행했고 얼마를 썼는가"를 기록할 곳이 필요하다.
   그 기록 위치(원장/트레이스 파일)를 도메인이 알 필요는 없으므로 포트로 가린다.
"""
from __future__ import annotations

from typing import Protocol

from scaffold_engine.contracts import ModelExecutor
from scaffold_engine.harness import LlmExecutionResult

__all__ = ["ModelExecutor", "LlmExecutionResult", "ExecutionRecorder"]


class ExecutionRecorder(Protocol):
    """LLM 실행 결과를 관측 계층에 남기는 계약.

    구현은 원장(`data/ledger/`)에 집계 가능한 한 줄을 덧붙이고, 디버그 트레이스는
    별도 보존정책을 갖는 `state/log/traces/` 에 남긴다. 도메인은 그 분리를 모른다.
    """

    def record(
        self,
        *,
        task_name: str,
        result: LlmExecutionResult,
        doc_id: str | None = None,
        run_id: str | None = None,
        trace_id: str | None = None,
        metadata: dict | None = None,
    ) -> None: ...
