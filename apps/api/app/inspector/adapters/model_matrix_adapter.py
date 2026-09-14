"""`ModelMatrixPort` 의 구현. 모델 레지스트리와 현재 실행 정책을 읽는다."""
from __future__ import annotations

from typing import Any

from llm_driver import MODEL_REGISTRY

from app.core.llm import RuntimeExecutionPolicy


class RegistryModelMatrixAdapter:
    def __init__(self, policy: RuntimeExecutionPolicy) -> None:
        # 값이 아니라 정책 객체를 든다. 값을 복사하면 부팅 시점에 굳어서,
        # 설정 화면에서 공급자를 바꿔도 매트릭스는 옛 값을 보여준다.
        self._policy = policy

    def describe(self) -> dict[str, Any]:
        return {
            "primary_provider": self._policy.primary_provider,
            "fallback_provider": self._policy.fallback_provider,
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
