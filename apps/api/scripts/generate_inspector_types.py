"""Pydantic 계약 → Inspector TypeScript 타입 생성기.

손으로 베낀 타입은 반드시 갈라진다. 실제로 `apps/inspector/src/types.ts` 의
`ModelAttemptRecord` 는 백엔드와 필드가 하나도 맞지 않았고(`model` vs
`model_name`, `duration_ms` vs `latency_ms`, 존재하지 않는 `cost_usd`),
그런데도 `tsc` 는 통과했다 — 양쪽이 서로를 모르기 때문이다.

그래서 타입은 **생성한다.** 외부 의존성을 쓰지 않는 이유는 이 저장소가
오프라인에서도 게이트를 돌 수 있어야 하기 때문이다.

사용법:

    python apps/api/scripts/generate_inspector_types.py            # 생성
    python apps/api/scripts/generate_inspector_types.py --check    # CI: 커밋본과 비교

정본: `.agents/rules/60-data/observability.md` §5
"""
from __future__ import annotations

import argparse
import datetime as _dt
import enum
import sys
import types as _types
import typing
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
API_ROOT = REPO_ROOT / "apps" / "api"
OUTPUT = REPO_ROOT / "apps" / "inspector" / "src" / "types" / "generated.ts"

sys.path.insert(0, str(API_ROOT))

from agent_telemetry.contracts import (  # noqa: E402
    ExecutionProtocol,
    FailureReason,
    ModelAttemptRecord,
    SpanError,
    SpanMetadata,
    SpanPhase,
    SpanRecord,
    SpanSource,
    SpanStatus,
    SpanType,
    SpanUsage,
    StageSnapshotRecord,
)
from pydantic import BaseModel  # noqa: E402

from app.inspector.schemas import (  # noqa: E402
    InspectorSpanView,
    MatrixModelInfo,
    MatrixResponse,
    RunDetailResponse,
    RunSummaryResponse,
    SourceCodeResponse,
)

# 방출 순서. 의존 대상을 먼저 둔다.
ENUMS: list[type[enum.Enum]] = [
    SpanType,
    SpanPhase,
    SpanStatus,
    ExecutionProtocol,
    FailureReason,
]

MODELS: list[type[BaseModel]] = [
    SpanSource,
    SpanUsage,
    SpanError,
    SpanMetadata,
    SpanRecord,
    ModelAttemptRecord,
    StageSnapshotRecord,
    InspectorSpanView,
    RunSummaryResponse,
    RunDetailResponse,
    MatrixModelInfo,
    MatrixResponse,
    SourceCodeResponse,
]

HEADER = """/**
 * 이 파일은 생성물입니다. 직접 수정하지 마십시오.
 *
 *   생성: python apps/api/scripts/generate_inspector_types.py
 *   원본: packages/agent-telemetry/agent_telemetry/contracts/
 *         apps/api/app/inspector/schemas.py
 *
 * 손으로 베낀 타입은 갈라집니다. 백엔드 계약을 바꿨으면 이 파일을 다시 생성하십시오.
 * CI 가 `--check` 로 커밋본과 생성물을 비교합니다.
 *
 * 정본: .agents/rules/60-data/observability.md
 */

"""


#: 파이썬 이름 → TypeScript 이름. 휴리스틱으로 접미사를 자르면
#: `MatrixResponse` 가 `Matrix` 가 되어 조용히 export 가 사라진다.
#: 바꿀 이름은 명시적으로 적는다.
TS_RENAMES = {
    "RunSummaryResponse": "RunSummary",
    "RunDetailResponse": "RunDetail",
}


def ts_name(python_name: str) -> str:
    return TS_RENAMES.get(python_name, python_name)


def render_enum(enum_cls: type[enum.Enum]) -> str:
    values = " | ".join(f"'{member.value}'" for member in enum_cls)
    doc = (enum_cls.__doc__ or "").strip().splitlines()
    comment = f"/** {doc[0]} */\n" if doc and not doc[0].startswith(enum_cls.__name__) else ""
    return f"{comment}export type {enum_cls.__name__} = {values}\n"


