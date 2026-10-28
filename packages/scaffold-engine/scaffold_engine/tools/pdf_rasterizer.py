"""[scaffold_engine.tools] PDF 고해상도 이미지 래스터라이저 (PdfRasterizer).

PyMuPDF(fitz)를 사용하여 PDF 페이지를 PNG 이미지로 렌더링하고,
멀티모달 LLM 및 관측 뷰어용 고해상도 시각 에셋을 생성합니다.
"""
from __future__ import annotations

import logging
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from ..utils.coordinates import normalize_bbox

logger = logging.getLogger(__name__)


@dataclass
class PageImageInfo:
    """렌더링된 단일 페이지 이미지 및 기본 메타데이터."""

    page_number: int
    image_path: Path
    width: float
    height: float
    dpi: int


class PdfRasterizer:
    """PDF 페이지를 지정된 DPI의 고해상도 이미지 파일 또는 바이트로 렌더링하는 도구."""

    def __init__(self, dpi: int = 150) -> None:
        self.dpi = dpi
        self.zoom = dpi / 72.0

    def render_page(
        self,
        pdf_path: Union[str, Path],
        page_number: int = 1,
        output_path: Optional[Union[str, Path]] = None,
    ) -> PageImageInfo:
        """단일 PDF 페이지를 PNG 이미지로 렌더링합니다."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")

        doc = fitz.open(pdf_path)
        try:
            page_idx = max(0, page_number - 1)
            if page_idx >= len(doc):
                raise IndexError(f"페이지 번호 초과: {page_number} (총 {len(doc)}페이지)")

            page = doc[page_idx]
            pw, ph = page.rect.width, page.rect.height
            mat = fitz.Matrix(self.zoom, self.zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)

            if output_path is None:
                tmp_dir = Path(tempfile.gettempdir()) / "scaffold_rasterizer" / pdf_path.stem
                tmp_dir.mkdir(parents=True, exist_ok=True)
                dest = tmp_dir / f"page_{page_number}.png"
            else:
                dest = Path(output_path).resolve()
                dest.parent.mkdir(parents=True, exist_ok=True)

            pix.save(str(dest))
            return PageImageInfo(
                page_number=page_number,
                image_path=dest,
                width=pw,
                height=ph,
                dpi=self.dpi,
            )
        finally:
            doc.close()

    def render_all_pages(
        self,
        pdf_path: Union[str, Path],
        output_dir: Optional[Union[str, Path]] = None,
    ) -> List[PageImageInfo]:
        """PDF의 모든 페이지를 순차적으로 렌더링하여 이미지 목록을 반환합니다."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")

        doc = fitz.open(pdf_path)
        try:
            total_pages = len(doc)
            results: List[PageImageInfo] = []

            out_dir = (
                Path(output_dir).resolve()
                if output_dir
                else Path(tempfile.gettempdir()) / "scaffold_rasterizer" / pdf_path.stem
            )
            out_dir.mkdir(parents=True, exist_ok=True)

            mat = fitz.Matrix(self.zoom, self.zoom)
            for page_idx in range(total_pages):
                page_num = page_idx + 1
                page = doc[page_idx]
                pw, ph = page.rect.width, page.rect.height
                pix = page.get_pixmap(matrix=mat, alpha=False)
                dest = out_dir / f"page_{page_num}.png"
                pix.save(str(dest))

                results.append(
                    PageImageInfo(
                        page_number=page_num,
                        image_path=dest,
                        width=pw,
                        height=ph,
                        dpi=self.dpi,
                    )
                )
            return results
        finally:
            doc.close()


# 하위 호환성 alias
PdfVisionRenderer = PdfRasterizer


def render_page_as_png(
    pdf_path: Union[str, Path],
    page_number: int = 1,
    dpi: int = 150,
) -> bytes:
    """PDF 지정 페이지를 순수 PNG 바이너리로 렌더링합니다."""
    doc = fitz.open(str(pdf_path))
    try:
        idx = min(max(page_number, 1), len(doc)) - 1
        page = doc[idx]
        pix = page.get_pixmap(dpi=dpi)
        return pix.tobytes("png")
    finally:
        doc.close()


__all__ = [
    "PageImageInfo",
    "PdfRasterizer",
    "PdfVisionRenderer",
    "render_page_as_png",
]
