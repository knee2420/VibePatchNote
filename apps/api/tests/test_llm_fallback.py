from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, Union

from scaffold_engine.harness import STATUS_ERROR, BaseLlmHarness, LlmExecutionResult

from app.core.llm.fallback import FallbackLlmHarness


class EmptyCredentialStore:
    def get_google_api_key(self) -> None:
        return None


class GoogleCredentialStore:
    def get_google_api_key(self) -> str:
        return "test-key"


class ExhaustedAvailability:
    def check(self, model: str):
        from app.core.llm.availability import CliAvailability

        return CliAvailability("exhausted", 0)

    def invalidate(self) -> None:
        pass


class QuotaFailureHarness(BaseLlmHarness):
    def run_structured(self, prompt: str, *, schema_path: Optional[Union[str, Path]] = None, json_schema: Optional[Dict[str, Any]] = None, model: Optional[str] = None, effort: Optional[str] = None, conversation_id: Optional[str] = None, timeout: Optional[int] = None) -> LlmExecutionResult:
        return LlmExecutionResult(status=STATUS_ERROR, model=self.model, error="Individual quota reached")


def test_quota_failure_without_google_key_is_explicitly_actionable() -> None:
    harness = FallbackLlmHarness(QuotaFailureHarness(model="cli"), EmptyCredentialStore(), "gemini-3.5-flash", 30)

    result = harness.run_structured("test", json_schema={"type": "object"})

    assert result.ok is False
    assert result.telemetry_metadata["failure_code"] == "FALLBACK_NOT_CONFIGURED"
    assert result.telemetry_metadata["requires_action"] == "configure_google_api"


def test_known_empty_cli_quota_skips_primary(monkeypatch) -> None:
    primary = QuotaFailureHarness(model="cli")
    calls = 0

    def fail_if_called(*args, **kwargs):
        nonlocal calls
        calls += 1
        return LlmExecutionResult(status=STATUS_ERROR, model="cli", error="should not run")

    primary.run_structured = fail_if_called  # type: ignore[method-assign]
    harness = FallbackLlmHarness(
        primary,
        GoogleCredentialStore(),
        "gemini-3.5-flash",
        30,
        cli_availability=ExhaustedAvailability(),  # type: ignore[arg-type]
    )
    monkeypatch.setattr(
        "app.core.llm.fallback.GoogleGenAiHarness.run_structured",
        lambda self, prompt, **kwargs: LlmExecutionResult(
            status="SUCCESS", model=self.model, structured_output={"ok": True}
        ),
    )

    result = harness.run_structured("test", json_schema={"type": "object"})

    assert calls == 0
    assert result.ok
    assert result.telemetry_metadata["provider"] == "google_api"
    assert result.telemetry_metadata["skipped_primary"] is True
    assert result.telemetry_metadata["route_reason"] == "cli_quota_exhausted"


def test_google_primary_success(monkeypatch) -> None:
    from app.core.llm.adapters import GoogleGenAiHarness

    harness = FallbackLlmHarness(
        GoogleGenAiHarness(model="gemini-3.5-flash", api_key="test-key"),
        GoogleCredentialStore(),
        "gemini-3.5-flash",
        30,
        primary_provider="google_api",
        fallback_provider="agy_cli",
        cli_model="gemini-3.8-flash-low",
    )
    monkeypatch.setattr(
        "app.core.llm.adapters.gemini_adapter.GoogleGenAiHarness.run_structured",
        lambda self, prompt, **kwargs: LlmExecutionResult(
            status="SUCCESS", model=self.model, structured_output={"direct": True}
        ),
    )

    result = harness.run_structured("analyze", json_schema={"type": "object"})
    assert result.ok
    assert result.telemetry_metadata["provider"] == "google_api"
    assert result.telemetry_metadata["fallback_used"] is False


def test_google_primary_failure_falls_back_to_cli(monkeypatch) -> None:
    from app.core.llm.adapters import GoogleGenAiHarness

    harness = FallbackLlmHarness(
        GoogleGenAiHarness(model="gemini-3.5-flash", api_key="test-key"),
        GoogleCredentialStore(),
        "gemini-3.5-flash",
        30,
        primary_provider="google_api",
        fallback_provider="agy_cli",
        cli_model="gemini-3.8-flash-low",
    )
    monkeypatch.setattr(
        "app.core.llm.adapters.gemini_adapter.GoogleGenAiHarness.run_structured",
        lambda self, prompt, **kwargs: LlmExecutionResult(
            status="ERROR", model=self.model, error="ResourceExhausted: 429 Quota exceeded"
        ),
    )
    monkeypatch.setattr(
        "scaffold_engine.harness.AgyCliHarness.run_structured",
        lambda self, prompt, **kwargs: LlmExecutionResult(
            status="SUCCESS", model=self.model, structured_output={"cli_fallback": True}
        ),
    )

    result = harness.run_structured("analyze", json_schema={"type": "object"})
    assert result.ok
    assert result.telemetry_metadata["provider"] == "agy_cli"
    assert result.telemetry_metadata["fallback_used"] is True
    assert result.telemetry_metadata["primary_provider"] == "google_api"
