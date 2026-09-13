"""wireframe 비즈니스 오케스트레이션 서비스."""
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from agent_telemetry import SpanPhase, SpanType, current_scope, traceable
from scaffold_engine.tools import (
    render_page_as_png,
    render_scaffold_png,
    render_slot_overlay_png,
)

from app.core.storage import new_id

from .formatters import ManifestFormatter, PromptSpecFormatter
from .ports import WireframeRepository
from .schemas import (
    ASSET_VISION_RENDER,
    WireframeArchiveDetail,
    WireframeArchiveMeta,
    WireframeArchiveRecord,
)

logger = logging.getLogger(__name__)


class WireframeArchiveService:
    """와이어프레임/스캐폴드 아카이빙 비즈니스 로직 조율자."""

    def __init__(self, repository: WireframeRepository) -> None:
        self.repository = repository

    @traceable(
        name="ScaffoldArtifactCommit",
        span_type=SpanType.TOOL,
        phase=SpanPhase.POST_LLM,
        display_label="와이어프레임 아티팩트 및 비전 에셋 아카이빙",
        description="와이어프레임 결과와 시각 비전(원본, 슬롯 오버레이, 재구성본)을 아카이브로 오케스트레이션하여 영속화합니다.",
    )
    def archive_scaffold(
        self,
        doc_id: str,
        pdf_path: Optional[Path] = None,
        result: Any = None,
        page_number: int = 1,
        source_path: Optional[Path] = None,
    ) -> WireframeArchiveMeta:
        target_path = pdf_path or source_path
        if target_path is None:
            raise ValueError("archive_scaffold requires either pdf_path or source_path")

        now_iso = datetime.now(timezone.utc).isoformat()
        scaffold_id = new_id("scaffold")
        meta_title = getattr(getattr(result, "meta", None), "title", "")
        title = meta_title or f"{target_path.stem} 서식 틀"

        orig_png = None
        overlay_png = None
        render_png = None
        slots = getattr(result, "slots", [])
        try:
            orig_png = render_page_as_png(target_path, page_number=page_number, dpi=150)
            overlay_png = render_slot_overlay_png(
                target_path, slots, page_number=page_number, dpi=150
            )
        except Exception as exc:
            logger.warning("[WireframeArchiveService] Vision rendering skipped: %s", exc)
        try:
            render_png = render_scaffold_png(getattr(result, "html_content", ""), dpi=150)
        except Exception as exc:
            logger.warning("[WireframeArchiveService] Scaffold render skipped: %s", exc)

        prompt_spec_md = PromptSpecFormatter.format(
            title=title,
            source_name=target_path.name,
            slots=slots,
            markdown_content=getattr(result, "markdown_content", ""),
            created_at=now_iso,
        )

        record = ManifestFormatter.to_record(
            scaffold_id=scaffold_id,
            doc_id=doc_id,
            meta=getattr(result, "meta", None),
            source_pdf_file_name=target_path.name,
            slots_count=len(slots),
            page_number=page_number,
        )

        self.repository.save_artifacts(
            record=record,
            html_content=getattr(result, "html_content", ""),
            markdown_content=getattr(result, "markdown_content", ""),
            slots=slots,
            prompt_spec_md=prompt_spec_md,
            original_png=orig_png,
            overlay_png=overlay_png,
            render_png=render_png,
        )

        meta = self._to_meta(record)
        scope = current_scope()
        if scope:
            scope.set_inputs({
                "scaffold_id": scaffold_id,
                "title": title,
                "doc_id": doc_id,
                "slots_count": len(slots),
                "page_number": page_number,
                "pdf_path": str(target_path),
            })
            scope.set_outputs({
                "scaffold_id": scaffold_id,
                "title": meta.title,
                "archive_dir": str(self.repository.resolve_dir(record.scaffold_id)),
                "has_render_image": self.repository.has_asset(record.scaffold_id, ASSET_VISION_RENDER),
            })
            scope.set_label(
                summary_pill=f"아카이브 {scaffold_id[:16]} 영속화 완료",
                data_in=f"{target_path.name} (slots={len(slots)})",
                data_out=f"scaffold_id: {scaffold_id}",
            )
        logger.info("[WireframeArchiveService] Archived '%s' (%s)", title, scaffold_id)
        return meta

    def _to_meta(self, record: WireframeArchiveRecord) -> WireframeArchiveMeta:
        return ManifestFormatter.to_meta(
            record,
            archive_dir=str(self.repository.resolve_dir(record.scaffold_id)),
            has_render_image=self.repository.has_asset(record.scaffold_id, ASSET_VISION_RENDER),
        )

    def get_archive(self, scaffold_id: str) -> Optional[WireframeArchiveDetail]:
        contents = self.repository.find_contents(scaffold_id)
        if not contents:
            return None

        meta = self._to_meta(contents.record)
        return WireframeArchiveDetail(
            **meta.model_dump(),
            html_content=contents.html_content,
            markdown_content=contents.markdown_content,
            slots=contents.slots,
            has_render=contents.has_render,
        )

    def update_render(
        self,
        scaffold_id: str,
        html_content: str,
        markdown_content: Optional[str] = None,
    ) -> Optional[WireframeArchiveMeta]:
        record = self.repository.save_render(
            scaffold_id=scaffold_id,
            html_content=html_content,
            markdown_content=markdown_content,
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        if not record:
            return None

        if not self.repository.has_asset(scaffold_id, ASSET_VISION_RENDER):
            try:
                png = render_scaffold_png(html_content, dpi=150)
                if png:
                    self.repository.save_render_image(scaffold_id, png)
            except Exception as exc:
                logger.warning("[WireframeArchiveService] Render snapshot skipped: %s", exc)

        return self._to_meta(record)

    def update_render_image(self, scaffold_id: str, png_bytes: bytes) -> Optional[WireframeArchiveMeta]:
        if not self.repository.save_render_image(scaffold_id, png_bytes):
            return None
        contents = self.repository.find_contents(scaffold_id)
        return self._to_meta(contents.record) if contents else None

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        return self.repository.get_asset_file(scaffold_id, asset_subpath)

    def delete_for_document(self, doc_id: str) -> int:
        return self.repository.delete_for_document(doc_id)

    def list_for_document(self, doc_id: str) -> list[WireframeArchiveMeta]:
        return [self._to_meta(record) for record in self.repository.list_for_document(doc_id)]


# 하위 호환성 alias
ScaffoldArchiveService = WireframeArchiveService
