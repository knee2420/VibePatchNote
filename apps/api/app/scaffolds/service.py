"""scaffolds 비즈니스 오케스트레이션 서비스 (SRP 준수).

포맷터(Formatters)와 저장소(Repository)를 조율하여
스캐폴딩 아티팩트의 생성/영속화 및 조회를 총괄합니다.

저장은 환경 비종속 레코드로, 응답은 현재 실행 환경 기준 URL 을 입힌 메타로.
이 변환의 책임은 이 계층에만 있다.
"""
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from scaffold_engine.types import ScaffoldExtractResult
from scaffold_engine.vision import (
    render_page_as_png,
    render_scaffold_png,
    render_slot_overlay_png,
)

from app.core.storage import new_id

from .formatters import ManifestFormatter, PromptSpecFormatter
from .ports import ScaffoldRepository
from .schemas import (
    ASSET_VISION_RENDER,
    ScaffoldArchiveDetail,
    ScaffoldArchiveMeta,
    ScaffoldArchiveRecord,
)

logger = logging.getLogger(__name__)


class ScaffoldArchiveService:
    """스캐폴드 아카이빙 비즈니스 로직 조율자."""

    def __init__(self, repository: ScaffoldRepository) -> None:
        self.repository = repository

    def archive_scaffold(
        self,
        doc_id: str,
        pdf_path: Path,
        result: ScaffoldExtractResult,
        page_number: int = 1,
    ) -> ScaffoldArchiveMeta:
        """스캐폴딩 결과와 시각 비전을 아카이브로 오케스트레이션하여 영속화.

        식별자는 파일명이 아니라 대리키다. 파일명을 넣으면 이름을 바꾼 순간
        같은 서식이 다른 id 를 갖게 되고, 한글·공백이 그대로 경로에 실린다.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        scaffold_id = new_id("scaffold")
        title = result.meta.title or f"{pdf_path.stem} 서식 틀"

        # 1. 비전 이미지 합성 — 원본 / 슬롯 오버레이 / 재구성본 세 장면.
        #    렌더링 실패는 아카이브 전체 실패로 번지지 않도록 방어한다.
        orig_png = None
        overlay_png = None
        render_png = None
        try:
            orig_png = render_page_as_png(pdf_path, page_number=page_number, dpi=150)
            overlay_png = render_slot_overlay_png(
                pdf_path, result.slots, page_number=page_number, dpi=150
            )
        except Exception as exc:
            logger.warning("[ScaffoldArchiveService] Vision rendering skipped: %s", exc)
        try:
            render_png = render_scaffold_png(result.html_content, dpi=150)
        except Exception as exc:
            logger.warning("[ScaffoldArchiveService] Scaffold render skipped: %s", exc)

        # 2. 에이전트 마크다운 명세서 포맷팅 (엔진 슬롯 모델을 그대로 넘긴다)
        prompt_spec_md = PromptSpecFormatter.format(
            title=title,
            source_name=pdf_path.name,
            slots=result.slots,
            markdown_content=result.markdown_content,
            created_at=now_iso,
        )

        # 3. 매니페스트 코어 레코드 구성 (엔진 판정 메타까지 함께 보존)
        record = ManifestFormatter.create_record(
            scaffold_id=scaffold_id,
            engine_meta=result.meta,
            title=title,
            source_pdf_file_name=pdf_path.name,
            slots_count=len(result.slots),
            doc_id=doc_id,
            page_number=page_number,
            created_at=now_iso,
        )

        # 4. 저장소(Repository)에 영속화 위임
        self.repository.save_artifacts(
            record=record,
            html_content=result.html_content,
            markdown_content=result.markdown_content,
            slots=result.slots,
            prompt_spec_md=prompt_spec_md,
            original_png=orig_png,
            overlay_png=overlay_png,
            render_png=render_png,
        )

        logger.info("[ScaffoldArchiveService] Archived '%s' (%s)", title, scaffold_id)
        return self._to_meta(record)

    def _to_meta(self, record: ScaffoldArchiveRecord) -> ScaffoldArchiveMeta:
        """코어 레코드에 조회 시점의 URL/경로를 입혀 응답 메타로 변환."""
        return ManifestFormatter.to_meta(
            record,
            archive_dir=str(self.repository.resolve_dir(record.scaffold_id)),
            has_render_image=self.repository.has_asset(record.scaffold_id, ASSET_VISION_RENDER),
        )

    def get_archive(self, scaffold_id: str) -> Optional[ScaffoldArchiveDetail]:
        """단일 아카이브 상세 조회. 마크다운은 엔진 원문을 그대로 돌려준다."""
        contents = self.repository.find_contents(scaffold_id)
        if not contents:
            return None

        meta = self._to_meta(contents.record)
        return ScaffoldArchiveDetail(
            **meta.model_dump(),
            html_content=contents.html_content,
            markdown_content=contents.markdown_content,
            origin_html_content=contents.origin_html_content,
            origin_markdown_content=contents.origin_markdown_content,
            prompt_spec_md=contents.prompt_spec_md,
            slots=contents.slots,
        )

    def update_render(
        self,
        scaffold_id: str,
        html_content: str,
        markdown_content: Optional[str] = None,
    ) -> Optional[ScaffoldArchiveMeta]:
        """캔버스에서 편집된 작업본을 아카이브에 되쓴다.

        본문의 SSOT 는 이 저장소다. 캔버스/세션 DB 는 scaffoldId 포인터만 들고 있으므로,
        편집 결과가 여기에 도달하지 못하면 그 편집은 존재하지 않은 것과 같다.
        """
        record = self.repository.save_render(
            scaffold_id=scaffold_id,
            html_content=html_content,
            markdown_content=markdown_content,
            updated_at=datetime.now(timezone.utc).isoformat(),
        )
        if not record:
            return None

        # 재구성본 스냅샷은 브라우저 UI(Tiptap)가 실제 렌더링된 DOM 화면을 캡처하여
        # update_render_image 로 직접 업로드하는 것이 단일 진실 공급원(SSOT)이다.
        # 기존 이미지가 아예 없는 초기 상태에서만 간이 렌더러로 폴백을 생성한다.
        if not self.repository.has_asset(scaffold_id, ASSET_VISION_RENDER):
            try:
                png = render_scaffold_png(html_content, dpi=150)
                if png:
                    self.repository.save_render_image(scaffold_id, png)
            except Exception as exc:
                logger.warning("[ScaffoldArchiveService] Render snapshot skipped: %s", exc)

        return self._to_meta(record)

    def update_render_image(self, scaffold_id: str, png_bytes: bytes) -> Optional[ScaffoldArchiveMeta]:
        """재구성본 화면 스냅샷을 아카이브에 보관한다.

        서식이 실제로 어떻게 재구성됐는지는 HTML 만 봐서는 알 수 없다. 화면 스냅샷을
        같이 남겨야 원본 PDF·슬롯 오버레이와 나란히 비교할 수 있다.
        """
        if not self.repository.save_render_image(scaffold_id, png_bytes):
            return None
        contents = self.repository.find_contents(scaffold_id)
        return self._to_meta(contents.record) if contents else None

    def get_asset_file(self, scaffold_id: str, asset_subpath: str) -> Optional[Path]:
        """에셋 파일 경로 해석 위임."""
        return self.repository.get_asset_file(scaffold_id, asset_subpath)

    def delete_for_document(self, doc_id: str) -> int:
        """문서 삭제 연쇄. documents 도메인이 이 계약으로만 호출한다."""
        return self.repository.delete_for_document(doc_id)

    def list_for_document(self, doc_id: str) -> list[ScaffoldArchiveMeta]:
        return [self._to_meta(record) for record in self.repository.list_for_document(doc_id)]
