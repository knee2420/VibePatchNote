"""`@traceable` — 함수 하나를 스팬 하나로 만든다.

## 왜 데코레이터가 필요한가

`with collector.step(...)` 만 있으면, 계측하려는 함수마다 호출부를 고쳐야 하고
수집기를 인자로 넘겨야 한다. 그래서 실제로 저장소 전체에서 계측된 파이프라인이
**하나뿐**이었다. 규칙은 지키기 쉬워야 지켜진다.

## 활성 수집기가 없으면 아무 일도 하지 않는다

엔진은 호스트 없이도 돌아야 한다(CLI, 테스트, 다른 호스트). 그래서 수집기가
활성화돼 있지 않으면 데코레이터는 원본 함수를 그대로 부른다 — 계측을 붙였다고
라이브러리가 호스트를 요구하게 되면 안 된다.

    collector = StepCollector(pipeline_name="ScaffoldPipeline")
    with collector.activate():
        pipeline.run(pdf)          # 안쪽의 @traceable 들이 이 수집기에 붙는다

    pipeline.run(pdf)              # 수집기 없음 → 계측 없이 그냥 실행
"""
from __future__ import annotations

import functools
from contextvars import ContextVar
from typing import Any, Callable, Optional, TypeVar

from agent_telemetry.contracts.enums import SpanPhase, SpanType
from agent_telemetry.contracts.source import source_of

F = TypeVar("F", bound=Callable[..., Any])

#: 현재 활성화된 수집기. 중첩 실행을 위해 ContextVar 를 쓴다.
_active_collector: ContextVar[Optional[Any]] = ContextVar("agent_telemetry_collector", default=None)


def current_collector() -> Optional[Any]:
    """지금 활성화된 `StepCollector`. 없으면 None."""
    return _active_collector.get()


def set_collector(collector: Optional[Any]) -> Any:
    """활성 수집기를 바꾸고 복원용 토큰을 돌려준다."""
    return _active_collector.set(collector)


def reset_collector(token: Any) -> None:
    _active_collector.reset(token)


def traceable(
    name: Optional[str] = None,
    *,
    span_type: SpanType = SpanType.CHAIN,
    phase: Optional[SpanPhase] = None,
    display_label: Optional[str] = None,
    description: Optional[str] = None,
) -> Callable[[F], F]:
    """함수 실행을 스팬으로 기록한다.

    스팬 이름은 `name` 또는 함수의 `__qualname__` 이다. 코드 지점(`sources`)은
    **자동으로** 잡는다 — 손으로 적으면 이름을 바꿨을 때 따라오지 않는다.
    """

    def decorate(func: F) -> F:
        span_name = name or func.__qualname__

        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            collector = _active_collector.get()
            if collector is None:
                # 호스트가 없으면 계측도 없다. 라이브러리는 그대로 돌아간다.
                return func(*args, **kwargs)

            source = source_of(func)
            with collector.step(
                span_name,
                span_type=span_type,
                phase=phase,
                display_label=display_label,
                description=description,
                sources=[source] if source else None,
            ):
                # 이 데코레이터는 "이 함수가 돌았고, 얼마 걸렸고, 어디인가"만 기록한다.
                # 입출력까지 남기려면 명시적인 `with collector.step(...)` 을 쓴다 —
                # 스코프를 함수 객체에 붙여 두면 동시 실행에서 서로 덮어쓴다.
                return func(*args, **kwargs)

        return wrapper  # type: ignore[return-value]

    return decorate
