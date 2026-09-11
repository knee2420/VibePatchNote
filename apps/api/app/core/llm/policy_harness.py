"""호출할 때마다 현재 런타임 정책을 다시 읽는 하네스.

컨테이너는 하네스 하나를 만들어 모든 에이전트·유스케이스에 나눠 준다. 그런데
`DocumentService` 는 싱글턴이라 유스케이스와 그 안의 하네스를 프로세스 수명 내내
붙든다. 구체 하네스(`AgyCliHarness` 등)를 그대로 주입하면 첫 해석 시점의 모델·타임아웃이
굳어서, 설정 UI 로 정책을 바꿔도 재시작 전까지 분석에 반영되지 않는다.

이 하네스는 아무것도 굳히지 않는다. 호출마다 `resolve()` 로 지금 정책의 구체 하네스를
받아 위임한다. 정책이 어디에 사는지는 `resolve` 를 넘겨주는 쪽(`LlmManager`)만 안다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Callable, Dict, Optional, Union

from scaffold_engine.harness import BaseLlmHarness, LlmExecutionResult


class RuntimePolicyHarness(BaseLlmHarness):
    """주입은 한 번, 모델·타임아웃 선택은 매 호출."""

    name = "runtime-policy"

    def __init__(self, resolve: Callable[[], BaseLlmHarness]) -> None:
        # 기저 __init__ 은 model/timeout_seconds 를 인스턴스에 고정한다. 그 고정이 바로
        # 없애려는 것이므로 부르지 않고, 두 값은 아래 프로퍼티가 매번 새로 읽는다.
        self._resolve = resolve

    @property
    def model(self) -> str:
        return self._resolve().model

    @property
    def timeout_seconds(self) -> int:
        return self._resolve().timeout_seconds

    @property
    def provider(self) -> str:
        resolved = self._resolve()
        return getattr(
            resolved,
            "provider",
            getattr(
                resolved,
                "_primary_provider",
                getattr(resolved, "name", "google_api"),
            ),
        )

    @property
    def _primary_provider(self) -> str:
        return self.provider

    def run_structured(
        self,
        prompt: str,
        *,
        schema_path: Optional[Union[str, Path]] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
        file_path: Optional[Union[str, Path]] = None,
        **kwargs: Any,
    ) -> LlmExecutionResult:
        return self._resolve().run_structured(
            prompt,
            schema_path=schema_path,
            json_schema=json_schema,
            model=model,
            effort=effort,
            conversation_id=conversation_id,
            timeout=timeout,
            file_path=file_path,
            **kwargs,
        )
