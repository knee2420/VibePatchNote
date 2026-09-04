"""PDF Vision & Layout Renderer.

PyMuPDF(fitz)를 사용하여 PDF 페이지를 고해상도 이미지로 렌더링하고
2차원 텍스트 블록 및 위치 정보를 추출합니다.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional
try:
    import pymupdf as fitz
except ImportError:
    import fitz


@dataclass
class PageLayoutInfo:
    page_number: int
    image_path: Path
    width: float
    height: float
    text_blocks: List[Dict[str, Any]] = field(default_factory=list)
    raw_text: str = ""


class PdfVisionRenderer:
    """PDF를 페이지별 고해상도 이미지 및 레이아웃 메타로 변환하는 렌더러."""

    def __init__(self, dpi: int = 150) -> None:
        self.dpi = dpi
        self.zoom = dpi / 72.0  # 기본 72 DPI 기준 배율

    def render_pages(self, pdf_path: Path, output_dir: Optional[Path] = None) -> List[PageLayoutInfo]:
        """PDF의 각 페이지를 PNG 이미지로 렌더링하고 레이아웃 정보를 추출합니다."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        if output_dir is None:
            import tempfile
            output_dir = Path(tempfile.gettempdir()) / "scaffold_vision_cache" / pdf_path.stem
        output_dir.mkdir(parents=True, exist_ok=True)

        results: List[PageLayoutInfo] = []
        doc = fitz.open(pdf_path)

        mat = fitz.Matrix(self.zoom, self.zoom)

        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_num = page_idx + 1

            # 1. 페이지를 이미지로 렌더링
            pix = page.get_pixmap(matrix=mat, alpha=False)
            image_path = output_dir / f"page_{page_num}.png"
            pix.save(str(image_path))

            # 2. 텍스트 블록 및 2D 바운딩 박스 추출
            raw_text = page.get_text("text")
            blocks_raw = page.get_text("blocks")
            text_blocks = []

            for b in blocks_raw:
                # b = (x0, y0, x1, y1, text, block_no, block_type)
                if len(b) >= 5 and b[4].strip():
                    text_blocks.append({
                        "bbox": [round(b[0], 1), round(b[1], 1), round(b[2], 1), round(b[3], 1)],
                        "text": b[4].strip(),
                    })

            results.append(
                PageLayoutInfo(
                    page_number=page_num,
                    image_path=image_path,
                    width=page.rect.width,
                    height=page.rect.height,
                    text_blocks=text_blocks,
                    raw_text=raw_text,
                )
            )

        doc.close()
        return results
