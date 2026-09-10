"""workspaces 도메인의 유스케이스."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from .models import CreateWorkspaceCommand, UpdateWorkspaceCommand, WorkspaceSession
from .ports import WorkspaceRepository


class WorkspaceService:
    """세션 상태 전이를 조율하고 영속화는 포트에 위임한다."""

    def __init__(self, repository: WorkspaceRepository) -> None:
        self._repository = repository

    def create_workspace(self, data: CreateWorkspaceCommand) -> WorkspaceSession:
        session_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        session = {
            "id": session_id,
            "title": data.title,
            "description": data.description,
            "nodes": [],
            "edges": [],
            "created_at": now,
            "updated_at": now,
        }
        self._repository.save(session)
        return self._to_response(session)

    def get_workspace(self, session_id: str) -> WorkspaceSession | None:
        session = self._repository.load(session_id)
        return self._to_response(session) if session else None

    def get_all_workspaces(self) -> list[WorkspaceSession]:
        return [self._to_response(session) for session in self._repository.load_all().values()]

    def update_workspace(
        self,
        session_id: str,
        data: UpdateWorkspaceCommand,
    ) -> WorkspaceSession:
        session = self._repository.load(session_id)
        if session is None:
            session = self._recovered_session(session_id, data)

        for field in ("title", "description", "nodes", "edges"):
            value = getattr(data, field)
            if value is not None:
                session[field] = value

        session["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._repository.save(session)
        return self._to_response(session)

    def delete_workspace(self, session_id: str) -> bool:
        return self._repository.delete(session_id)

    @staticmethod
    def _recovered_session(
        session_id: str,
        data: UpdateWorkspaceCommand,
    ) -> dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        return {
            "id": session_id,
            "title": data.title or "Recovered Session",
            "description": data.description or "",
            "nodes": [],
            "edges": [],
            "created_at": now,
            "updated_at": now,
        }

    @staticmethod
    def _to_response(data: dict[str, Any]) -> WorkspaceSession:
        copied = dict(data)
        for field in ("created_at", "updated_at"):
            if isinstance(copied.get(field), str):
                copied[field] = datetime.fromisoformat(copied[field])
        return WorkspaceSession(**copied)
