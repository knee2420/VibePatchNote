"""인스펙터 라우터 (관측 콘솔 전용 API)."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.inspector.schemas import (
    MatrixResponse,
    RunDetailResponse,
    RunSummaryResponse,
    SourceCodeResponse,
)
from app.inspector.service import InspectorService

router = APIRouter()


def get_inspector_service() -> InspectorService:
    return InspectorService()


@router.get("/runs", response_model=list[RunSummaryResponse])
def list_runs(
    limit: int = Query(50, ge=1, le=200),
    doc_id: Optional[str] = Query(None),
    service: InspectorService = Depends(get_inspector_service),
):
    """실행(Run) 이력 목록을 반환합니다."""
    return service.list_runs(limit=limit, doc_id=doc_id)


@router.get("/runs/{run_id}", response_model=RunDetailResponse)
def get_run(
    run_id: str,
    service: InspectorService = Depends(get_inspector_service),
):
    """특정 Run의 전체 원장(ledger)과 단계별 스냅샷을 반환합니다."""
    run_detail = service.get_run(run_id)
    if not run_detail:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found.")
    return run_detail


@router.delete("/runs/{run_id}")
def delete_run(
    run_id: str,
    service: InspectorService = Depends(get_inspector_service),
):
    """특정 Run의 이력을 영구 삭제합니다."""
    success = service.delete_run(run_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' not found or cannot be deleted.")
    return {"status": "DELETED", "run_id": run_id}


@router.get("/matrix", response_model=MatrixResponse)
def get_matrix(
    service: InspectorService = Depends(get_inspector_service),
):
    """모델 지원 레지스트리 및 라우팅 상태를 반환합니다."""
    return service.get_matrix()


@router.get("/source", response_model=SourceCodeResponse)
def get_source_code(
    file_path: str = Query(..., description="조회할 파일 경로 또는 파일명"),
    symbol: Optional[str] = Query(None, description="특정 클래스명 또는 함수명"),
    service: InspectorService = Depends(get_inspector_service),
):
    """지정된 파일의 실제 구현 코드 또는 프롬프트 전문을 반환합니다."""
    res = service.get_source_code(file_path=file_path, symbol=symbol)
    if not res:
        raise HTTPException(
            status_code=404,
            detail=f"Source not found for file '{file_path}' (symbol: {symbol})",
        )
    return res

