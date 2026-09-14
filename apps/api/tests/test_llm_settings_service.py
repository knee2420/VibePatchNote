from llm_driver import CliAvailability

from app.core.llm import RuntimeExecutionPolicy
from app.llm_settings.service import LlmSettingsService
from app.llm_settings.use_cases import (
    ResolveNextExecutionUseCase,
    UpdateRuntimePolicyUseCase,
)


def _policy() -> RuntimeExecutionPolicy:
    """테스트가 정하는 실행 정책. 전역 설정을 건드리지 않는다."""
    return RuntimeExecutionPolicy(
        primary_provider="agy_cli",
        fallback_provider="google_api",
        google_api_model="gemini-3.5-flash",
        google_api_timeout_seconds=90,
        agent_cli_model="claude-sonnet-4-6",
        agent_cli_timeout_seconds=120,
        agent_cli_bin="agy",
    )


def _service(credentials, policy=None, cli_availability=None) -> LlmSettingsService:
    """컨테이너가 조립하는 것과 같은 모양으로 서비스를 만든다."""
    policy = policy or _policy()
    return LlmSettingsService(
        credentials=credentials,
        policy=policy,
        resolve_next_execution=ResolveNextExecutionUseCase(
            credentials=credentials, policy=policy, cli_availability=cli_availability
        ),
        update_policy_uc=UpdateRuntimePolicyUseCase(credentials=credentials, policy=policy),
        agy_status_bridge_command="python agy_status_bridge.py",
        cli_availability=cli_availability,
    )


class _CredentialStore:
    def get_google_api_key(self) -> str:
        return "AIza0123456789abcdefgh"

    def set_google_api_key(self, api_key: str) -> None:
        raise AssertionError(f"unexpected write: {api_key}")

    def delete_google_api_key(self) -> None:
        raise AssertionError("unexpected delete")


def test_provider_status_exposes_only_a_masked_google_api_key():
    providers = _service(_CredentialStore()).list_providers()["providers"]
    google = next(provider for provider in providers if provider["id"] == "google-api")

    assert google["configured"] is True
    assert google["masked_key"] == "AIza••••••••efgh"
    assert "AIza0123456789abcdefgh" not in str(google)


class _ExhaustedCli:
    def check(self, model: str) -> CliAvailability:
        return CliAvailability("exhausted", 0.0)


def test_runtime_preview_selects_api_when_cli_quota_is_empty(monkeypatch):
    monkeypatch.setattr("app.llm_settings.service.shutil.which", lambda executable: executable)
    dashboard = _service(
        _CredentialStore(),
        cli_availability=_ExhaustedCli(),  # type: ignore[arg-type]
    ).runtime_dashboard()

    assert dashboard["nextExecution"] == {
        "provider": "google-api",
        "model": dashboard["policy"]["fallbackModel"],
        "routeReason": "cli_quota_exhausted",
    }
