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

    def decide_agreement(self, agreement_id: str, approved: bool) -> dict[str, Any] | None:
        agreement = self._approvals.decide(agreement_id, approved)
        return agreement.model_dump(mode="json") if agreement else None
