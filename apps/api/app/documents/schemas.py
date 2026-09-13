"""documents 도메인의 요청/응답 스키마 (SSOT).

식별자는 `docId` 다. `filename` 은 아직 `docId` 로 옮기지 않은 클라이언트를 위한
과도기 통로이며, 둘 다 비어 있으면 요청을 거절한다.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator

# --- 공통 --------------------------------------------------------------------


class DocumentTarget(BaseModel):
    """어느 문서에 대한 요청인지 가리키는 공통 필드."""

    doc_id: Optional[str] = Field(default=None, alias="docId", description="문서 식별자")
    filename: Optional[str] = Field(
        default=None, description="(과도기) 파일명. docId 가 없을 때만 사용한다."
    )

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def _require_one(self) -> "DocumentTarget":
        if not self.doc_id and not self.filename:
            raise ValueError("docId 또는 filename 중 하나는 있어야 합니다.")
        return self


# --- 업로드 및 조회 -----------------------------------------------------------


class UploadResponse(BaseModel):
    status: str = Field(..., description="처리 상태 (processing/completed)")
    doc_id: str = Field(..., alias="docId", description="문서 식별자")
    message: str
    title: str = Field(..., description="사용자가 올린 그대로의 파일명")
    file_url: str = Field(..., description="프런트엔드가 렌더링할 파일 URL")

    model_config = {"populate_by_name": True}


class DocumentSummary(BaseModel):
    doc_id: str = Field(alias="docId")
    title: str
    mime: str = ""
    size: int = 0
    uploaded_at: str = Field(alias="uploadedAt")
    outline_artifact_id: Optional[str] = Field(default=None, alias="outlineArtifactId")

    model_config = {"populate_by_name": True}


class DocumentArtifactsResponse(BaseModel):
    doc_id: str = Field(alias="docId")
    title: str
    artifacts: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


# --- 세그먼트 스캔 ------------------------------------------------------------


class SegmentItem(BaseModel):
    """스캔 결과의 평면 세그먼트 1건 (프런트 캔버스 오버레이가 그대로 소비)."""

    id: str = Field(..., description="세그먼트 식별자")
    page: int = Field(1, description="문서 페이지 번호 (1-based)")
    type: str = Field(..., description="블록 타입: section, table, list, paragraph")
    label: str = Field(..., description="블록 표시 라벨/제목")
    box_2d: List[int] = Field(
        ..., description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    content_summary: Optional[str] = Field(None, description="블록 내용 요약")


class ScanDocumentRequest(DocumentTarget):
    pass


class ScanDocumentResponse(BaseModel):
    status: str = Field("completed", description="처리 상태 (completed/failed)")
    doc_id: str = Field(..., alias="docId")
    document_title: str = Field(..., description="문서 제목")
    total_segments: int = Field(..., description="감지된 세그먼트 수")
    segments: List[SegmentItem] = Field(default_factory=list, description="세그먼트 목록")
    agent_run_id: Optional[str] = Field(default=None, alias="agentRunId")

    model_config = {"populate_by_name": True}


class SegmentsUpdate(BaseModel):
    """사용자가 편집한 세그먼트 저장 요청."""

    segments: List[SegmentItem] = Field(default_factory=list)
