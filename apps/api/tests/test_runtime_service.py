"""Agent Runtime 컨트롤 플레인 엔드포인트 및 서비스 테스트."""
from __future__ import annotations

from agent_runtime import (
    AgentRunEvent,
    AgentRunInput,
    AgentRuntime,
    ApprovalService,
    LocalAgentRunRepository,
    LocalAgreementRepository,
    LocalLedger,
)
from dependency_injector import providers
from fastapi.testclient import TestClient

import main
from app.core.storage import StorageRoots
from app.runtime.service import RuntimeService


def test_runtime_router_endpoints(tmp_path) -> None:
    roots = StorageRoots(tmp_path)
    roots.ensure()
    runs_repo = LocalAgentRunRepository(roots.runs)
    agreement_repo = LocalAgreementRepository(roots.agreements)
    ledger = LocalLedger(roots.ledger)
    approvals = ApprovalService(agreement_repo)
    runtime = AgentRuntime(runs=runs_repo, approvals=approvals, ledger=ledger)

    # 더미 유스케이스 등록
    runtime.register_use_case("dummy_task", lambda payload: None)

    # 1. Run 생성
    runs_repo.append(
        "run_test_001",
        AgentRunEvent(type="started", agent_name="dummy_task", doc_id="doc_abc"),
    )
    runs_repo.save_input(
        "run_test_001",
        AgentRunInput(use_case="dummy_task", doc_id="doc_abc", payload={"docId": "doc_abc"}),
    )

    # 2. Agreement 생성
    agreement = approvals.request(
        "configure_google_api",
        run_id="run_test_001",
        doc_id="doc_abc",
        reason="Quota exhausted",
    )

    test_service = RuntimeService(agent_runtime=runtime, approvals=approvals)

    with main.container.runtime_service.override(providers.Object(test_service)):
        with TestClient(main.app) as client:
            # GET /api/v1/runtime/runs/{run_id}
            run_resp = client.get("/api/v1/runtime/runs/run_test_001")
            assert run_resp.status_code == 200
            run_body = run_resp.json()
            assert run_body["runId"] == "run_test_001"
            assert run_body["agentName"] == "dummy_task"
            assert run_body["status"] == "running"

            # GET /api/v1/runtime/runs/non-existent
            assert client.get("/api/v1/runtime/runs/not_found").status_code == 404

            # GET /api/v1/runtime/agreements/pending
            pending_resp = client.get("/api/v1/runtime/agreements/pending")
            assert pending_resp.status_code == 200
            pending_list = pending_resp.json()
            assert len(pending_list) == 1
            assert pending_list[0]["agreementId"] == agreement.agreement_id

            # POST /api/v1/runtime/agreements/{id} (결정)
            decide_resp = client.post(
                f"/api/v1/runtime/agreements/{agreement.agreement_id}",
                json={"approved": True},
            )
            assert decide_resp.status_code == 200
            assert decide_resp.json()["status"] == "approved"

            # POST /api/v1/runtime/runs/{run_id}/resume
            resume_resp = client.post("/api/v1/runtime/runs/run_test_001/resume")
            assert resume_resp.status_code == 202
            assert resume_resp.json()["runId"] == "run_test_001"
