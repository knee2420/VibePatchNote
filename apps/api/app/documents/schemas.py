"""documents 도메인의 요청/응답 스키마."""
from typing import List, Optional

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    status: str = Field(..., description="처리 상태 (processing/completed)")
    job_id: str = Field(..., description="네이티브 워크플로우 잡 식별자")
    message: str
    file_url: Optional[str] = Field(None, description="프런트엔드가 렌더링할 파일 URL")


class ExtractionStatusResponse(BaseModel):
    status: str
    progress: int


class SegmentItem(BaseModel):
    id: str = Field(..., description="세그먼트 식별자")
    page: int = Field(1, description="문서 페이지 번호 (1-based)")
    type: str = Field(..., description="블록 타입: section, table, list, paragraph")
    label: str = Field(..., description="블록 표시 라벨/제목")
    box_2d: List[int] = Field(
        ..., description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    content_summary: Optional[str] = Field(None, description="블록 내용 요약")


class ScanDocumentRequest(BaseModel):
    filename: str = Field(..., description="스캔할 문서 파일명 또는 상대 경로")


class ScanDocumentResponse(BaseModel):
    status: str = Field("completed", description="처리 상태 (completed/failed)")
    document_title: str = Field(..., description="문서 제목")
    total_segments: int = Field(..., description="감지된 세그먼트 수")
    segments: List[SegmentItem] = Field(default_factory=list, description="세그먼트 목록")

