"""documents 도메인의 요청/응답 스키마 및 도메인 모델."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# --- HTTP 요청/응답 ---------------------------------------------------------


class UploadResponse(BaseModel):
    status: str = Field(..., description="처리 상태 (processing/completed)")
    job_id: str = Field(..., description="네이티브 워크플로우 잡 식별자")
    message: str
    file_url: str = Field(..., description="프런트엔드가 렌더링할 파일 URL")


class ExtractionStatusResponse(BaseModel):
    status: str
    progress: int


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


class ScanDocumentRequest(BaseModel):
    filename: str = Field(..., description="스캔할 문서 파일명 또는 상대 경로")


class ScanDocumentResponse(BaseModel):
    status: str = Field("completed", description="처리 상태 (completed/failed)")
    document_title: str = Field(..., description="문서 제목")
    total_segments: int = Field(..., description="감지된 세그먼트 수")
    segments: List[SegmentItem] = Field(default_factory=list, description="세그먼트 목록")


class ScaffoldDocumentRequest(BaseModel):
    filename: str = Field(..., description="스캐폴딩을 추출할 PDF 파일명")


class ScaffoldDocumentResponse(BaseModel):
    status: str = Field("completed", description="처리 상태")
    meta: Dict[str, Any] = Field(..., description="서식 메타데이터")
    html_content: str = Field(..., alias="htmlContent", description="Tiptap 에디터용 HTML")
    markdown_content: str = Field(..., alias="markdownContent", description="에이전트/MCP 용 마크다운")

    class Config:
        populate_by_name = True


# --- 도메인 모델 -------------------------------------------------------------
# Phase 1~3 파이프라인이 주고받을 계층형 문서 트리 표현입니다.
# 평면 스캔 결과(SegmentItem)와 달리 의미 계층을 갖습니다.


class DocumentMeta(BaseModel):
    domain: str = Field(..., description="e.g., youtube_script, proposal")
    goal: str = Field(..., description="Reverse-engineered goal of the reference")
    attributes: Dict[str, Any] = Field(default_factory=dict)


class DocumentSegmentNode(BaseModel):
    id: str
    type: str = Field(..., description="e.g., heading, paragraph, list")
    content: str
    semantic_role: Optional[str] = None
    children: List["DocumentSegmentNode"] = []


DocumentSegmentNode.model_rebuild()


class DocumentTree(BaseModel):
    document_id: str
    meta: DocumentMeta
    root: DocumentSegmentNode
