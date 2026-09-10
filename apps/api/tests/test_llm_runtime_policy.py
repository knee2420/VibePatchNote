"""설정 UI 가 바꾼 런타임 정책이 재시작 없이 문서 분석에 반영되는지 확인한다.

회귀의 모양이 테스트 순서를 정한다. 컨테이너가 하네스를 첫 해석 시점의 모델·타임아웃으로
한 번 만들고, 싱글턴 `DocumentService` 가 유스케이스(와 그 안의 하네스)를 프로세스 수명
내내 쥐고 있었다. 그래서 에이전트를 **정책을 바꾸기 전에** 먼저 꺼내 두고, 바꾼 뒤 그
에이전트가 실제로 무엇으로 실행하는지 본다.
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any, Iterator

import pymupdf
import pytest
from dependency_injector import providers
from scaffold_engine.harness import AgyCliHarness, HarnessFactory, LlmExecutionResult

from app.bootstrap.container import Container
from app.core.config import settings
from app.core.llm.adapters import GoogleGenAiHarness
from app.core.llm.fallback import PRIMARY_PROVIDER_ID
from app.core.llm.provider_state import ProviderStateStore

OLD_PRIMARY, OLD_PRIMARY_TIMEOUT = "claude-sonnet-4-6", 120
OLD_FALLBACK, OLD_FALLBACK_TIMEOUT = "gemini-2.5-flash", 90
NEW_PRIMARY, NEW_PRIMARY_TIMEOUT = "gpt-oss-120b-medium", 240
NEW_FALLBACK, NEW_FALLBACK_TIMEOUT = "gemini-2.5-pro", 45


class FakeCredentialStore:
    """OS 키링을 건드리지 않는다. 보조 경로가 열리도록 키가 있는 척만 한다."""

    def get_google_api_key(self) -> str:
        return "AIza-test-only"

    def set_google_api_key(self, api_key: str) -> None:
        raise AssertionError("unexpected write")

    def delete_google_api_key(self) -> None:
        raise AssertionError("unexpected delete")


class InMemoryPolicyRepository:
    """설정 등급(config/) 파일 대신 메모리에 정책을 둔다."""

    def __init__(self) -> None:
        self.saved: dict[str, object] | None = None

    def load(self) -> dict[str, object] | None:
        return self.saved

    def save(self, policy: dict[str, object]) -> None:
        self.saved = dict(policy)


class ExecutionLog:
    """구체 하네스가 실제로 받은 (공급자, 모델, 타임아웃)과 CLI 가 돌려줄 실패 문구."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, str, int]] = []
        # 보조 경로 조건(quota·auth·timeout 등)에 걸리지 않는 실패. 보조 공급자로 넘어가지 않는다.
        self.cli_error = "stubbed CLI did not run"