def annotation_to_ts(annotation: typing.Any) -> str:
    """파이썬 타입 주석을 TypeScript 타입 문자열로 옮긴다."""
    if annotation is type(None):
        return "null"
    if annotation is typing.Any:
        return "unknown"

    origin = typing.get_origin(annotation)
    args = typing.get_args(annotation)

    if origin is typing.Literal:
        # Literal["function", "class", ...] 은 TS 의 유니온 리터럴 그대로다.
        # 처리하지 않으면 `unknown` 이 되어 소비자가 좁히지 못한다.
        return " | ".join(
            f"'{a}'" if isinstance(a, str) else ("null" if a is None else str(a).lower())
            for a in args
        )

    if origin in (typing.Union, _types.UnionType):
        parts = [annotation_to_ts(a) for a in args]
        # null 을 뒤로 보내 읽기 쉽게 한다.
        parts.sort(key=lambda p: p == "null")
        seen: list[str] = []
        for p in parts:
            if p not in seen:
                seen.append(p)
        return " | ".join(seen)

    if origin in (list, set, frozenset, tuple):
        if not args:
            return "unknown[]"
        inner = annotation_to_ts(args[0])
        return f"({inner})[]" if "|" in inner else f"{inner}[]"

    if origin is dict:
        if len(args) == 2:
            return f"Record<string, {annotation_to_ts(args[1])}>"
        return "Record<string, unknown>"

    if isinstance(annotation, type):
        if issubclass(annotation, enum.Enum):
            return annotation.__name__
        if issubclass(annotation, BaseModel):
            return ts_name(annotation.__name__)
        if issubclass(annotation, bool):
            return "boolean"
        if issubclass(annotation, (int, float)):
            return "number"
        if issubclass(annotation, str):
            return "string"
        if issubclass(annotation, (_dt.datetime, _dt.date)):
            # 직렬화하면 ISO 문자열이다.
            return "string"

    return "unknown"


def render_model(model: type[BaseModel]) -> str:
    lines: list[str] = []
    doc = (model.__doc__ or "").strip().splitlines()
    if doc:
        lines.append(f"/** {doc[0]} */")
    lines.append(f"export interface {ts_name(model.__name__)} {{")

    for name, field in model.model_fields.items():
        ts_type = annotation_to_ts(field.annotation)
        # 이 타입들은 **응답**을 기술한다. Pydantic 은 기본값도 직렬화하므로
        # 페이로드에는 모든 키가 존재한다. `is_required()` 는 입력 시 생략
        # 가능한가를 말할 뿐이라, 그대로 `?` 로 옮기면 소비자가 있지도 않은
        # undefined 를 매번 방어하게 된다. 없을 수 있음은 `| null` 로만 말한다.
        if field.description:
            lines.append(f"  /** {field.description} */")
        lines.append(f"  readonly {name}: {ts_type}")

    # pydantic 의 computed field (예: SpanRecord.duration_ms) 도 직렬화에 포함된다.
    for name, computed in getattr(model, "model_computed_fields", {}).items():
        ts_type = annotation_to_ts(computed.return_type)
        if computed.description:
            lines.append(f"  /** {computed.description} */")
        lines.append(f"  readonly {name}: {ts_type}")

    lines.append("}")
    return "\n".join(lines) + "\n"


def build() -> str:
    chunks = [HEADER]
    chunks.append("// ── 열거형 ──────────────────────────────────────────────\n")
    chunks.extend(render_enum(e) for e in ENUMS)
    chunks.append("\n// ── 계약 ────────────────────────────────────────────────\n")
    chunks.extend(render_model(m) for m in MODELS)
    return "\n".join(chunks)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="생성하지 않고 커밋본과 다른지만 확인한다 (CI 용)",
    )
    args = parser.parse_args()

    rendered = build()

    if args.check:
        if not OUTPUT.exists():
            print(f"FAIL 생성물이 없습니다: {OUTPUT}")
            return 1
        current = OUTPUT.read_text(encoding="utf-8")
        if current != rendered:
            print(
                "FAIL 생성물이 백엔드 계약과 다릅니다.\n"
                "     python apps/api/scripts/generate_inspector_types.py 를 실행하고 커밋하십시오."
            )
            return 1
        print("OK 생성 타입이 백엔드 계약과 일치합니다.")
        return 0

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(rendered, encoding="utf-8")
    print(f"생성 완료: {OUTPUT.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
