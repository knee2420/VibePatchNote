"""Step 0: 문서 실측 기하 및 텍스트 블록 추출 단계 (PyMuPDF)."""
import logging
from pathlib import Path
from typing import Optional

from app.documents.pipeline.context import DocumentPipelineContext
from app.documents.pipeline.steps.base import PipelineStep

logger = logging.getLogger(__name__)


class ExtractGeometryStep(PipelineStep):
    """
    로컬 PyMuPDF (PdfVisionRenderer)를 사용하여
    PDF의 페이지별 텍스트 블록, 표(TableGeometry), 이미지 기하 정보를 고속 실측합니다.
    """

    def __init__(self, dpi: int = 150) -> None:
        self.dpi = dpi

    @property
    def name(self) -> str:
        return "extract_geometry"

    async def execute(self, ctx: DocumentPipelineContext) -> None:
        file_path = ctx.file_path
        ctx.log(f"[{self.name}] 원본 기하 실측 시작: {file_path.name}")

        if file_path.suffix.lower() == ".pdf":
            try:
                from scaffold_engine.vision.pdf_renderer import PdfVisionRenderer

                renderer = PdfVisionRenderer(dpi=self.dpi)
                pages = renderer.render_pages(file_path)
                ctx.geometry_pages = pages
                ctx.metadata["total_pages"] = len(pages)
                ctx.log(f"[{self.name}] PDF 기하 실측 완료: 총 {len(pages)}페이지")
            except Exception as exc:
                logger.error("기하 실측 중 오류: %s", exc, exc_info=True)
                ctx.log(f"[{self.name}] PDF 실측 실패 ({exc}) - 텍스트 폴백 진행")
                self._fallback_text_read(ctx)
        else:
            self._fallback_text_read(ctx)

    def _fallback_text_read(self, ctx: DocumentPipelineContext) -> None:
        """PDF 외 마크다운이나 일반 텍스트 문서를 위한 폴백."""
        try:
            content = ctx.file_path.read_text(encoding="utf-8", errors="replace")
            ctx.metadata["raw_text"] = content
            ctx.metadata["total_pages"] = 1
            ctx.log(f"[{self.name}] 텍스트 직접 로드 완료 ({len(content)}자)")
        except Exception as exc:
            logger.warning("텍스트 파일 로드 실패: %s", exc)