@pytest.fixture
def container(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[Container]:
    # 정책은 전역 settings 에 산다. 시작값을 고정하고, 끝나면 monkeypatch 가 원래 값으로 되돌린다.
    monkeypatch.setattr(settings, "agent_cli_model", OLD_PRIMARY)
    monkeypatch.setattr(settings, "agent_cli_timeout_seconds", OLD_PRIMARY_TIMEOUT)
    monkeypatch.setattr(settings, "google_api_model", OLD_FALLBACK)
    monkeypatch.setattr(settings, "google_api_timeout_seconds", OLD_FALLBACK_TIMEOUT)
    # LlmManager 는 생성될 때 엔진의 전역 HarnessFactory 에 빌더를 등록한다.
    # 이 테스트의 가짜 자격 증명에 묶인 빌더가 다른 테스트로 새지 않게 되돌린다.
    monkeypatch.setattr(HarnessFactory, "_builders", dict(HarnessFactory._builders))

    container = Container()
    container.credential_store.override(providers.Object(FakeCredentialStore()))
    container.provider_state.override(
        providers.Object(ProviderStateStore(tmp_path / "provider-state.json"))
    )
    container.runtime_policy_repository.override(providers.Object(InMemoryPolicyRepository()))
    # 정책 응답을 만들며 읽는 로컬 상태·외부 조회는 이 테스트와 무관하므로 끊는다.
    for name in (
        "agy_status_snapshot",
        "agy_status_line_settings",
        "agy_usage_reader",
        "google_model_catalog",
        "google_quota_reader",
    ):
        getattr(container, name).override(providers.Object(None))
    yield container
    container.reset_override()


@pytest.fixture
def executions(monkeypatch: pytest.MonkeyPatch) -> ExecutionLog:
    """CLI·API 를 실제로 부르지 않고, 각 어댑터가 고른 모델·타임아웃만 기록한다.

    고르는 식은 어댑터 구현과 같다: `model or self.model`, `timeout or self.timeout_seconds`.
    """
    log = ExecutionLog()

    def agy_cli(
        harness: AgyCliHarness,
        prompt: str,
        *,
        model: str | None = None,
        timeout: int | None = None,
        **_: Any,
    ) -> LlmExecutionResult:
        log.calls.append(("agy_cli", model or harness.model, timeout or harness.timeout_seconds))
        return LlmExecutionResult(status="ERROR", model=model or harness.model, error=log.cli_error)

    def google_api(
        harness: GoogleGenAiHarness,
        prompt: str,
        *,
        model: str | None = None,
        timeout: int | None = None,
        **_: Any,
    ) -> LlmExecutionResult:
        log.calls.append(("google_api", model or harness.model, timeout or harness.timeout_seconds))
        return LlmExecutionResult(
            status="SUCCESS", model=model or harness.model, structured_output={"ok": True}
        )

    monkeypatch.setattr(AgyCliHarness, "run_structured", agy_cli)
    monkeypatch.setattr(GoogleGenAiHarness, "run_structured", google_api)
    return log


def _update_policy(container: Container) -> None:
    """라우터와 같은 경로: 컨테이너가 조립한 LlmSettingsService 로 정책을 바꾼다."""
    container.llm_settings_service().update_runtime_policy(
        primary_model=NEW_PRIMARY,
        primary_timeout_seconds=NEW_PRIMARY_TIMEOUT,
        fallback_model=NEW_FALLBACK,
        fallback_timeout_seconds=NEW_FALLBACK_TIMEOUT,
    )


def _one_page_pdf(tmp_path: Path) -> Path:
    path = tmp_path / "reference.pdf"
    document = pymupdf.open()
    document.new_page().insert_text((72, 72), "1. Overview")
    document.save(path)
    document.close()
    return path


def test_policy_update_reaches_agents_resolved_before_it(container: Container) -> None:
    outline_agent = container.outline_analysis_agent()
    json_runner = container.json_prompt_runner()
    assert outline_agent._harness.model == OLD_PRIMARY

    _update_policy(container)

    for harness in (
        outline_agent._harness,
        json_runner._harness,
        container.outline_analysis_agent()._harness,
    ):
        assert harness.model == NEW_PRIMARY
        assert harness.timeout_seconds == NEW_PRIMARY_TIMEOUT


def test_outline_run_executes_with_updated_policy(
    container: Container, executions: ExecutionLog, tmp_path: Path
) -> None:
    """모델 속성만이 아니라 실제 CLI 호출이 새 모델·타임아웃을 받는지 본다."""
    outline_agent = container.outline_analysis_agent()

    _update_policy(container)
    document = asyncio.run(
        outline_agent.analyze(_one_page_pdf(tmp_path), context_dir=tmp_path / "context")
    )

    assert executions.calls == [("agy_cli", NEW_PRIMARY, NEW_PRIMARY_TIMEOUT)]
    # 출처(provenance)에 남는 모델도 실제로 실행한 모델과 같아야 한다.
    assert document.telemetry["provenance"]["model"] == NEW_PRIMARY


def test_fallback_follows_updated_policy_and_shares_provider_state(
    container: Container, executions: ExecutionLog
) -> None:
    json_runner = container.json_prompt_runner()

    _update_policy(container)
    executions.cli_error = "Individual quota reached"

    assert json_runner.run("classify this") == {"ok": True}
    assert executions.calls == [
        ("agy_cli", NEW_PRIMARY, NEW_PRIMARY_TIMEOUT),
        ("google_api", NEW_FALLBACK, NEW_FALLBACK_TIMEOUT),
    ]
    # 하네스가 남긴 차단 기록이 설정 화면이 읽는 바로 그 저장소에 있어야 한다.
    assert container.provider_state().blocked_until(PRIMARY_PROVIDER_ID) is not None
