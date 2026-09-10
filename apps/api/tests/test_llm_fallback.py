from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, Union

from scaffold_engine.harness import STATUS_ERROR, BaseLlmHarness, LlmExecutionResult

from app.core.llm.fallback import FallbackLlmHarness


class EmptyCredentialStore:
    def get_google_api_key(self) -> None:
        return None


class QuotaFailureHarness(BaseLlmHarness):
    def run_structured(self, prompt: str, *, schema_path: Optional[Union[str, Path]] = None, json_schema: Optional[Dict[str, Any]] = None, model: Optional[str] = None, effort: Optional[str] = None, conversation_id: Optional[str] = None, timeout: Optional[int] = None) -> LlmExecutionResult:
        return LlmExecutionResult(status=STATUS_ERROR, model=self.model, error="Individual quota reached")


def test_quota_failure_without_google_key_is_explicitly_actionable() -> None:
    harness = FallbackLlmHarness(QuotaFailureHarness(model="cli"), EmptyCredentialStore(), "gemini-2.5-flash", 30)

    result = harness.run_structured("test", json_schema={"type": "object"})

    assert result.ok is False
    assert result.telemetry_metadata["failure_code"] == "FALLBACK_NOT_CONFIGURED"
    assert result.telemetry_metadata["requires_action"] == "configure_google_api"
