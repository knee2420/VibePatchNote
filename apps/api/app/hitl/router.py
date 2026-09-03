"""hitl(Human-in-the-Loop) 도메인 엔드포인트. 비즈니스 로직은 service 에 위임합니다."""
from fastapi import APIRouter

from .schemas import (
    EnrichedTreeResponse,
    MutationResponse,
    SegmentUpdatePayload,
    TreeUpdatePayload,
)
from .service import semantic_service

router = APIRouter()


@router.get("/{document_id}", response_model=EnrichedTreeResponse)
async def get_enriched_tree(document_id: str):
    """
    Returns the enriched tree JSON (Phase 3 output) to the frontend Visualizer.
    """
    return EnrichedTreeResponse(**await semantic_service.get_enriched_tree(document_id))


@router.post("/update-segment", response_model=MutationResponse)
async def update_segment_boundary(payload: SegmentUpdatePayload):
    """
    Phase 4: HITL Segment Visualizer Feedback
    Receives manual adjustments to segment boundaries (Split/Merge).
    """
    message = await semantic_service.update_segment_boundary(
        payload.document_id, payload.segment_id, payload.new_bounds
    )
    return MutationResponse(status="success", message=message)


@router.post("/update-tree", response_model=MutationResponse)
async def update_modular_tree(payload: TreeUpdatePayload):
    """
    Phase 4: Modular Tree Builder Feedback
    Receives the reordered/restructured tree from the frontend.
    """
    message = await semantic_service.update_modular_tree(
        payload.document_id, payload.updated_tree
    )
    return MutationResponse(status="success", message=message)
