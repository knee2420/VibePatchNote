"""scaffolds 도메인의 Pydantic 스키마 정의 (SSOT)."""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ScaffoldArchiveMeta(BaseModel):
    """보관된 스캐폴드 요약 메타데이터."""
    scaffold_id: str = Field(..., description="스캐폴드 고유 식별자")
    title: str = Field(..., description="서식 제목")
    source_pdf_file_name: str = Field(..., description="원본 PDF 파일명")
    created_at: str = Field(..., description="아카이브 생성 일시 (ISO-8601)")
    slots_count: int = Field(default=0, description="추출된 슬롯 수")
    difficulty: str = Field(default="easy", description="서식 복잡도")
    overlay_image_url: str = Field(..., description="슬롯 바운딩 박스 오버레이 이미지 URL")
    original_image_url: str = Field(..., description="원본 PDF 페이지 렌더링 이미지 URL")
    prompt_spec_url: str = Field(..., description="에이전트 전용 슬롯 마크다운 명세서 URL")
    html_url: str = Field(..., description="Tiptap 서식 HTML URL")
    slots_url: str = Field(..., description="슬롯 좌표 JSON URL")
    archive_dir: str = Field(..., description="로컬 파일 시스템 저장 경로")

    class Config:
        populate_by_name = True


class ScaffoldArchiveDetail(ScaffoldArchiveMeta):
    """단일 스캐폴드 상세 (전체 콘텐츠 포함)."""
    html_content: str = Field(..., description="Tiptap 에디터용 HTML DOM")
    markdown_content: str = Field(..., description="와이어프레임 마크다운 본문")
    slots: List[Dict[str, Any]] = Field(default_factory=list, description="슬롯별 기하 좌표 및 메타")


class ScaffoldArchiveListResponse(BaseModel):
    """아카이브 목록 응답."""
    total: int
    items: List[ScaffoldArchiveMeta]
