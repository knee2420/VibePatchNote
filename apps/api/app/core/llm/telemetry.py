"""LLM 실행 기록을 관측 계층에 남긴다.

기록은 두 갈래로 갈라진다. 같은 실행을 두 곳에 적는 중복이 아니라, 성격이 다른
두 자료다.

- **원장** `data/ledger/{YYYY-MM}.jsonl`
  모델·토큰·비용·실패 코드. 작고, 집계 대상이며, **쿼터 판정과 비용 귀속의 근거**다.
  지우면 다시 만들 수 없으므로 `data/` 에 두고 영구 보존한다.

- **트레이스** `state/log/traces/`
  프롬프트·응답 본문을 포함한 디버그 자료. 크고, 문서 원문을 담을 수 있어 민감하며,
  보존기간이 필요하다. 그래서 `state/` 에 두고 기간이 지나면 정리한다.

기록 실패가 본 작업을 막지는 않는다. 다만 조용히 넘기지도 않는다.
"""
from __future__ import annotations

import logging
from typing import Any

from scaffold_engine.harness import LlmExecutionResult

from app.core.agent_runtime.models import LedgerEntry, RunCost
from app.core.agent_runtime.ports import LedgerPort

logger = logging.getLogger(__name__)


def cost_of(result: LlmExecutionResult) -> RunCost:
    """실행 결과에서 자원 사용량만 뽑아낸다."""
    return RunCost(
        input_tokens=result.input_tokens or 0,
        output_tokens=result.output_tokens or 0,
        thinking_tokens=result.thinking_tokens or 0,
        cache_read_tokens=result.cache_read_tokens or 0,
        total_tokens=result.total_tokens or 0,
    )


class LedgerExecutionRecorder:
    """`ExecutionRecorder` 의 원장 구현."""

    def __init__(self, ledger: LedgerPort) -> None:
        self._ledger = ledger

    def record(
        self,
        *,
        task_name: str,
        result: LlmExecutionResult,
        doc_id: str | None = None,
        run_id: str | None = None,
        trace_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        telemetry = result.telemetry_metadata or {}
        failure_code = telemetry.get("failure_code") or telemetry.get("primary_failure_code")
        try:
            self._ledger.record(
                LedgerEntry(
                    run_id=run_id,
                    trace_id=trace_id,
                    doc_id=doc_id,
                    task_name=task_name,
                    provider=str(telemetry.get("provider") or ""),
                    model=result.model or "",
                    status=result.status or "",
                    failure_code=failure_code,
                    duration_seconds=result.duration_seconds or 0.0,
                    cost=cost_of(result),
                    metadata={**telemetry, **(metadata or {})},
                )
            )
        except Exception as exc:  # 관측은 부수 기능이다. 본 작업을 막지 않는다.
            logger.warning("[Ledger] 실행 기록 실패 (%s): %s", task_name, exc)
