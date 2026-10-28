"""v4 — 월별 원장의 키 표기를 snake_case 하나로 통일한다.

``data/ledger/{YYYY-MM}.jsonl`` 한 파일 안에 두 스키마가 섞여 있었다.

    구형: recordedAt · runId · taskName · durationSeconds   (camelCase)
    신형: recorded_at · run_id · task_name · duration_seconds (snake_case)

``LedgerEntry`` 에 alias 가 없어서, 구형 행은 ``model_validate`` 를 **통과하되
모든 필드가 기본값으로 덮인다.** 즉 읽으면 run_id 도 비용도 사라진 빈 항목이
된다 — 실패하지 않고 조용히 지워지는 쪽이 더 나쁘다.

읽기 시점에 폴백을 두지 않는 이유는 `.agents/rules/60-data/rule.md` §5 에 있다.
폴백은 언제 끝나는지 아무도 모르고 영구히 남는다.

상태 표기도 함께 소문자로 내린다. 스팬은 ``"success"``, 원장은 ``"SUCCESS"`` 로
같은 사실을 다르게 적고 있었다
(`.agents/rules/60-data/observability.md` §3-1).
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

#: camelCase → snake_case 로 바꿀 최상위 키.
#: 자기 시대의 규칙을 스스로 들고 있어야 하므로 앱 코드를 import 하지 않는다.
KEY_MAP = {
    "recordedAt": "recorded_at",
    "runId": "run_id",
    "traceId": "trace_id",
    "docId": "doc_id",
    "taskName": "task_name",
    "durationSeconds": "duration_seconds",
    "failureCode": "failure_code",
}

#: `cost` 하위 키.
COST_KEY_MAP = {
    "inputTokens": "input_tokens",
    "outputTokens": "output_tokens",
    "thinkingTokens": "thinking_tokens",
    "cacheReadTokens": "cache_read_tokens",
    "totalTokens": "total_tokens",
}

_CAMEL = re.compile(r"(?<!^)(?=[A-Z])")


def run(base_dir: Path) -> None:
    ledger_dir = base_dir / "data" / "ledger"
    if not ledger_dir.exists():
        return

    for path in sorted(ledger_dir.glob("*.jsonl")):
        _normalize_file(path)


def _normalize_file(path: Path) -> None:
    lines = path.read_text(encoding="utf-8").splitlines()
    out: list[str] = []
    changed = False

    for line in lines:
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            # 읽을 수 없는 줄은 손대지 않는다. 원장은 덧붙이기만 하는 기록이다.
            out.append(line)
            continue

        normalized = _normalize_row(row)
        if normalized != row:
            changed = True
        out.append(json.dumps(normalized, ensure_ascii=False))

    if not changed:
        return

    # 원자적 교체. 중간에 죽어도 원본이 남아 있어야 한다.
    tmp = path.with_suffix(path.suffix + ".migrating")
    tmp.write_text("\n".join(out) + "\n", encoding="utf-8")
    tmp.replace(path)


def _normalize_row(row: Any) -> Any:
    if not isinstance(row, dict):
        return row

    result: dict[str, Any] = {}
    for key, value in row.items():
        new_key = KEY_MAP.get(key) or (_CAMEL.sub("_", key).lower() if _is_camel(key) else key)
        if new_key == "cost" and isinstance(value, dict):
            value = {
                COST_KEY_MAP.get(k, _CAMEL.sub("_", k).lower() if _is_camel(k) else k): v
                for k, v in value.items()
            }
        result[new_key] = value

    status = result.get("status")
    if isinstance(status, str):
        result["status"] = status.lower()

    return result


def _is_camel(key: str) -> bool:
    return any(ch.isupper() for ch in key) and "_" not in key
