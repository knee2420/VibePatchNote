"""로컬 JSON 파일 기반 워크스페이스 저장소 어댑터.

    data/memory/sessions/{session_id}.json

세션 하나가 파일 하나다. 전부를 한 파일에 담으면 세션 하나를 고치려고 전체를
다시 쓰게 되고, 쓰는 도중에 죽으면 모든 세션을 잃는다.

**노드에는 포인터만 남는다.** 아웃라인·엘리먼트·세그먼트·스캐폴드 본문은 각자
자기 저장소가 정본을 갖고 있다. 그 사본을 세션에 다시 넣으면 재분석했을 때 두
곳이 갈라지고, 세션 파일이 수백 KB 로 부푼다. 화이트리스트는 클라이언트의
타입이 강제하고, 여기서는 마지막 관문으로 한 번 더 걸러 낸다.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.storage import read_json, safe_segment, write_json

logger = logging.getLogger(__name__)

# 각자 자기 저장소가 정본을 갖고 있어 세션에 사본을 둘 이유가 없는 필드.
DERIVED_NODE_FIELDS = frozenset(
    {"outlines", "elements", "segments", "htmlContent", "markdownContent", "slots", "archive"}
)


class LocalWorkspaceRepository:
    """세션 파일 입출력과 초기 튜토리얼 세션 생성을 캡슐화한다."""

    def __init__(self, base_dir: Path) -> None:
        self._base_dir = base_dir

    # --- 단건 ------------------------------------------------------------

    def load(self, session_id: str) -> dict[str, Any] | None:
        return read_json(self._file(session_id))

    def save(self, session: dict[str, Any]) -> None:
        session_id = session["id"]
        write_json(self._file(session_id), self._without_derived(session))

    def delete(self, session_id: str) -> bool:
        path = self._file(session_id)
        if not path.exists():
            return False
        path.unlink()
        return True

    # --- 전체 ------------------------------------------------------------

    def load_all(self) -> dict[str, dict[str, Any]]:
        if not self._base_dir.exists() or not any(self._base_dir.glob("*.json")):
            sessions = self._initial_sessions()
            for session in sessions.values():
                self.save(session)
            return sessions

        sessions: dict[str, dict[str, Any]] = {}
        for path in sorted(self._base_dir.glob("*.json")):
            payload = read_json(path)
            if isinstance(payload, dict) and payload.get("id"):
                sessions[payload["id"]] = payload
        return sessions

    def save_all(self, sessions: dict[str, dict[str, Any]]) -> None:
        for session in sessions.values():
            self.save(session)

    # --- 내부 ------------------------------------------------------------

    def _file(self, session_id: str) -> Path:
        return self._base_dir / f"{safe_segment(session_id)}.json"

    @staticmethod
    def _without_derived(session: dict[str, Any]) -> dict[str, Any]:
        """노드에서 파생 사본을 떼어 낸다. 포인터는 그대로 둔다."""
        nodes = session.get("nodes")
        if not isinstance(nodes, list):
            return session

        stripped_total = 0
        clean_nodes: list[Any] = []
        for node in nodes:
            data = node.get("data") if isinstance(node, dict) else None
            if not isinstance(data, dict):
                clean_nodes.append(node)
                continue
            leaked = DERIVED_NODE_FIELDS & data.keys()
            if not leaked:
                clean_nodes.append(node)
                continue
            stripped_total += len(leaked)
            clean_nodes.append(
                {**node, "data": {k: v for k, v in data.items() if k not in DERIVED_NODE_FIELDS}}
            )

        if stripped_total:
            logger.info(
                "[Workspaces] 세션 %s 저장 시 파생 사본 %d개를 제거했습니다.",
                session.get("id"), stripped_total,
            )
        return {**session, "nodes": clean_nodes}

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
