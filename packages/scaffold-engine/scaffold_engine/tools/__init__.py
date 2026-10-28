"""[scaffold_engine.tools] 엔진 공용 결정적 도구 모음 (Tools Package).

PDF 기하 실측, 고해상도 래스터라이징, 시각 오버레이 렌더링 등
모든 문서 파이프라인이 공유하는 저수준 PyMuPDF 네이티브 도구를 전담합니다.
"""
from .pdf_geometry import (
    Block,
    PageGeometry,
    PdfGeometryExtractor,
    TableGeometry,
)
from .pdf_rasterizer import (
    PageImageInfo,
    PdfRasterizer,
    PdfVisionRenderer,
    render_page_as_png,
)
from .visual_overlay import (
    VisualOverlayDrawer,
    render_scaffold_png,
    render_slot_overlay_png,
)

__all__ = [
    # 기하 실측
    "PdfGeometryExtractor",
    "PageGeometry",
    "TableGeometry",
    "Block",
    # 래스터라이저
    "PdfRasterizer",
    "PdfVisionRenderer",
    "PageImageInfo",
    "render_page_as_png",
    # 시각 오버레이
    "VisualOverlayDrawer",
    "render_scaffold_png",
    "render_slot_overlay_png",
]

