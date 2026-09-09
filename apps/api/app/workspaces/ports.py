"""workspaces 유스케이스가 요구하는 영속화 계약."""
from __future__ import annotations

from typing import Any, Protocol


class WorkspaceRepository(Protocol):
    """워크스페이스 세션 집합의 조회와 저장 계약."""

    def load_all(self) -> dict[str, dict[str, Any]]: ...

    def save_all(self, sessions: dict[str, dict[str, Any]]) -> None: ...
