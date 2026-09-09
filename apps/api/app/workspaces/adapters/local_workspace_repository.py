"""로컬 JSON 파일 기반 워크스페이스 저장소 어댑터."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class LocalWorkspaceRepository:
    """JSON 파일 I/O와 초기 튜토리얼 세션 생성을 캡슐화한다."""

    def __init__(self, database_file: Path) -> None:
        self._database_file = database_file

    def load_all(self) -> dict[str, dict[str, Any]]:
        if not self._database_file.exists():
            sessions = self._initial_sessions()
            self.save_all(sessions)
            return sessions

        with self._database_file.open("r", encoding="utf-8") as file:
            return json.load(file)

    def save_all(self, sessions: dict[str, dict[str, Any]]) -> None:
        self._database_file.parent.mkdir(parents=True, exist_ok=True)
        with self._database_file.open("w", encoding="utf-8") as file:
            json.dump(sessions, file, ensure_ascii=False, indent=2)

    @staticmethod
    def _initial_sessions() -> dict[str, dict[str, Any]]:
        now = datetime.now(timezone.utc).isoformat()
        return {
            "default-session-1": {
                "id": "default-session-1",
                "title": "기본 튜토리얼 세션",
                "description": "이것은 서버 시작 시 생성된 기본 세션입니다.",
                "nodes": [],
                "edges": [],
                "created_at": now,
                "updated_at": now,
            }
        }
