from typing import List, Optional
from datetime import datetime
import uuid
from app.schemas.workspace import WorkspaceSessionCreate, WorkspaceSessionUpdate, WorkspaceSessionResponse

# Mock in-memory database
now = datetime.utcnow()
MOCK_DB = {
    "default-session-1": WorkspaceSessionResponse(
        id="default-session-1",
        title="기본 튜토리얼 세션",
        description="이것은 서버 시작 시 생성된 기본 세션입니다.",
        nodes=[],
        edges=[],
        created_at=now,
        updated_at=now
    )
}

def create_workspace(data: WorkspaceSessionCreate) -> WorkspaceSessionResponse:
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    new_session = WorkspaceSessionResponse(
        id=session_id,
        title=data.title,
        description=data.description,
        nodes=[],
        edges=[],
        created_at=now,
        updated_at=now
    )
    MOCK_DB[session_id] = new_session
    return new_session

def get_workspace(session_id: str) -> Optional[WorkspaceSessionResponse]:
    return MOCK_DB.get(session_id)

def get_all_workspaces() -> List[WorkspaceSessionResponse]:
    return list(MOCK_DB.values())

def update_workspace(session_id: str, data: WorkspaceSessionUpdate) -> Optional[WorkspaceSessionResponse]:
    session = MOCK_DB.get(session_id)
    if not session:
        return None
    
    session.title = data.title
    session.description = data.description
    if data.nodes is not None:
        session.nodes = data.nodes
    if data.edges is not None:
        session.edges = data.edges
        
    session.updated_at = datetime.utcnow()
    return session

def delete_workspace(session_id: str) -> bool:
    if session_id in MOCK_DB:
        del MOCK_DB[session_id]
        return True
    return False
