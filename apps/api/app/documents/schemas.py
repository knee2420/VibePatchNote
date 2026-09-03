"""documents 도메인의 요청/응답 스키마."""
from typing import Optional

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    status: str = Field(..., description="처리 상태 (processing/completed)")
    job_id: str = Field(..., description="네이티브 워크플로우 잡 식별자")
    message: str
    file_url: Optional[str] = Field(None, description="프런트엔드가 렌더링할 파일 URL")


class ExtractionStatusResponse(BaseModel):
    status: str
    progress: int
