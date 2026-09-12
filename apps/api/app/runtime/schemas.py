"""Agent Runtime 컨트롤 플레인 스키마.

특정 비즈니스 도메인(문서, 캔버스 등)에 속하지 않는 범용 실행 상태 및 사람 승인 계약입니다.
"""
from __future__ import annotations

from typing import Any

from agent_runtime import RunStatus
from pydantic import BaseModel, Field


class RunResponse(BaseModel):
    """실행 상태 단건 조회 응답."""

    run_id: str = Field(alias="runId")
    agent_name: str = Field(alias="agentName")
    status: RunStatus
    attempt: int = 1
    doc_id: str | None = Field(default=None, alias="docId")
    agreement_id: str | None = Field(default=None, alias="agreementId")
    trace_id: str | None = Field(default=None, alias="traceId")
    error_code: str | None = Field(default=None, alias="errorCode")
    cost: dict[str, Any] = Field(default_factory=dict)
    result: dict[str, Any] | None = None
    execution: dict[str, Any] | None = None

    model_config = {"populate_by_name": True}


class RunAccepted(BaseModel):
    """비동기 실행 착수 / 재개 접수 응답 (202 Accepted)."""

    run_id: str = Field(alias="runId")
    status: str = "queued"
    attempt: int = 1

    model_config = {"populate_by_name": True}


class AgreementView(BaseModel):
    """사람의 결정을 기다리는 항목 뷰."""

    agreement_id: str = Field(alias="agreementId")
    kind: str
    status: str
    reason: str = ""
    run_id: str | None = Field(default=None, alias="runId")
    doc_id: str | None = Field(default=None, alias="docId")
    requested_at: str | None = Field(default=None, alias="requestedAt")

    model_config = {"populate_by_name": True}


class AgreementDecisionRequest(BaseModel):
    """사람의 결정 (승인/거절) 요청 바디."""

    approved: bool
