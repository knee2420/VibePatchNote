from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter()

class TreeUpdatePayload(BaseModel):
    document_id: str
    updated_tree: Dict[str, Any]

class SegmentUpdatePayload(BaseModel):
    document_id: str
    segment_id: str
    new_bounds: Dict[str, Any]

@router.get("/{document_id}")
async def get_enriched_tree(document_id: str):
    """
    Returns the enriched tree JSON (Phase 3 output) to the frontend Visualizer.
    """
    return {"document_id": document_id, "tree": {}, "status": "success"}

@router.post("/update-segment")
async def update_segment_boundary(payload: SegmentUpdatePayload):
    """
    Phase 4: HITL Segment Visualizer Feedback
    Receives manual adjustments to segment boundaries (Split/Merge).
    """
    # TODO: Update DB and recalculate children
    return {"status": "success", "message": "Segment updated"}

@router.post("/update-tree")
async def update_modular_tree(payload: TreeUpdatePayload):
    """
    Phase 4: Modular Tree Builder Feedback
    Receives the reordered/restructured tree from the frontend.
    """
    # TODO: Upsert new tree structure to DB
    return {"status": "success", "message": "Tree structure saved"}
