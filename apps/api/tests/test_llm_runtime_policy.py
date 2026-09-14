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
from llm_driver import (
    PRIMARY_PROVIDER_ID,
    AgyCliHarness,
    GoogleGenAiHarness,
    HarnessFactory,
    LlmExecutionResult,
    ProviderStateStore,
)

from app.bootstrap.container import Container
from app.core.config import settings

OLD_PRIMARY, OLD_PRIMARY_TIMEOUT = "claude-sonnet-4-6", 120
OLD_FALLBACK, OLD_FALLBACK_TIMEOUT = "gemini-3.5-flash", 90
NEW_PRIMARY, NEW_PRIMARY_TIMEOUT = "gpt-oss-120b-medium", 240
NEW_FALLBACK, NEW_FALLBACK_TIMEOUT = "gemini-3.1-pro", 45


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
    # 실행 정책의 기본값은 전역 settings 에서 온다. 시작값을 고정하면 컨테이너가
    # 그 값으로 `RuntimeExecutionPolicy` 를 만든다. 이후 변경은 정책 객체에만 일어난다.
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
    extract_outline = container.extract_outline()
    json_runner = container.json_prompt_runner()
    assert extract_outline._harness.model == OLD_PRIMARY

    _update_policy(container)

    for harness in (
        extract_outline._harness,
        json_runner._harness,
        container.extract_outline()._harness,
    ):
        assert harness.model == NEW_PRIMARY
        assert harness.timeout_seconds == NEW_PRIMARY_TIMEOUT


def test_outline_run_executes_with_updated_policy(
    container: Container, executions: ExecutionLog, tmp_path: Path
) -> None:
    """모델 속성만이 아니라 실제 CLI 호출이 새 모델·타임아웃을 받는지 본다."""
    extract_outline = container.extract_outline()

    _update_policy(container)
    document = asyncio.run(
        extract_outline._run_pipeline(_one_page_pdf(tmp_path), context_dir=tmp_path / "context")
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


def test_policy_update_does_not_mutate_global_settings(container: Container) -> None:
    """설정 화면의 변경은 주입된 실행 정책에만 일어난다.

    예전에는 유스케이스가 전역 `settings` 객체에 직접 대입했다 — 불변 설정이라고
    문서에 적힌 객체를 프로세스 전체가 공유하면서 가변으로 쓴 것이다. 누가 언제
    바꿨는지 추적할 수 없고, 테스트는 매번 전역을 되돌려 놓아야 했다.
    """
    policy = container.execution_policy()
    assert policy.agent_cli_model == OLD_PRIMARY

    _update_policy(container)

    assert policy.agent_cli_model == NEW_PRIMARY
    # 전역은 그대로다.
    assert settings.agent_cli_model == OLD_PRIMARY
    assert settings.google_api_model == OLD_FALLBACK


def test_inspector_matrix_follows_the_live_policy(container: Container) -> None:
    """관측 매트릭스는 부팅 시점 값이 아니라 지금의 정책을 보여준다.

    예전에는 컨테이너가 `providers.Object(settings.primary_provider)` 로 **값을
    복사**해서, 공급자를 바꿔도 매트릭스는 옛 값을 계속 보여줬다.
    """
    matrix = container.model_matrix()
    assert matrix.describe()["primary_provider"] == "agy_cli"

    container.llm_settings_service().update_runtime_policy(
        primary_model=NEW_FALLBACK,
        primary_timeout_seconds=NEW_PRIMARY_TIMEOUT,
        fallback_model=NEW_PRIMARY,
        fallback_timeout_seconds=NEW_FALLBACK_TIMEOUT,
        primary_provider="google-api",
    )

    assert matrix.describe()["primary_provider"] == "google_api"


def test_saved_policy_is_restored_at_boot_not_on_first_settings_request(
    container: Container,
) -> None:
    """저장된 정책은 설정 화면이 아니라 부팅이 읽는다.

    예전에는 복원이 `LlmSettingsService` 생성자에 있었고 그 서비스는 Factory 였다.
    그래서 설정 화면을 한 번도 열지 않으면 프로세스는 저장된 정책이 아니라 환경
    변수 기본값으로 실행했다 — 재시작 직후의 첫 분석이 사용자가 고르지 않은
    공급자로 돌아갈 수 있었다.
    """
    container.runtime_policy_repository().save(
        {
            "primaryProvider": "google-api",
            "primaryModel": NEW_FALLBACK,
            "primaryTimeoutSeconds": NEW_FALLBACK_TIMEOUT,
            "fallbackProvider": PRIMARY_PROVIDER_ID,
            "fallbackModel": NEW_PRIMARY,
            "fallbackTimeoutSeconds": NEW_PRIMARY_TIMEOUT,
        }
    )
    policy = container.execution_policy()
    assert policy.primary_provider == "agy_cli", "복원 전에는 기본값이다"

    # main.py 의 lifespan 이 하는 일과 같다.
    container.update_runtime_policy().restore()

    assert policy.is_google_primary
    assert policy.google_api_model == NEW_FALLBACK
    assert policy.google_api_timeout_seconds == NEW_FALLBACK_TIMEOUT
