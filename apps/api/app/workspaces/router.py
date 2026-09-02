from fastapi import APIRouter, HTTPException, status
from typing import List
from .schemas import WorkspaceSessionCreate, WorkspaceSessionUpdate, WorkspaceSessionResponse
from . import service

router = APIRouter()

@router.post("/", response_model=WorkspaceSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(data: WorkspaceSessionCreate):
    """
    Creates a new empty workspace session.
    """
    try:
        return service.create_workspace(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create workspace")

@router.get("/", response_model=List[WorkspaceSessionResponse])
async def list_workspaces():
    """
    Retrieves all workspace sessions.
    """
    return service.get_all_workspaces()

@router.get("/{session_id}", response_model=WorkspaceSessionResponse)
async def get_workspace(session_id: str):
    """
    Retrieves a specific workspace session by ID.
    """
    session = service.get_workspace(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return session

@router.put("/{session_id}", response_model=WorkspaceSessionResponse)
async def update_workspace(session_id: str, data: WorkspaceSessionUpdate):
    """
    Updates a workspace session's canvas state (nodes, edges).
    """
    session = service.update_workspace(session_id, data)
    if not session:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return session

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(session_id: str):
    """
    Deletes a workspace session.
    """
    success = service.delete_workspace(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workspace not found")
