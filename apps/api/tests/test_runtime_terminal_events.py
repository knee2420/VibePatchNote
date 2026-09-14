"""종결 기록이 실패해도 run 은 반드시 끝난다.

예전에는 성공 경로의 `AgentRunEvent(type="succeeded", result=...)` 구성이
try 블록 **밖**에 있었다. 유스케이스가 dict 가 아닌 값을 돌려주면 그 자리에서
검증이 터졌고, 예외를 아무도 받지 않아 태스크만 조용히 죽었다. run 은 영원히
running 으로 남고 화면은 끝나지 않는 스피너를 돌렸다 — 실패보다 나쁜 결말이다.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

from agent_core.runtime.repository import LocalAgentRunRepository
from agent_core.runtime.runtime import UNRECORDABLE_RESULT_CODE, AgentRuntime


async def _settle(run_id: str, repository: LocalAgentRunRepository):
    """실행 태스크가 끝날 때까지 기다린 뒤 현재 상태를 읽는다."""
    for _ in range(200):
        run = repository.get(run_id)
        if run is not None and run.is_terminal:
            return run
        await asyncio.sleep(0.01)
    return repository.get(run_id)


def test_non_dict_result_fails_the_run_instead_of_hanging(tmp_path: Path) -> None:
    repository = LocalAgentRunRepository(tmp_path / "runs")
    runtime = AgentRuntime(repository)

    async def scenario() -> None:
        async def returns_a_non_dict() -> dict:
            return object()  # type: ignore[return-value]

        run = await runtime.submit("test.bad_result", returns_a_non_dict)
        settled = await _settle(run.run_id, repository)

        assert settled is not None
        assert settled.status == "failed", (
            "결과를 못 남겼으면 실패로 끝나야 한다. running 으로 남으면 화면이 영원히 돈다."
        )
        assert settled.error_code == UNRECORDABLE_RESULT_CODE

    asyncio.run(scenario())


def test_dict_result_still_succeeds(tmp_path: Path) -> None:
    repository = LocalAgentRunRepository(tmp_path / "runs")
    runtime = AgentRuntime(repository)

    async def scenario() -> None:
        async def returns_a_dict() -> dict:
            return {"ok": True}

        run = await runtime.submit("test.good_result", returns_a_dict)
        settled = await _settle(run.run_id, repository)

        assert settled is not None
        assert settled.status == "completed"
        assert settled.result == {"ok": True}

    asyncio.run(scenario())
