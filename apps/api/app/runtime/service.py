"""Agent Runtime 컨트롤 플레인 서비스.

비즈니스 도메인과 무관하게 실행 상태(Run)의 조회·재개 및 사람의 결정(Agreement)을 처리합니다.
"""
from __future__ import annotations

from typing import Any

from agent_runtime import AgentRuntime, ApprovalService


class RuntimeService:
    """에이전트 실행 상태 조회·재개 및 사람 승인을 전담하는 서비스."""

    def __init__(
        self,
        agent_runtime: AgentRuntime,
        approvals: ApprovalService,
    ) -> None:
        self._runtime = agent_runtime
        self._approvals = approvals

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        run = self._runtime.get(run_id)
        if run is None:
            return None
        return {
            "runId": run.run_id,
            "agentName": run.agent_name,
            "status": run.status,
            "attempt": run.attempt,
            "docId": run.doc_id,
            "agreementId": run.agreement_id,
            "traceId": run.trace_id,
            "errorCode": run.error_code,
            "cost": run.cost.model_dump(mode="json") if run.cost else {},
            "result": run.result,
            "execution": run.metadata.get("execution"),
        }

    async def resume_run(self, run_id: str) -> dict[str, Any] | None:
        run = await self._runtime.resume(run_id)
        if run is None:
            return None
        return {"runId": run.run_id, "status": run.status, "attempt": run.attempt}

    def list_pending_agreements(self) -> list[dict[str, Any]]:
        return [
            agreement.model_dump(mode="json")
            for agreement in self._approvals.list_pending()
        ]

    async def decide_agreement(self, agreement_id: str, approved: bool) -> dict[str, Any] | None:
        """사람의 결정을 기록하고, 승인이면 그 결정이 막고 있던 실행을 이어간다.

        기록만 하고 끝내면 사용자는 "승인했는데 아무 일도 일어나지 않는" 상태를
        만난다. 대기 토큰은 정의상 실행 하나를 막고 있으므로, 승인의 의미는
        곧 그 실행의 재개다.

        **이번 호출이 실제로 상태를 바꿨을 때만** 재개한다. `decide` 는 이미
        내려진 결정을 그대로 돌려주므로(결정 기록은 불변), 반환값만 보면 같은
        승인을 두 번 눌렀을 때도 재개가 두 번 일어난다.
        """
        before = self._approvals.get(agreement_id)
        if before is None:
            return None
        was_pending = before.status == "pending"

        agreement = self._approvals.decide(agreement_id, approved)
        if agreement is None:
            return None

        if was_pending and agreement.status == "approved" and agreement.run_id:
            await self._runtime.resume(agreement.run_id)

        return agreement.model_dump(mode="json")
