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
import inspect
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


def current_scope() -> Optional[Any]:
    """지금 실행 중인 활성 단계의 `StepScope`. 없으면 None."""
    collector = _active_collector.get()
    if collector and getattr(collector, "_span_stack", None):
        from agent_telemetry.collector.scope import StepScope

        return StepScope(collector._span_stack[-1], collector)
    return None


def set_collector(collector: Optional[Any]) -> Any:
    """활성 수집기를 바꾸고 복원용 토큰을 돌려준다."""
    return _active_collector.set(collector)


def reset_collector(token: Any) -> None:
    _active_collector.reset(token)


def _safe_serialize_val(v: Any) -> Any:
    """스팬 I/O 에 안전하게 넣을 수 있는 직렬화 헬퍼."""
    if v is None or isinstance(v, (int, float, bool)):
        return v
    if isinstance(v, str):
        return v if len(v) <= 1000 else f"{v[:1000]}...[truncated]"
    if isinstance(v, (list, tuple)):
        if len(v) <= 20:
            return [_safe_serialize_val(x) for x in v]
        return f"[{len(v)} items]"
    if isinstance(v, dict):
        return {str(k): _safe_serialize_val(val) for k, val in list(v.items())[:20]}
    if hasattr(v, "model_dump"):
        try:
            return _safe_serialize_val(v.model_dump(mode="json"))
        except Exception:
            pass
    if hasattr(v, "to_dict"):
        try:
            return _safe_serialize_val(v.to_dict())
        except Exception:
            pass
    return str(v)


def _record_func_io(scope: Any, func: Callable[..., Any], args: tuple[Any, ...], kwargs: dict[str, Any], result: Any = None) -> None:
    """함수의 입출력을 스팬에 안전하게 기록한다."""
    try:
        sig = inspect.signature(func)
        bound = sig.bind(*args, **kwargs)
        bound.apply_defaults()
        inputs_dict = {}
        for k, v in bound.arguments.items():
            if k in ("self", "cls"):
                continue
            inputs_dict[k] = _safe_serialize_val(v)
        if inputs_dict:
            scope.set_inputs(inputs_dict)
    except Exception:
        pass

    if result is not None:
        try:
            if isinstance(result, dict):
                scope.set_outputs(_safe_serialize_val(result))
            elif hasattr(result, "model_dump"):
                scope.set_outputs(_safe_serialize_val(result.model_dump(mode="json")))
            elif hasattr(result, "to_dict"):
                scope.set_outputs(_safe_serialize_val(result.to_dict()))
            else:
                scope.set_outputs({"result": _safe_serialize_val(result)})
        except Exception:
            pass


def traceable(
    name: Optional[str] = None,
    *,
    span_type: SpanType = SpanType.CHAIN,
    phase: Optional[SpanPhase] = None,
    display_label: Optional[str] = None,
    description: Optional[str] = None,
    summary_pill: Optional[str] = None,
    data_in: Optional[str] = None,
    data_out: Optional[str] = None,
    record_io: bool = True,
) -> Callable[[F], F]:
    """함수 실행을 스팬으로 기록한다.

    스팬 이름은 `name` 또는 함수의 `__qualname__` 이다. 코드 지점(`sources`)은
    **자동으로** 잡는다 — 손으로 적으면 이름을 바꿨을 때 따라오지 않는다.
    동기 함수와 비동기(async def) 코루틴 함수를 모두 투명하게 지원합니다.
    """

    def decorate(func: F) -> F:
        span_name = name or func.__qualname__

        if inspect.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                collector = _active_collector.get()
                if collector is None:
                    return await func(*args, **kwargs)

                source = source_of(func)
                with collector.step(
                    span_name,
                    span_type=span_type,
                    phase=phase,
                    display_label=display_label,
                    description=description,
                    summary_pill=summary_pill,
                    data_in=data_in,
                    data_out=data_out,
                    sources=[source] if source else None,
                ) as scope:
                    if record_io:
                        _record_func_io(scope, func, args, kwargs)
                    result = await func(*args, **kwargs)
                    if record_io:
                        _record_func_io(scope, func, args, kwargs, result=result)
                    return result

            return async_wrapper  # type: ignore[return-value]

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
                summary_pill=summary_pill,
                data_in=data_in,
                data_out=data_out,
                sources=[source] if source else None,
            ) as scope:
                if record_io:
                    _record_func_io(scope, func, args, kwargs)
                result = func(*args, **kwargs)
                if record_io:
                    _record_func_io(scope, func, args, kwargs, result=result)
                return result

        return wrapper  # type: ignore[return-value]

    return decorate


