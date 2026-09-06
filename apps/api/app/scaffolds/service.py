"""scaffolds 비즈니스 오케스트레이션 서비스 (SRP 준수).

포맷터(Formatters)와 저장소(Repository)를 조율하여
스캐폴딩 아티팩트의 생성/영속화 및 조회를 총괄합니다.
"""
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.core.config import settings
from scaffold_engine.types import ScaffoldExtractResult
from scaffold_engine.vision import render_page_as_png, render_slot_overlay_png

from .formatters import ManifestFormatter, PromptSpecFormatter
from .repository import (
    IScaffoldRepository,
    local_scaffold_repository,
    sanitize_scaffold_id,
)
from .schemas import (
    ScaffoldArchiveDetail,
    ScaffoldArchiveListResponse,
    ScaffoldArchiveMeta,
)

logger = logging.getLogger(__name__)


class ScaffoldArchiveService:
    """스캐폴드 아카이빙 비즈니스 로직 조율자."""

    def __init__(self, repository: Optional[IScaffoldRepository] = None) -> None:
        self.repository = repository or local_scaffold_repository

    def archive_scaffold(
        self,
        pdf_path: Path,
        result: ScaffoldExtractResult,
        page_number: int = 1,
    ) -> ScaffoldArchiveMeta:
        """스캐폴딩 결과와 시각 비전을 아카이브로 오케스트레이션하여 영속화."""
        now_iso = datetime.now(timezone.utc).isoformat()
        stem = sanitize_scaffold_id(pdf_path.stem)
        scaffold_id = f"scaffold-{stem}-{int(time.time())}"
        title = result.meta.title or f"{pdf_path.stem} 서식 틀"

        slots_data = [
            s.model_dump(by_alias=True) if hasattr(s, "model_dump") else s
            for s in result.slots
        ]

        # 1. 비전 이미지 합성 (렌더링 실패는 아카이브 전체 실패로 번지지 않도록 방어)
        orig_png = None
        overlay_png = None
        try:
            orig_png = render_page_as_png(pdf_path, page_number=page_number, dpi=150)
            overlay_png = render_slot_overlay_png(pdf_path, result.slots, page_number=page_number, dpi=150)
        except Exception as exc:
            logger.warning("[ScaffoldArchiveService] Vision rendering skipped: %s", exc)

        # 2. 에이전트 마크다운 명세서 포맷팅
        prompt_spec_md = PromptSpecFormatter.format(
            title=title,
            source_name=pdf_path.name,
            slots=slots_data,
            markdown_content=result.markdown_content,
            created_at=now_iso,
        )

        # 3. 매니페스트 메타데이터 포맷팅
        archive_dir_path = settings.scaffold_storage_dir / scaffold_id
        meta = ManifestFormatter.create_meta(
            scaffold_id=scaffold_id,
            title=title,
            source_pdf_file_name=pdf_path.name,
            slots_count=len(slots_data),
            difficulty=result.meta.difficulty,
            archive_dir=str(archive_dir_path.resolve()),
            created_at=now_iso,
        )

        # 4. 저장소(Repository)에 영속화 위임
        self.repository.save_artifacts(
            scaffold_id=scaffold_id,
            manifest_data=meta.model_dump(by_alias=True),
            html_content=result.html_content,
            slots_data=slots_data,
            prompt_spec_md=prompt_spec_md,
            original_png=orig_png,
            overlay_png=overlay_png,
        )

        logger.info("[ScaffoldArchiveService] Archived '%s' (%s)", title, scaffold_id)
        return meta

    def get_archive(self, scaffold_id: str) -> Optional[ScaffoldArchiveDetail]:
        """단일 아카이브 상세 조회 위임."""
        return self.repository.find_by_id(scaffold_id)

    def list_archives(self) -> ScaffoldArchiveListResponse:
        """전체 아카이브 목록 조회 위임."""
        items = self.repository.find_all()
        return ScaffoldArchiveListResponse(total=len(items), items=items)

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        """에셋 파일 경로 해석 위임."""
        return self.repository.get_asset_file(scaffold_id, asset_subpath)


scaffold_archive_service = ScaffoldArchiveService()
