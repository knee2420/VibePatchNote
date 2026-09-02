from typing import List, Optional
from datetime import datetime
import uuid
from .schemas import WorkspaceSessionCreate, WorkspaceSessionUpdate, WorkspaceSessionResponse

import json
import os
from fastapi import HTTPException

DB_FILE = "workspaces_db.json"

def load_db():
    if not os.path.exists(DB_FILE):
        now = datetime.utcnow()
        initial_db = {
            "default-session-1": {
                "id": "default-session-1",
                "title": "기본 튜토리얼 세션",
                "description": "이것은 서버 시작 시 생성된 기본 세션입니다.",
                "nodes": [],
                "edges": [],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        }
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump(initial_db, f, indent=4)
        return initial_db
        
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_db(db_data):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(db_data, f, indent=4)

def _dict_to_model(data: dict) -> WorkspaceSessionResponse:
    if "created_at" in data and isinstance(data["created_at"], str):
        data["created_at"] = datetime.fromisoformat(data["created_at"])
    if "updated_at" in data and isinstance(data["updated_at"], str):
        data["updated_at"] = datetime.fromisoformat(data["updated_at"])
    return WorkspaceSessionResponse(**data)

def create_workspace(data: WorkspaceSessionCreate) -> WorkspaceSessionResponse:
    db = load_db()
    session_id = str(uuid.uuid4())
    now_dt = datetime.utcnow()
    new_session_dict = {
        "id": session_id,
        "title": data.title,
        "description": data.description,
        "nodes": [],
        "edges": [],
        "created_at": now_dt.isoformat(),
        "updated_at": now_dt.isoformat()
    }
    db[session_id] = new_session_dict
    save_db(db)
    return _dict_to_model(new_session_dict)

def get_workspace(session_id: str) -> Optional[WorkspaceSessionResponse]:
    db = load_db()
    if session_id in db:
        return _dict_to_model(db[session_id])
    return None

def get_all_workspaces() -> List[WorkspaceSessionResponse]:
    db = load_db()
    return [_dict_to_model(v) for v in db.values()]

def update_workspace(session_id: str, data: WorkspaceSessionUpdate) -> Optional[WorkspaceSessionResponse]:
    db = load_db()
    if session_id not in db:
        # Upsert: Create missing session to recover orphaned frontend states
        now_dt = datetime.utcnow()
        db[session_id] = {
            "id": session_id,
            "title": data.title if data.title else "Recovered Session",
            "description": data.description if data.description else "",
            "nodes": [],
            "edges": [],
            "created_at": now_dt.isoformat(),
            "updated_at": now_dt.isoformat()
        }
    
    session = db[session_id]
    if data.title is not None:
        session["title"] = data.title
    if data.description is not None:
        session["description"] = data.description
    if data.nodes is not None:
        session["nodes"] = data.nodes
    if data.edges is not None:
        session["edges"] = data.edges
        
    session["updated_at"] = datetime.utcnow().isoformat()
    save_db(db)
    return _dict_to_model(session)

def delete_workspace(session_id: str) -> bool:
    db = load_db()
    if session_id in db:
        del db[session_id]
        save_db(db)
        return True
    return False
