"""Vision package for scaffold-engine."""
from .pdf_renderer import (
    PdfVisionRenderer,
    PageLayoutInfo,
    render_page_as_png,
    render_slot_overlay_png,
)
from .scaffold_renderer import render_scaffold_png

__all__ = [
    "PdfVisionRenderer",
    "PageLayoutInfo",
    "render_page_as_png",
    "render_slot_overlay_png",
    "render_scaffold_png",
]
