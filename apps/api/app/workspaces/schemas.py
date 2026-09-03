"""workspaces 도메인의 요청/응답 스키마."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class WorkspaceSessionBase(BaseModel):
    title: str = Field(..., json_schema_extra={"example": "My Novel Session"})
    description: Optional[str] = Field(
        None, json_schema_extra={"example": "A session for planning chapter 1"}
    )


class WorkspaceSessionCreate(WorkspaceSessionBase):
    pass


class WorkspaceSessionUpdate(BaseModel):
    """부분 갱신(PATCH 성격)이므로 모든 필드가 선택입니다."""

    title: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = Field(None, description="List of React Flow nodes")
    edges: Optional[List[Dict[str, Any]]] = Field(None, description="List of React Flow edges")


class WorkspaceSessionResponse(WorkspaceSessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
