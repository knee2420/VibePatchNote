"""Scaffold Engine — Harness Factory (Provider Router).

모델명 → 프로필(`ModelSpec`) → 프로바이더 → 어댑터 인스턴스로 이어지는 단일 경로다.

**엔진은 호스트 앱을 import 하지 않는다.** (P1 단방향 의존)
호스트가 자체 어댑터를 얹고 싶으면 반대로 호스트가 여기에 등록한다:

```python
HarnessFactory.register("local_serving", lambda spec, effort, timeout: MyHarness(...))
```

파이프라인에 특정 하네스를 쓰게 하려면 주입이 가장 단순하고 확실하다:
`OutlinePipeline(harness=...)`. 팩토리는 "주입하지 않았을 때의 기본값" 을 만드는 곳이다.
"""
from __future__ import annotations

import logging
from typing import Callable, Dict, Optional

from .agy_client import DEFAULT_TIMEOUT_SECONDS, AgyCliHarness
from .base import BaseLlmHarness
from .registry import DEFAULT_MODEL_NAME, ModelSpec, get_model_spec

logger = logging.getLogger(__name__)

# (스펙, 요청 effort, 타임아웃) -> 하네스
HarnessBuilder = Callable[[ModelSpec, Optional[str], int], BaseLlmHarness]


class UnsupportedProviderError(RuntimeError):
    """등록된 어댑터가 없는 프로바이더를 요청했을 때."""


def _build_agy_cli(spec: ModelSpec, effort: Optional[str], timeout_seconds: int) -> BaseLlmHarness:
    return AgyCliHarness(model=spec.name, effort=effort, timeout_seconds=timeout_seconds)


class HarnessFactory:
    """프로바이더별 어댑터 빌더 레지스트리."""

    _builders: Dict[str, HarnessBuilder] = {"agy_cli": _build_agy_cli}

    @classmethod
    def register(cls, provider: str, builder: HarnessBuilder) -> None:
        """프로바이더 어댑터를 등록/교체한다. 호스트 앱의 확장 지점."""
        cls._builders[provider] = builder
        logger.debug("[HarnessFactory] provider 등록: %s", provider)

    @classmethod
    def providers(cls) -> tuple[str, ...]:
        return tuple(sorted(cls._builders))

    @classmethod
    def create(
        cls,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
    ) -> BaseLlmHarness:
        """모델명에 대응하는 하네스를 만든다.

        어댑터가 없는 프로바이더는 조용히 CLI 로 폴백하지 않고 **실패시킨다.**
        로컬 서빙 모델을 요청했는데 CLI 로 흘러가면 원인 추적이 불가능해진다.
        """
        spec = get_model_spec(model or DEFAULT_MODEL_NAME)
        builder = cls._builders.get(spec.provider)
        if builder is None:
            raise UnsupportedProviderError(
                f"'{spec.name}' 의 프로바이더 '{spec.provider}' 에 등록된 어댑터가 없습니다. "
                f"등록된 프로바이더: {cls.providers()}"
            )
        return builder(spec, effort, timeout_seconds)
