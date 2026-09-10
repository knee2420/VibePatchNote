"""사용자가 저장한 비밀 없는 LLM 실행 정책의 로컬 저장소."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class LocalRuntimePolicyRepository:
    def __init__(self, path: Path) -> None:
        self._path = path

    def load(self) -> dict[str, object] | None:
        try:
            value: Any = json.loads(self._path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return None
        return value if isinstance(value, dict) else None

    def save(self, policy: dict[str, object]) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self._path.with_suffix(".tmp")
        temporary.write_text(json.dumps(policy, ensure_ascii=False), encoding="utf-8")
        temporary.replace(self._path)
