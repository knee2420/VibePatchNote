"""documents 도메인의 요청/응답 스키마 (SSOT).

식별자는 `docId` 다. `filename` 은 아직 `docId` 로 옮기지 않은 클라이언트를 위한
과도기 통로이며, 둘 다 비어 있으면 요청을 거절한다.
"""
from __future__ import annotations

from typing import Any, Dict, Optional

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
