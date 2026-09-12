"""스팬이 거쳐 간 코드 지점.

## 왜 문자열이 아닌가

예전에는 파이프라인이 손으로 이렇게 적었다.

    data_via=["context_builder.py (DocumentContextBuilder.build_context)"]

그러면 소비자가 이 문자열을 정규식으로 되파싱하고, 파일명을 실제 경로로
바꾸려고 하드코딩 표(`KNOWN_FILE_PATHS`)를 들고 있어야 한다. 표가 틀리면
조용히 엉뚱한 파일이 열린다 — 실제로 `schema.py` 항목이 틀려서 모든 run 의
검증 스팬이 `venv/.../pydantic/v1/schema.py` 를 보여주고 있었다.

## 왜 경로가 아니라 모듈인가

이 패키지는 호스트를 모른다 (`.agents/rules/60-data/rule.md` §4-5).
`inspect.getfile()` 이 주는 절대경로를 계약에 담으면 엔진이 호스트의 디렉터리
구조를 아는 셈이 되고, 기록된 경로는 다른 머신에서 의미를 잃는다.

그래서 계약은 **import 가능한 이름**만 담는다. 경로 해석은 호스트가
`importlib` 로 한다 — 정확하고, glob 도 추측도 필요 없다.
"""
from __future__ import annotations

import inspect
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

SourceKind = Literal["function", "method", "class", "module", "prompt", "model"]


class SpanSource(BaseModel):
    """스팬이 거쳐 간 코드 지점 하나."""

    module: str = Field(..., description="import 가능한 모듈 이름 (예: scaffold_engine.outline.pipeline)")
    qualname: str = Field("", description="모듈 안의 한정 이름 (예: OutlinePipeline.execute). 모듈 자체면 빈 문자열")
    lineno: int = Field(0, description="정의 시작 줄. 모르면 0")
    kind: SourceKind = Field("function", description="이 지점의 종류")
    label: Optional[str] = Field(None, description="사람이 읽을 이름. 없으면 소비자가 qualname 으로 만든다")

    @property
    def display(self) -> str:
        """소비자가 쓸 기본 표시 이름."""
        if self.label:
            return self.label
        tail = self.module.rsplit(".", 1)[-1]
        return f"{tail}.{self.qualname}" if self.qualname else tail


def source_of(target: Any, *, kind: Optional[SourceKind] = None, label: Optional[str] = None) -> Optional[SpanSource]:
    """함수·메서드·클래스에서 `SpanSource` 를 만든다.

    손으로 문자열을 쓰는 대신 **대상 자체를 넘긴다.** 이름을 바꾸면 따라오고,
    오타가 나면 그 자리에서 `AttributeError` 가 난다.
    """
    unwrapped = inspect.unwrap(target) if callable(target) else target

    module = getattr(unwrapped, "__module__", None)
    qualname = getattr(unwrapped, "__qualname__", None)
    if not module or not qualname:
        return None

    if kind is None:
        if inspect.isclass(unwrapped):
            kind = "class"
        elif "." in qualname:
            kind = "method"
        else:
            kind = "function"

    lineno = 0
    try:
        _, lineno = inspect.getsourcelines(unwrapped)
    except (OSError, TypeError):
        pass

    return SpanSource(module=module, qualname=qualname, lineno=lineno, kind=kind, label=label)


def caller_source(depth: int = 2, *, label: Optional[str] = None) -> Optional[SpanSource]:
    """호출 지점의 `SpanSource`. `depth` 는 이 함수 기준 거슬러 올라갈 프레임 수다."""
    frame = inspect.currentframe()
    try:
        for _ in range(depth):
            if frame is None:
                return None
            frame = frame.f_back
        if frame is None:
            return None

        module = frame.f_globals.get("__name__")
        if not module:
            return None
        return SpanSource(
            module=module,
            qualname=frame.f_code.co_qualname if hasattr(frame.f_code, "co_qualname") else frame.f_code.co_name,
            lineno=frame.f_lineno,
            kind="function",
            label=label,
        )
    finally:
        del frame


def model_source(model_name: str) -> SpanSource:
    """LLM 모델은 코드가 아니지만 흐름의 한 지점이다.

    예전에는 `data_via` 에 `"Model: gemini-..."` 라는 문자열을 섞어 넣고
    소비자가 접두어로 구분했다. 접두어가 `"Engine: "` 으로 바뀌자 파서가
    그것을 파일 이름으로 오인했다. 종류는 문자열이 아니라 `kind` 가 말한다.
    """
    return SpanSource(module="", qualname=model_name, kind="model", label=model_name)
