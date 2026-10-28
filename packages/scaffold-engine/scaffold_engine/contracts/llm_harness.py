"""엔진 공통 LLM 하네스 계약 (SSOT).

비즈니스 로직(파이프라인)은 특정 LLM 제공자에 종속되지 않고 오직 이 프로토콜에만 의존합니다.
새 하네스를 붙이려면 `LlmHarness`를 구현해 파이프라인에 주입하면 됩니다.
"""
from __future__ import annotations

from typing import Any, Dict, Optional, Protocol, runtime_checkable


@runtime_checkable
class LlmHarness(Protocol):
    """LLM 호출 추상화 프로토콜."""

    name: str = "default"

    def run_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        retries: int = 2,
        retry_hint: str = "",
    ) -> Optional[Dict[str, Any]]:
        """프롬프트를 실행하고 JSON 객체를 돌려준다. 실패 시 None."""
        ...

    def run_structured(
        self,
        prompt: str,
        *,
        json_schema: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
        retries: int = 2,
        **kwargs: Any,
    ) -> Any:
        """구조화된 스키마에 따라 LLM 추론 결과를 반환한다."""
        ...
