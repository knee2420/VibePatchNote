"""`ModelMatrixPort` 의 구현. 모델 레지스트리와 라우팅 설정을 읽는다.

라우팅 공급자 이름은 설정값이므로 서비스가 `settings` 를 읽지 않도록
컨테이너가 주입한다.
"""
from __future__ import annotations

from typing import Any

from llm_driver import MODEL_REGISTRY


class RegistryModelMatrixAdapter:
    def __init__(self, primary_provider: str, fallback_provider: str) -> None:
        self._primary = primary_provider
        self._fallback = fallback_provider

    def describe(self) -> dict[str, Any]:
        return {
            "primary_provider": self._primary,
            "fallback_provider": self._fallback,
            "models": [
                {
                    "name": spec.name,
                    "family": spec.family,
                    "provider": spec.provider,
                    "max_input_tokens": spec.max_input_tokens,
                    "max_output_tokens": spec.max_output_tokens,
                    "supports_structured_schema": spec.supports_structured_schema,
                    "display_name": spec.display_name,
                    "description": spec.description,
                    "active": True,
                }
                for spec in MODEL_REGISTRY.values()
            ],
        }
