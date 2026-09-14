"""wireframe 도메인의 Pydantic 스키마 정의 (SSOT)."""
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from scaffold_engine.wireframe import SlotMappingItem

# --- 아카이브 디렉터리 내 표준 아티팩트 경로 SSOT ---
ASSET_MANIFEST = "manifest.json"
ASSET_HTML = "scaffold.html"
ASSET_MARKDOWN = "content.md"
ASSET_RENDER_HTML = "render.html"
ASSET_RENDER_MARKDOWN = "render.md"
ASSET_PROMPT_SPEC = "prompt_spec.md"
ASSET_SLOTS = "slots.json"
ASSET_VISION_ORIGINAL = "vision/original_p1.png"
ASSET_VISION_OVERLAY = "vision/overlay_p1.png"
ASSET_VISION_RENDER = "vision/render_p1.png"


class WireframeArchiveRecord(BaseModel):
    """manifest.json 에 실제로 기록되는 환경 비종속 코어 메타."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    scaffold_id: str = Field(..., description="와이어프레임/스캐폴드 고유 식별자")
    doc_id: str = Field(default="", description="원본 문서 식별자")
    title: str = Field(..., description="서식 제목")
    source_pdf_file_name: str = Field(..., description="원본 파일명")
    created_at: str = Field(..., description="아카이브 생성 일시 (ISO-8601)")
    slots_count: int = Field(default=0, description="추출된 슬롯 수")
    difficulty: str = Field(default="easy", description="서식 복잡도")
    engine_scaffold_id: str = Field(default="", description="엔진 원본 ID")
    target_doc: str = Field(default="", description="엔진 타겟 문서 유형")
    description: str = Field(default="", description="서식 설명")
    page_number: int = Field(default=1, description="아카이빙된 원본 페이지 번호")
    total_pages: int = Field(default=1, description="총 페이지 수")
    pages: List[int] = Field(default_factory=lambda: [1], description="포함된 페이지 번호 목록")
    revision: int = Field(default=1, description="작업본 편집 횟수")
    updated_at: Optional[str] = Field(default=None, description="마지막 작업본 편집 일시")


class WireframeArchiveMeta(WireframeArchiveRecord):
    """프런트엔드 전송용 메타 모델."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total_pages: int = Field(default=1, description="총 페이지 수")
    pages: List[int] = Field(default_factory=lambda: [1], description="포함된 페이지 번호 목록")

    overlay_image_url: str = Field(default="", description="슬롯 오버레이 이미지 URL")
    original_image_url: str = Field(default="", description="원본 렌더 이미지 URL")
    render_image_url: str = Field(default="", description="편집 작업본 스냅샷 URL")
    prompt_spec_url: str = Field(default="", description="슬롯 명세 마크다운 URL")
    html_url: str = Field(default="", description="Tiptap HTML URL")
    markdown_url: str = Field(default="", description="에이전트용 Markdown URL")
    slots_url: str = Field(default="", description="슬롯 매핑 JSON URL")
    archive_dir: str = Field(default="", description="로컬 절대 경로")


class WireframeArchiveContents(BaseModel):
    """저장소에서 조회한 아카이브 본문."""

    model_config = ConfigDict(populate_by_name=True)

    record: WireframeArchiveRecord
    html_content: str
    markdown_content: str
    slots: List[SlotMappingItem]
    has_render: bool = False


class WireframeArchiveDetail(WireframeArchiveMeta):
    """단일 아카이브 상세 조회 응답."""

    html_content: str = Field(..., description="현재 본문 HTML")
    markdown_content: str = Field(..., description="현재 본문 마크다운")
    slots: List[SlotMappingItem] = Field(default_factory=list, description="슬롯 매핑 목록")
    has_render: bool = Field(default=False, description="편집 작업본 존재 여부")


class WireframeRenderUpdate(BaseModel):
    """작업본 저장 요청."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    html_content: str = Field(..., description="Tiptap 에서 편집된 HTML")
    markdown_content: Optional[str] = Field(None, description="Tiptap 에서 동기화된 마크다운")


class WireframeGenerateRequest(BaseModel):
    """와이어프레임 생성 요청."""

    doc_id: str = Field(..., alias="docId", description="대상 문서 식별자")
    pages: Optional[List[int]] = Field(default=None, description="처리할 대상 페이지 번호 목록 (None이면 전체)")

    model_config = {"populate_by_name": True}


class WireframeGenerateResponse(BaseModel):
    """와이어프레임 생성 응답."""

    status: str = Field("completed", description="처리 상태")
    doc_id: str = Field(..., alias="docId")
    meta: dict[str, Any] = Field(..., description="서식 메타데이터")
    html_content: str = Field(..., alias="htmlContent")
    markdown_content: str = Field(..., alias="markdownContent")
    slots: List[dict[str, Any]] = Field(default_factory=list)
    archive: Optional[dict[str, Any]] = Field(default=None)
    agent_run_id: Optional[str] = Field(default=None, alias="agentRunId")

    model_config = {"populate_by_name": True}


# 하위 호환성 alias
ScaffoldArchiveRecord = WireframeArchiveRecord
ScaffoldArchiveMeta = WireframeArchiveMeta
ScaffoldArchiveContents = WireframeArchiveContents
ScaffoldArchiveDetail = WireframeArchiveDetail
ScaffoldRenderUpdate = WireframeRenderUpdate
