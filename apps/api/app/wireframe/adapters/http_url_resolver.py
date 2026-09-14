"""HTTP 프레젠테이션 계층의 와이어프레임 URL 해석기 및 메타 조립 어댑터 (Ports & Adapters)."""
from typing import Optional

from ..ports import WireframeUrlResolverPort
from ..schemas import (
    ASSET_HTML,
    ASSET_MARKDOWN,
    ASSET_PROMPT_SPEC,
    ASSET_RENDER_HTML,
    ASSET_SLOTS,
    ASSET_VISION_ORIGINAL,
    ASSET_VISION_OVERLAY,
    ASSET_VISION_RENDER,
    WireframeArchiveMeta,
    WireframeArchiveRecord,
)


class HttpWireframeUrlResolver(WireframeUrlResolverPort):
    """FastAPI 라우트 규격에 맞춰 에셋 접근 URL 및 Meta DTO 조립을 전담하는 웹 어댑터."""

    def __init__(self, asset_route_prefix: str = "/api/v1/scaffolds") -> None:
        self._asset_route_prefix = asset_route_prefix.rstrip("/")

    def resolve_asset_url(
        self,
        scaffold_id: str,
        asset_name: str,
        base_url: Optional[str] = None,
    ) -> str:
        """단일 에셋의 클라이언트 접근 URL을 반환한다."""
        prefix = base_url.rstrip("/") if base_url else ""
        return f"{prefix}{self._asset_route_prefix}/{scaffold_id}/assets/{asset_name}"

    def to_meta(
        self,
        record: WireframeArchiveRecord,
        archive_dir: str,
        has_render: bool = False,
        has_render_image: bool = False,
        base_url: Optional[str] = None,
    ) -> WireframeArchiveMeta:
        """WireframeArchiveRecord 에 URL 및 디렉터리 경로를 결합하여 전송용 WireframeArchiveMeta 를 조립한다."""
        prefix = base_url.rstrip("/") if base_url else ""
        sid = record.scaffold_id
        route = f"{prefix}{self._asset_route_prefix}/{sid}/assets"

        html_asset = ASSET_RENDER_HTML if has_render else ASSET_HTML
        render_img_url = f"{route}/{ASSET_VISION_RENDER}" if has_render_image else ""

        return WireframeArchiveMeta(
            scaffold_id=record.scaffold_id,
            doc_id=record.doc_id,
            title=record.title,
            source_pdf_file_name=record.source_pdf_file_name,
            created_at=record.created_at,
            slots_count=record.slots_count,
            difficulty=record.difficulty,
            engine_scaffold_id=record.engine_scaffold_id,
            target_doc=record.target_doc,
            description=record.description,
            page_number=record.page_number,
            total_pages=record.total_pages,
            pages=record.pages,
            revision=record.revision,
            updated_at=record.updated_at,
            overlay_image_url=f"{route}/{ASSET_VISION_OVERLAY}",
            original_image_url=f"{route}/{ASSET_VISION_ORIGINAL}",
            render_image_url=render_img_url,
            prompt_spec_url=f"{route}/{ASSET_PROMPT_SPEC}",
            html_url=f"{route}/{html_asset}",
            markdown_url=f"{route}/{ASSET_MARKDOWN}",
            slots_url=f"{route}/{ASSET_SLOTS}",
            archive_dir=archive_dir,
        )


# 하위 호환 및 도메인 정석 별칭
WireframeHttpPresenter = HttpWireframeUrlResolver
