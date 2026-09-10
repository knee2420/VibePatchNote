"""workspaces 유스케이스가 요구하는 영속화 계약."""
from __future__ import annotations

from typing import Any, Protocol


class WorkspaceRepository(Protocol):
    """워크스페이스 세션의 조회와 저장 계약.

    세션 하나가 저장 단위다. 전체를 한 덩어리로 쓰면 하나를 고치려고 전부를
    다시 쓰게 되고, 쓰는 도중 실패가 모든 세션을 잃게 만든다.
    """

    def load(self, session_id: str) -> dict[str, Any] | None: ...

    def save(self, session: dict[str, Any]) -> None: ...

    def delete(self, session_id: str) -> bool: ...

    def load_all(self) -> dict[str, dict[str, Any]]: ...

    def save_all(self, sessions: dict[str, dict[str, Any]]) -> None: ...
