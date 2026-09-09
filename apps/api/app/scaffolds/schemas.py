"""scaffolds 도메인의 Pydantic 스키마 정의 (SSOT).

이 저장소가 스캐폴드 본문의 단일 진실 공급원(SSOT)이다. 캔버스 노드/세션 DB 는
scaffoldId 포인터만 들고 있고, 본문은 언제나 여기서 읽고 여기에 쓴다.

저장 형태와 전송 형태는 분리한다.

- **저장(ScaffoldArchiveRecord)**: 실행 환경에 종속되지 않는 코어 메타만 필드명
  그대로(snake_case) manifest.json 에 기록한다. URL·절대경로는 저장하지 않는다.
- **전송(ScaffoldArchiveMeta / ScaffoldArchiveDetail)**: 프런트엔드 계약에 맞춰
  camelCase 별칭으로 직렬화하고, 에셋 URL 과 저장 경로는 조회 시점에 조립한다.

본문은 두 갈래로 보관한다.

- **원본(scaffold.html / content.md)**: 엔진 조립 결과. 불변. 회귀 추적의 기준선.
- **작업본(render.html / render.md)**: 사용자가 Tiptap 에서 편집한 결과. 조회 시
  작업본이 있으면 그것을, 없으면 원본을 현재 본문으로 돌려준다.

슬롯은 엔진 SSOT(scaffold_engine.types.SlotMappingItem)를 그대로 재사용한다.
아카이브가 좌표 스키마를 따로 정의하면 엔진과 어긋날 수 있기 때문이다.
"""
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel
from scaffold_engine.types import SlotMappingItem

# --- 아카이브 디렉터리 내 표준 아티팩트 경로 (repository/formatters 공용 SSOT) ---
ASSET_MANIFEST = "manifest.json"
ASSET_HTML = "scaffold.html"
ASSET_MARKDOWN = "content.md"
ASSET_RENDER_HTML = "render.html"
ASSET_RENDER_MARKDOWN = "render.md"
ASSET_PROMPT_SPEC = "prompt_spec.md"
ASSET_SLOTS = "slots.json"
ASSET_VISION_ORIGINAL = "vision/original_p1.png"
ASSET_VISION_OVERLAY = "vision/overlay_p1.png"
# 재구성본(Tiptap 에디터가 실제로 그린 서식)의 화면 스냅샷.
ASSET_VISION_RENDER = "vision/render_p1.png"


class ScaffoldArchiveRecord(BaseModel):
    """manifest.json 에 실제로 기록되는 환경 비종속 코어 메타."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    scaffold_id: str = Field(..., description="스캐폴드 고유 식별자")
    title: str = Field(..., description="서식 제목")
    source_pdf_file_name: str = Field(..., description="원본 PDF 파일명")
    created_at: str = Field(..., description="아카이브 생성 일시 (ISO-8601)")
    slots_count: int = Field(default=0, description="추출된 슬롯 수")
    difficulty: str = Field(default="easy", description="서식 복잡도")
    engine_scaffold_id: str = Field(default="", description="엔진이 부여한 원본 스캐폴드 ID")
    target_doc: str = Field(default="", description="엔진이 판정한 타겟 문서 유형")
    description: str = Field(default="", description="엔진이 산출한 서식 레이아웃 설명")
    page_number: int = Field(default=1, description="아카이빙된 원본 페이지 번호")
    revision: int = Field(default=0, description="사용자 편집 저장 횟수. 0이면 엔진 원본 그대로")
    updated_at: str = Field(default="", description="마지막 작업본 저장 일시 (ISO-8601)")


class ScaffoldArchiveMeta(ScaffoldArchiveRecord):
    """API 응답용 요약 메타. 에셋 URL 은 조회 시점에 조립된 값이다."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")

    overlay_image_url: str = Field(..., description="슬롯 바운딩 박스 오버레이 이미지 URL")
    original_image_url: str = Field(..., description="원본 PDF 페이지 렌더링 이미지 URL")
    prompt_spec_url: str = Field(..., description="에이전트 전용 슬롯 마크다운 명세서 URL")
    html_url: str = Field(..., description="엔진 원본 서식 HTML URL")
    markdown_url: str = Field(..., description="엔진 원문 마크다운 URL")
    render_url: str = Field(..., description="사용자 편집 작업본 HTML URL")
    render_image_url: str = Field(..., description="재구성본 화면 스냅샷 PNG URL")
    has_render_image: bool = Field(default=False, description="재구성본 스냅샷 보관 여부")
    slots_url: str = Field(..., description="슬롯 좌표 JSON URL")
    archive_dir: str = Field(..., description="현재 실행 환경 기준 로컬 저장 경로")


class ScaffoldArchiveDetail(ScaffoldArchiveMeta):
    """단일 스캐폴드 상세. 캔버스가 복원에 쓰는 본문 전체를 담는다."""

    html_content: str = Field(..., description="현재 본문 HTML (작업본 우선, 없으면 엔진 원본)")
    markdown_content: str = Field(..., description="현재 본문 마크다운 (작업본 우선)")
    origin_html_content: str = Field(default="", description="엔진 조립 원본 HTML")
    origin_markdown_content: str = Field(default="", description="엔진 원문 마크다운")
    prompt_spec_md: str = Field(default="", description="슬롯 명세서 마크다운 문서")
    slots: List[SlotMappingItem] = Field(default_factory=list, description="슬롯별 기하 좌표 및 메타")


class ScaffoldRenderUpdate(BaseModel):
    """작업본 저장 요청 본문."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    html_content: str = Field(..., description="Tiptap 편집 결과 HTML")
    markdown_content: Optional[str] = Field(default=None, description="Tiptap 편집 결과 마크다운")


class ScaffoldArchiveContents(BaseModel):
    """저장소가 디스크에서 복원한 아카이브 원자료 (레코드 + 본문)."""

    model_config = ConfigDict(populate_by_name=True)

    record: ScaffoldArchiveRecord
    html_content: str = ""
    markdown_content: str = ""
    origin_html_content: str = ""
    origin_markdown_content: str = ""
    prompt_spec_md: str = ""
    slots: List[SlotMappingItem] = Field(default_factory=list)
