from app.core.llm.availability import CliAvailability
from app.llm_settings.service import LlmSettingsService


class _CredentialStore:
    def get_google_api_key(self) -> str:
        return "AIza0123456789abcdefgh"

    def set_google_api_key(self, api_key: str) -> None:
        raise AssertionError(f"unexpected write: {api_key}")

    def delete_google_api_key(self) -> None:
        raise AssertionError("unexpected delete")


def test_provider_status_exposes_only_a_masked_google_api_key():
    providers = LlmSettingsService(credentials=_CredentialStore()).list_providers()["providers"]
    google = next(provider for provider in providers if provider["id"] == "google-api")

    assert google["configured"] is True
    assert google["masked_key"] == "AIza••••••••efgh"
    assert "AIza0123456789abcdefgh" not in str(google)


class _ExhaustedCli:
    def check(self, model: str) -> CliAvailability:
        return CliAvailability("exhausted", 0.0)


def test_runtime_preview_selects_api_when_cli_quota_is_empty(monkeypatch):
    monkeypatch.setattr("app.llm_settings.service.shutil.which", lambda executable: executable)
    dashboard = LlmSettingsService(
        credentials=_CredentialStore(),
        cli_availability=_ExhaustedCli(),  # type: ignore[arg-type]
    ).runtime_dashboard()

    assert dashboard["nextExecution"] == {
        "provider": "google-api",
        "model": dashboard["policy"]["fallbackModel"],
        "routeReason": "cli_quota_exhausted",
    }
