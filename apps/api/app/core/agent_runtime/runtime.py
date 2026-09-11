"""Agent 수행 전후 상태를 일관되게 남기는 공통 런타임.

일반 CRUD 요청은 이 런타임을 쓰지 않는다. LLM 이 개입해 오래 걸리고, 도중에
사람의 결정을 기다릴 수 있으며, 실패해도 다시 이어갈 수 있어야 하는 실행만
여기를 통과한다.

도메인 세부(문서·PDF·프롬프트)는 알지 못한다. 아는 것은 실행의 생애주기뿐이다.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Awaitable, Callable, TypeVar

from app.core.storage import RUN_PREFIX, new_id

from .approval import ApprovalService
from .events import AgentRunEvent
from .models import AgentRun, AgentRunInput, RunCost
from .policy import DEFAULT_RETRY_POLICY, RetryPolicy
from .ports import AgentRunRepository, LedgerPort
from .progress import bind_progress

logger = logging.getLogger(__name__)

T = TypeVar("T")

# 재개 가능한 유스케이스: 이름 -> 페이로드를 받아 결과를 돌려주는 코루틴 팩토리.
ResumeHandler = Callable[[dict[str, Any]], Awaitable[dict[str, Any]]]

# 프로세스가 죽어 끊긴 실행에 붙이는 코드. 일반 실패와 구분해야 재개 대상을 고를 수 있다.
INTERRUPTED_CODE = "AGENT_RUN_INTERRUPTED"


class AgentRuntime:
    """실행 이력·대기·재개를 책임지는 도메인 무관 런타임."""

    def __init__(
        self,
        runs: AgentRunRepository,
        approvals: ApprovalService | None = None,
        ledger: LedgerPort | None = None,
        policy: RetryPolicy = DEFAULT_RETRY_POLICY,
    ) -> None:
        self._runs = runs
        self._approvals = approvals
        self._ledger = ledger
        self._policy = policy
        self._resume_handlers: dict[str, ResumeHandler] = {}
        # create_task 의 반환값을 붙들지 않으면 실행 도중 태스크가 수거될 수 있다.
        self._pending: set[asyncio.Task[None]] = set()

    # --- 재개 등록 -------------------------------------------------------

    def register_use_case(self, name: str, handler: ResumeHandler) -> None:
        """재개 시 다시 호출할 유스케이스를 이름으로 등록한다.

        클로저는 프로세스와 함께 사라지므로, 재개는 "이름 + 입력 스냅샷"으로만
        가능하다. 등록되지 않은 유스케이스의 run 은 재개할 수 없다.
        """
        self._resume_handlers[name] = handler

    # --- 실행 -----------------------------------------------------------

    async def execute(
        self,
        agent_name: str,
        operation: Callable[[], Awaitable[T]],
        *,
        trace_id: str | None = None,
        doc_id: str | None = None,
        run_input: AgentRunInput | None = None,
    ) -> tuple[AgentRun, T]:
        """호출자가 결과를 기다리는 동기형 실행."""
        run_id = new_id(RUN_PREFIX)
        if run_input:
            self._runs.save_input(run_id, run_input)
        run = self._runs.append(
            run_id,
            AgentRunEvent(
                type="started", agent_name=agent_name, trace_id=trace_id, doc_id=doc_id
            ),
        )

        try:
            with bind_progress(
                lambda detail: self._runs.append(
                    run_id, AgentRunEvent(type="progressed", detail=detail)
                ),
                run_id,
            ):
                result = await operation()
        except Exception as exc:
            self._runs.append(
                run_id,
                AgentRunEvent(
                    type="failed",
                    error_code="AGENT_EXECUTION_FAILED",
                    detail={"error": str(exc)},
                ),
            )
            raise

        current = self._runs.get(run_id)
        if current is not None and (current.is_waiting or current.status == "failed"):
            return current, result
        run = self._runs.append(run_id, AgentRunEvent(type="succeeded"))
        return run, result

    async def submit(
        self,
        agent_name: str,
        operation: Callable[[], Awaitable[dict[str, Any]]],
        *,
        doc_id: str | None = None,
        run_input: AgentRunInput | None = None,
    ) -> AgentRun:
        """요청을 즉시 수락하고 결과는 run 조회로 전달한다."""
        run_id = new_id(RUN_PREFIX)
        if run_input:
            self._runs.save_input(run_id, run_input)
        run = self._runs.append(
            run_id, AgentRunEvent(type="queued", agent_name=agent_name, doc_id=doc_id)
        )
        self._spawn(run_id, agent_name, operation)
        return run

    async def resume(self, run_id: str) -> AgentRun | None:
        """끊겼거나 대기 중이던 실행을 입력 스냅샷으로 다시 시작한다."""
        run = self._runs.get(run_id)
        if run is None:
            return None
        # 정상 종료된 실행은 다시 돌리지 않는다. 끊긴 실행만 재개 대상이다.
        if run.is_terminal and run.error_code != INTERRUPTED_CODE:
            return run

        payload = self._runs.get_input(run_id)
        if payload is None:
            logger.warning("[AgentRuntime] 입력 스냅샷이 없어 재개할 수 없습니다: %s", run_id)
            return run

        handler = self._resume_handlers.get(payload.use_case)
        if handler is None:
            logger.warning(
                "[AgentRuntime] 등록되지 않은 유스케이스라 재개할 수 없습니다: %s",
                payload.use_case,
            )
            return run

        run = self._runs.append(run_id, AgentRunEvent(type="resumed", doc_id=payload.doc_id))
        self._spawn(run_id, run.agent_name, lambda: handler(payload.payload))
        return run

    # --- 상태 전이 -------------------------------------------------------

    def mark_waiting(
        self,
        run_id: str,
        *,
        failure_code: str | None,
        doc_id: str | None = None,
        reason: str = "",
    ) -> AgentRun | None:
        """사람의 결정을 기다리는 상태로 전이하고 대기 토큰을 발급한다."""
        agreement = None
        if self._approvals is not None:
            agreement = self._approvals.request_for_failure(
                failure_code, run_id=run_id, doc_id=doc_id, reason=reason
            )
        return self._runs.append(
            run_id,
            AgentRunEvent(
                type="waiting",
                status="waiting_for_configuration" if agreement else "waiting_for_approval",
                agreement_id=agreement.agreement_id if agreement else None,
                error_code=failure_code,
                doc_id=doc_id,
            ),
        )

    def mark_failed(self, run_id: str, *, error_code: str, detail: str = "") -> AgentRun | None:
        """이미 접수된 실행을 실패로 확정한다.

        예외로 끝나지 않고 "실패한 결과"를 돌려주는 파이프라인이 있다. 그 경우
        호출부가 판정한 실패를 이력에 남기는 통로가 필요하다.
        """
        return self._runs.append(
            run_id,
            AgentRunEvent(
                type="failed",
                error_code=error_code,
                detail={"error": detail} if detail else {},
            ),
        )

    def record_cost(self, run_id: str, cost: RunCost) -> None:
        """실행이 쓴 자원을 이력에 누적한다. 원장 기록은 호출부가 따로 한다."""
        self._runs.append(run_id, AgentRunEvent(type="cost_recorded", cost=cost))

    def get(self, run_id: str) -> AgentRun | None:
        return self._runs.get(run_id)

    # --- 부팅 복구 -------------------------------------------------------

    def sweep_orphans(self) -> list[AgentRun]:
        """프로세스와 함께 끊긴 실행을 정리한다.

        queued / running 인 채로 남은 run 은 이 프로세스에 존재하지 않는다.
        그대로 두면 사용자에게 영원히 "분석 중"으로 보인다. 대기 상태(사람의 결정을
        기다리는 중)는 정상이므로 건드리지 않는다.
        """
        swept: list[AgentRun] = []
        for run in self._runs.list_unfinished():
            if run.is_waiting:
                continue
            swept.append(
                self._runs.append(
                    run.run_id,
                    AgentRunEvent(
                        type="failed",
                        error_code=INTERRUPTED_CODE,
                        detail={"error": "서버가 재시작되어 실행이 끊겼습니다."},
                    ),
                )
            )
        if swept:
            logger.info("[AgentRuntime] 끊긴 실행 %d건을 정리했습니다.", len(swept))
        return swept

    # --- 내부 -----------------------------------------------------------

    def _spawn(
        self,
        run_id: str,
        agent_name: str,
        operation: Callable[[], Awaitable[dict[str, Any]]],
    ) -> None:
        async def run_operation() -> None:
            self._runs.append(run_id, AgentRunEvent(type="started", agent_name=agent_name))
            try:
                with bind_progress(
                    lambda detail: self._runs.append(
                        run_id, AgentRunEvent(type="progressed", detail=detail)
                    ),
                    run_id,
                ):
                    result = await operation()
            except Exception as exc:
                self._runs.append(
                    run_id,
                    AgentRunEvent(
                        type="failed",
                        error_code="AGENT_EXECUTION_FAILED",
                        detail={"error": str(exc)},
                    ),
                )
                logger.exception("[AgentRuntime] 실행 실패 (%s): %s", run_id, exc)
                return
            current = self._runs.get(run_id)
            if current is not None and (current.is_waiting or current.status == "failed"):
                return
            self._runs.append(run_id, AgentRunEvent(type="succeeded", result=result))

        task = asyncio.create_task(run_operation(), name=run_id)
        self._pending.add(task)
        task.add_done_callback(self._pending.discard)
