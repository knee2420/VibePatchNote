"""도메인 프롬프트를 정형 JSON으로 실행하는 공용 엔진 유틸리티."""
from __future__ import annotations

from typing import Any

from .harness import BaseLlmHarness


class JsonPromptRunner:
    """BaseLlmHarness를 비동기 JSON 실행 포트로 노출한다."""

    def __init__(self, harness: BaseLlmHarness) -> None:
        self._harness = harness

    def run(self, prompt: str) -> dict[str, Any] | None:
        if not prompt.strip():
            raise ValueError("JsonPromptRunner requires a non-empty prompt.")
        return self._harness.run_json(prompt, list_key="__engine_payload__")
