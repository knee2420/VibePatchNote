"""workspaces 도메인 엔드포인트. 비즈니스 로직은 service 에 위임합니다."""
from typing import Annotated, List

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, status

from app.bootstrap.container import Container

from .models import CreateWorkspaceCommand, UpdateWorkspaceCommand
from .schemas import (
    WorkspaceSessionCreate,
    WorkspaceSessionResponse,
    WorkspaceSessionUpdate,
)
from .service import WorkspaceService

router = APIRouter()

WorkspaceServiceDep = Annotated[
    WorkspaceService,
    Depends(Provide[Container.workspace_service]),
]


@router.post("", response_model=WorkspaceSessionResponse, status_code=status.HTTP_201_CREATED)
@inject
async def create_workspace(data: WorkspaceSessionCreate, service: WorkspaceServiceDep):
    """
    Creates a new empty workspace session.
    """
    try:
        result = service.create_workspace(
            CreateWorkspaceCommand(title=data.title, description=data.description)
        )
        return WorkspaceSessionResponse.model_validate(result, from_attributes=True)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create workspace: {exc}") from exc

@router.get("", response_model=List[WorkspaceSessionResponse])
@inject
async def list_workspaces(service: WorkspaceServiceDep):
    """
    Retrieves all workspace sessions.
    """
    return [WorkspaceSessionResponse.model_validate(item, from_attributes=True) for item in service.get_all_workspaces()]

@router.get("/{session_id}", response_model=WorkspaceSessionResponse)
@inject
async def get_workspace(session_id: str, service: WorkspaceServiceDep):
    """
    Retrieves a specific workspace session by ID.
    """
    session = service.get_workspace(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return WorkspaceSessionResponse.model_validate(session, from_attributes=True)

@router.put("/{session_id}", response_model=WorkspaceSessionResponse)
@inject
async def update_workspace(
    session_id: str,
    data: WorkspaceSessionUpdate,
    service: WorkspaceServiceDep,
):
    """
    Updates a workspace session's canvas state (nodes, edges).
    """
    result = service.update_workspace(
        session_id,
        UpdateWorkspaceCommand(
            title=data.title,
            description=data.description,
            nodes=data.nodes,
            edges=data.edges,
        ),
    )
    return WorkspaceSessionResponse.model_validate(result, from_attributes=True)

@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
async def delete_workspace(session_id: str, service: WorkspaceServiceDep):
    """
    Deletes a workspace session.
    """
    success = service.delete_workspace(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workspace not found")
