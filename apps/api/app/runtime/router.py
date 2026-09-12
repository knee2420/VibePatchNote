"""Agent Runtime 전용 HTTP 라우터.

전역 에이전트 실행 상태 조회, 끊긴 실행 재개, 사용자 동의/승인(Agreement)을 담당합니다.
"""
from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException

from app.bootstrap.container import Container

from .schemas import (
    AgreementDecisionRequest,
    AgreementView,
    RunAccepted,
    RunResponse,
)
from .service import RuntimeService

router = APIRouter()

RuntimeServiceDep = Annotated[RuntimeService, Depends(Provide[Container.runtime_service])]


# --- 실행 상태 ---------------------------------------------------------------


@router.get("/runs/{run_id}", response_model=RunResponse)
@inject
async def get_run(run_id: str, service: RuntimeServiceDep):
    """에이전트 실행 상태 단건 조회."""
    result = service.get_run(run_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Agent run was not found")
    return RunResponse(**result)


@router.post("/runs/{run_id}/resume", response_model=RunAccepted, status_code=202)
@inject
async def resume_run(run_id: str, service: RuntimeServiceDep):
    """끊기거나 보류된 실행을 입력 스냅샷으로 이어서 실행합니다."""
    result = await service.resume_run(run_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Agent run was not found")
    return RunAccepted(**result)


# --- 사용자 동의 / 승인 ------------------------------------------------------


@router.get("/agreements/pending", response_model=list[AgreementView])
@inject
async def list_pending_agreements(service: RuntimeServiceDep):
    """사람의 결정을 기다리는 항목. 재시작을 넘어 살아남습니다."""
    return [AgreementView(**item) for item in service.list_pending_agreements()]


@router.post("/agreements/{agreement_id}", response_model=AgreementView)
@inject
async def decide_agreement(
    agreement_id: str,
    payload: AgreementDecisionRequest,
    service: RuntimeServiceDep,
):
    """사람의 결정 (승인/거절)을 반영합니다."""
    result = service.decide_agreement(agreement_id, payload.approved)
    if result is None:
        raise HTTPException(status_code=404, detail="Agreement token was not found")
    return AgreementView(**result)
