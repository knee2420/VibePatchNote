"""HTTP boundary for independent segment analysis and structure mapping."""
from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, status

from app.bootstrap.container import Container

from .errors import (
    SegmentExtractionEmptyError,
    SegmentNotFoundError,
    SegmentRelationshipTargetError,
    SegmentRevisionConflictError,
)
from .schemas import (
    RelationshipOverrideRequest,
    RelationshipOverrideResponse,
    SegmentResponse,
    SegmentRevisionRequest,
    SegmentRunRequest,
    SegmentStructureResponse,
    to_segment_response,
)
from .service import SegmentsService

router = APIRouter()
SegmentsServiceDep = Annotated[SegmentsService, Depends(Provide[Container.segments_service])]


def _error(exc: Exception) -> HTTPException:
    if isinstance(exc, SegmentNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, SegmentRevisionConflictError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": str(exc), "currentArtifactId": exc.current_artifact_id},
        )
    if isinstance(exc, (SegmentExtractionEmptyError, SegmentRelationshipTargetError, ValueError)):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=500, detail="Segment operation failed")


@router.get("/{doc_id}", response_model=SegmentResponse)
@inject
async def get_adopted_segments(doc_id: str, service: SegmentsServiceDep):
    """채택본을 읽는다.

    **아직 추출하지 않은 문서는 빈 상태(200)로 답한다.** 한 번도 스캔하지 않은 카드가
    마운트될 때마다 404 가 나면, 정상 흐름이 오류로 보이고 진짜 404 — 문서가 사라진
    경우 — 가 그 소음에 묻힌다. 그래서 404 는 문서 자체가 없을 때만 쓴다.
    """
    try:
        title, artifact = service.adopted(doc_id)
    except Exception as exc:
        raise _error(exc) from exc

    if artifact is None:
        # 페이지 수는 아티팩트가 갖는 값이다. 채택본이 없으면 아직 모르므로 0 이다.
        return SegmentResponse(status="empty", docId=doc_id, documentTitle=title, totalPages=0)
    return to_segment_response(artifact)


@router.post("/extract", response_model=SegmentResponse)
@inject
async def extract_segments(payload: SegmentRunRequest, service: SegmentsServiceDep):
    try:
        return to_segment_response(await service.extract(payload.doc_id))
    except Exception as exc:
        raise _error(exc) from exc


@router.post("/runs", status_code=status.HTTP_202_ACCEPTED)
@inject
async def start_segment_extract(payload: SegmentRunRequest, service: SegmentsServiceDep):
    try:
        return await service.start_extract(payload.doc_id)
    except Exception as exc:
        raise _error(exc) from exc


@router.put("/{doc_id}", response_model=SegmentResponse)
@inject
async def save_segment_revision(doc_id: str, payload: SegmentRevisionRequest, service: SegmentsServiceDep):
    try:
        return to_segment_response(service.save_revision(doc_id, payload.base_artifact_id, payload.segments))
    except Exception as exc:
        raise _error(exc) from exc


@router.get("/{doc_id}/structure", response_model=SegmentStructureResponse)
@inject
async def get_segment_structure(doc_id: str, service: SegmentsServiceDep):
    try:
        return SegmentStructureResponse(**service.structure(doc_id).model_dump(by_alias=True))
    except Exception as exc:
        raise _error(exc) from exc


@router.delete("/{doc_id}/relationships/{target_kind}/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
async def reset_relationship_override(
    doc_id: str,
    target_kind: str,
    target_id: str,
    service: SegmentsServiceDep,
):
    """사람이 정한 관계를 물러 **자동 분석 결과로 되돌린다.**

    소속 해제(`PUT ... primarySegmentId=null`)와 다르다. 해제는 "어디에도 속하지
    않는다"는 사람의 결정이고, 이쪽은 그 결정 자체를 취소한다. 되돌릴 결정이 없으면
    조용히 성공한다 — 같은 요청을 두 번 보내도 결과가 같아야 한다.
    """
    try:
        service.reset_override(doc_id, target_kind=target_kind, target_id=target_id)
    except Exception as exc:
        raise _error(exc) from exc


@router.put("/{doc_id}/relationships", response_model=RelationshipOverrideResponse)
@inject
async def set_relationship_override(
    doc_id: str,
    payload: RelationshipOverrideRequest,
    service: SegmentsServiceDep,
):
    try:
        saved = service.set_override(
            doc_id,
            target_kind=payload.target_kind,
            target_id=payload.target_id,
            primary_segment_id=payload.primary_segment_id,
        )
        return RelationshipOverrideResponse(**saved.model_dump(by_alias=True))
    except Exception as exc:
        raise _error(exc) from exc
