"""rag(HITL) 도메인의 요청/응답 스키마."""
from typing import Any, Dict

from pydantic import BaseModel


class TreeUpdatePayload(BaseModel):
    document_id: str
    updated_tree: Dict[str, Any]


class SegmentUpdatePayload(BaseModel):
    document_id: str
    segment_id: str
    new_bounds: Dict[str, Any]


class EnrichedTreeResponse(BaseModel):
    document_id: str
    tree: Dict[str, Any]
    status: str


class MutationResponse(BaseModel):
    status: str
    message: str
