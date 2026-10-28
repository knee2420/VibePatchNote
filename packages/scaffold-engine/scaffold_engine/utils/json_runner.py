"""도메인 프롬프트를 정형 JSON으로 실행하는 공용 엔진 유틸리티."""
from __future__ import annotations

from typing import Any, Optional

from ..contracts import LlmHarness


class JsonPromptRunner:
    """LlmHarness를 비동기 JSON 실행 포트로 노출한다."""

    def __init__(self, harness: LlmHarness) -> None:
        self._harness = harness

    @property
    def model(self) -> str:
        """현재 하네스가 선택한 모델 식별자. 관측에만 사용한다."""
        return str(getattr(self._harness, "model", "configured-llm"))

    def run(self, prompt: str, list_key: str = "__engine_payload__", **kwargs: Any) -> Optional[dict[str, Any]]:
        if not prompt.strip():
            raise ValueError("JsonPromptRunner requires a non-empty prompt.")
        if hasattr(self._harness, "run_json"):
            try:
                return self._harness.run_json(prompt, list_key=list_key, **kwargs)
            except TypeError:
                return self._harness.run_json(prompt, **kwargs)
        return None
