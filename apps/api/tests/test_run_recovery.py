"""실행 상태는 로그가 아니라 재개 가능한 데이터다.

중단·재개가 요구사항인 이상, 프로세스가 죽어도 "무엇을 어디까지 했는가"가 남아야
한다. 그리고 끊긴 실행이 영원히 "분석 중"으로 남아서는 안 된다.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

import pytest
from agent_runtime import (
    INTERRUPTED_CODE,
    AgentRunEvent,
    AgentRunInput,
    AgentRuntime,
    ApprovalService,
    LedgerEntry,
    LocalAgentRunRepository,
    LocalAgreementRepository,
    LocalLedger,
    RunCost,
    report_progress,
)

from app.core.storage import StorageRoots


@pytest.fixture()
def roots(tmp_path: Path) -> StorageRoots:
    storage = StorageRoots(tmp_path)
    storage.ensure()
    return storage


@pytest.fixture()
def runtime(roots: StorageRoots) -> AgentRuntime:
    return AgentRuntime(
        runs=LocalAgentRunRepository(roots.runs),
        approvals=ApprovalService(LocalAgreementRepository(roots.agreements)),
        ledger=LocalLedger(roots.ledger),
    )


def test_state_is_folded_from_history(roots: StorageRoots) -> None:
    """스냅샷은 파생이다. 지워도 이력에서 같은 상태가 나와야 한다."""
    repository = LocalAgentRunRepository(roots.runs)
    repository.append("run-1", AgentRunEvent(type="started", agent_name="documents.outline"))
    repository.append("run-1", AgentRunEvent(type="cost_recorded", cost=RunCost(total_tokens=120)))
    repository.append("run-1", AgentRunEvent(type="succeeded", result={"ok": True}))

    (roots.runs / "run-1" / "snapshot.json").unlink()

    run = repository.get("run-1")
    assert run is not None
    assert run.status == "completed"
    assert run.cost.total_tokens == 120
    assert run.result == {"ok": True}


def test_interrupted_runs_are_swept_on_boot(runtime: AgentRuntime, roots: StorageRoots) -> None:
    """프로세스와 함께 끊긴 실행은 부팅 시 실패로 확정된다."""
    repository = LocalAgentRunRepository(roots.runs)
    repository.append("run-running", AgentRunEvent(type="started", agent_name="a"))
    repository.append("run-queued", AgentRunEvent(type="queued", agent_name="a"))

    swept = runtime.sweep_orphans()

    assert {run.run_id for run in swept} == {"run-running", "run-queued"}
    assert all(run.error_code == INTERRUPTED_CODE for run in swept)
    assert runtime._runs.list_unfinished() == []


def test_waiting_runs_survive_the_sweep(runtime: AgentRuntime) -> None:
    """사람의 결정을 기다리는 실행은 실패가 아니라 보류다. 정리 대상이 아니다."""
    runtime._runs.append("run-wait", AgentRunEvent(type="started", agent_name="a"))
    run = runtime.mark_waiting(
        "run-wait", failure_code="QUOTA_EXHAUSTED", doc_id="doc-1", reason="한도 소진"
    )

    assert run is not None
    assert run.status == "waiting_for_configuration"
    assert run.agreement_id is not None

    assert runtime.sweep_orphans() == []
    assert runtime.get("run-wait").status == "waiting_for_configuration"


def test_agreement_outlives_the_process(roots: StorageRoots) -> None:
    """승인 대기는 프로세스 밖에 남아야 재시작을 넘어 살아남는다."""
    approvals = ApprovalService(LocalAgreementRepository(roots.agreements))
    agreement = approvals.request(
        "configure_google_api", run_id="run-1", doc_id="doc-1", reason="한도 소진"
    )

    reloaded = ApprovalService(LocalAgreementRepository(roots.agreements))
    assert [item.agreement_id for item in reloaded.list_pending()] == [agreement.agreement_id]

    decided = reloaded.decide(agreement.agreement_id, approved=True)
    assert decided is not None and decided.status == "approved"
    # 내려진 결정은 다시 쓰이지 않는다.
    assert reloaded.decide(agreement.agreement_id, approved=False).status == "approved"


def test_resume_needs_a_registered_use_case(runtime: AgentRuntime) -> None:
    """재개는 클로저가 아니라 '이름 + 입력 스냅샷'으로만 가능하다."""
    from agent_runtime import AgentRunInput

    calls: list[str] = []

    async def handler(payload: dict) -> dict:
        calls.append(payload["docId"])
        return {"ok": True}

    runtime.register_use_case("documents.extract_outline", handler)
    runtime._runs.save_input(
        "run-1",
        AgentRunInput(use_case="documents.extract_outline", doc_id="doc-1", payload={"docId": "doc-1"}),
    )
    runtime._runs.append("run-1", AgentRunEvent(type="started", agent_name="a"))
    runtime.mark_failed("run-1", error_code=INTERRUPTED_CODE)

    async def scenario() -> None:
        run = await runtime.resume("run-1")
        assert run is not None and run.attempt == 2
        await asyncio.sleep(0)  # 백그라운드 태스크가 한 바퀴 돌 기회를 준다.
        await asyncio.sleep(0)

    asyncio.run(scenario())
    assert calls == ["doc-1"]


def test_ledger_is_append_only(roots: StorageRoots) -> None:
    """원장은 수정하지 않는다. 공급자 차단 상태는 이 원장의 파생이다."""
    ledger = LocalLedger(roots.ledger)
    ledger.record(LedgerEntry(task_name="outline", model="m1", status="SUCCESS"))
    ledger.record(LedgerEntry(task_name="outline", model="m2", status="FAILED"))

    entries = list(ledger.entries())
    assert len(entries) == 2
    assert {entry.model for entry in entries} == {"m1", "m2"}


def test_submitted_run_keeps_provider_progress(runtime: AgentRuntime) -> None:
    async def operation() -> dict:
        report_progress({
            "execution": {
                "phase": "running",
                "provider": "google-api",
                "model": "gemini-test",
                "routeReason": "cli_quota_exhausted",
            }
        })
        return {"ok": True}

    async def scenario() -> None:
        accepted = await runtime.submit("documents.scan", operation)
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        completed = runtime.get(accepted.run_id)
        assert completed is not None
        assert completed.status == "completed"
        assert completed.metadata["execution"]["provider"] == "google-api"
        assert completed.metadata["execution"]["model"] == "gemini-test"

    asyncio.run(scenario())


def test_operation_failure_is_not_overwritten_by_submit_success(runtime: AgentRuntime) -> None:
    async def scenario() -> None:
        run_id = ""

        async def operation() -> dict:
            runtime.mark_failed(run_id, error_code="PIPELINE_FAILED")
            return {"status": "failed"}

        accepted = await runtime.submit("documents.scan", operation)
        run_id = accepted.run_id
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        failed = runtime.get(run_id)
        assert failed is not None
        assert failed.status == "failed"
        assert failed.error_code == "PIPELINE_FAILED"

    asyncio.run(scenario())


def test_approval_resumes_the_run_it_was_blocking(runtime: AgentRuntime, roots: StorageRoots) -> None:
    """승인은 기록이 아니라 재개다.

    대기 토큰은 정의상 실행 하나를 막고 있다. 결정만 파일에 적고 끝내면
    사용자는 "승인했는데 아무 일도 일어나지 않는" 상태를 만난다.
    """
    from app.runtime.service import RuntimeService

    calls: list[str] = []

    async def handler(payload: dict) -> dict:
        calls.append(payload["docId"])
        return {"ok": True}

    runtime.register_use_case("documents.extract_outline", handler)
    runtime._runs.save_input(
        "run-1",
        AgentRunInput(
            use_case="documents.extract_outline", doc_id="doc-1", payload={"docId": "doc-1"}
        ),
    )
    runtime._runs.append("run-1", AgentRunEvent(type="started", agent_name="outline"))
    waiting = runtime.mark_waiting(
        "run-1", failure_code="QUOTA_EXHAUSTED", doc_id="doc-1", reason="한도 소진"
    )
    assert waiting is not None and waiting.status == "waiting_for_configuration"
    agreement_id = waiting.agreement_id
    assert agreement_id

    approvals = ApprovalService(LocalAgreementRepository(roots.agreements))
    service = RuntimeService(agent_runtime=runtime, approvals=approvals)

    async def scenario() -> None:
        decided = await service.decide_agreement(agreement_id, approved=True)
        assert decided is not None and decided["status"] == "approved"
        await asyncio.sleep(0)
        await asyncio.sleep(0)

        # 같은 승인을 다시 눌러도 재개는 한 번뿐이다. 결정 기록은 불변이다.
        await service.decide_agreement(agreement_id, approved=True)
        await asyncio.sleep(0)
        await asyncio.sleep(0)

    asyncio.run(scenario())
    assert calls == ["doc-1"]


def test_declined_agreement_does_not_resume(runtime: AgentRuntime, roots: StorageRoots) -> None:
    """거절은 '이어가지 않기로 한 결정'이다."""
    from app.runtime.service import RuntimeService

    calls: list[str] = []

    async def handler(payload: dict) -> dict:
        calls.append(payload["docId"])
        return {"ok": True}

    runtime.register_use_case("documents.extract_outline", handler)
    runtime._runs.save_input(
        "run-2",
        AgentRunInput(
            use_case="documents.extract_outline", doc_id="doc-2", payload={"docId": "doc-2"}
        ),
    )
    runtime._runs.append("run-2", AgentRunEvent(type="started", agent_name="outline"))
    waiting = runtime.mark_waiting(
        "run-2", failure_code="AUTH_EXPIRED", doc_id="doc-2", reason="인증 만료"
    )
    assert waiting is not None and waiting.agreement_id

    service = RuntimeService(
        agent_runtime=runtime,
        approvals=ApprovalService(LocalAgreementRepository(roots.agreements)),
    )

    async def scenario() -> None:
        await service.decide_agreement(waiting.agreement_id, approved=False)
        await asyncio.sleep(0)
        await asyncio.sleep(0)

    asyncio.run(scenario())
    assert calls == []


def test_recorded_cost_reaches_the_ledger(runtime: AgentRuntime, roots: StorageRoots) -> None:
    """비용의 정본은 원장이다. 그런데 한동안 아무도 원장에 적지 않았다.

    `LedgerExecutionRecorder` 는 컨테이너가 만들어 유스케이스에 주입까지 했지만
    한 번도 호출되지 않았고, `data/ledger/` 는 어느 시점부터 조용히 멈췄다.
    관측 화면이 텔레메트리 합산으로 폴백하고 있어서 아무도 눈치채지 못했다.
    """
    runtime._runs.append("run-cost", AgentRunEvent(type="started", agent_name="outline", doc_id="doc-9"))
    runtime.record_cost(
        "run-cost",
        RunCost(input_tokens=10, output_tokens=5, total_tokens=15),
        model="test-model",
        status="SUCCESS",
    )

    entries = list(LocalLedger(roots.ledger).entries())
    assert len(entries) == 1
    entry = entries[0]
    assert entry.run_id == "run-cost"
    assert entry.doc_id == "doc-9"
    assert entry.task_name == "outline"
    assert entry.model == "test-model"
    assert entry.cost.total_tokens == 15
