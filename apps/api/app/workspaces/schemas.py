from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class WorkspaceSessionBase(BaseModel):
    title: str = Field(..., example="My Novel Session")
    description: Optional[str] = Field(None, example="A session for planning chapter 1")

class WorkspaceSessionCreate(WorkspaceSessionBase):
    pass

class WorkspaceSessionUpdate(WorkspaceSessionBase):
    nodes: Optional[List[Dict[str, Any]]] = Field(None, description="List of React Flow nodes")
    edges: Optional[List[Dict[str, Any]]] = Field(None, description="List of React Flow edges")

class WorkspaceSessionResponse(WorkspaceSessionBase):
    id: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
