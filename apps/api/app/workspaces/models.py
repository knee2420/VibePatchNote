"""workspaces 유스케이스가 사용하는 프레임워크 독립 모델."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class CreateWorkspaceCommand:
    title: str
    description: str | None


@dataclass(frozen=True)
class UpdateWorkspaceCommand:
    title: str | None = None
    description: str | None = None
    nodes: list[dict[str, Any]] | None = None
    edges: list[dict[str, Any]] | None = None


@dataclass(frozen=True)
class WorkspaceSession:
    id: str
    title: str
    description: str | None
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
