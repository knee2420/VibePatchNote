"""outline 도메인의 API 스키마."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from scaffold_engine import ElementItem, OutlineNode


class AnalysisError(BaseModel):
    code: str
    message: str
    retryable: bool = False
    requires_action: Optional[str] = Field(None, alias="requiresAction")

    model_config = {"populate_by_name": True}


class ExtractOutlineRequest(BaseModel):
    doc_id: str = Field(..., alias="docId", description="분석할 문서 식별자")
    force_refresh: bool = Field(
        False, description="채택본을 무시하고 새 아티팩트를 만들지 여부"
    )

    model_config = {"populate_by_name": True}


class ExtractOutlineResponse(BaseModel):
    status: str = Field("completed", description="처리 상태 (completed/failed)")
    doc_id: str = Field(..., alias="docId")
    document_title: str = Field(..., alias="documentTitle", description="문서 제목")
    total_pages: int = Field(1, alias="totalPages", description="총 페이지 수")
    total_outlines: int = Field(0, alias="totalOutlines", description="추출된 아웃라인 수")
    total_elements: int = Field(0, alias="totalElements", description="추출된 엘리먼트 수")
    outlines: List[OutlineNode] = Field(default_factory=list, description="계층형 아웃라인 트리")
    elements: List[ElementItem] = Field(default_factory=list, description="뷰어 하이라이트용 평면 엘리먼트")
    markdown_outline: str = Field("", alias="markdownOutline", description="가독성 마크다운 목차")
    manifest: Optional[Dict[str, Any]] = Field(None, description="산출물 provenance")
    artifact_id: Optional[str] = Field(None, alias="artifactId", description="채택된 아티팩트 식별자")
    trace_id: Optional[str] = Field(None, alias="traceId", description="관측 trace 식별자")
    agent_run_id: Optional[str] = Field(None, alias="agentRunId", description="Agent 실행 식별자")
    error: Optional[AnalysisError] = Field(None, description="실패 시 사용자에게 안전하게 노출할 실행 정보")

    model_config = {"populate_by_name": True}


class AdoptOutlineRequest(BaseModel):
    artifact_id: str = Field(..., alias="artifactId", description="채택할 아티팩트 식별자")

    model_config = {"populate_by_name": True}
