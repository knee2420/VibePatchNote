"""[scaffold_engine.tools] Tiptap 서식 레이아웃 시각화 및 오버레이 렌더러 (VisualOverlayDrawer).

조립된 Tiptap HTML(scaffold.html) 또는 실측 기하 좌표를 기반으로
원본 페이지 이미지 위에 2D 바운딩 박스/슬롯/텍스트를 결정적으로 합성 렌더링합니다.
브라우저/헤드리스 렌더러 없이 PyMuPDF 네이티브로 고속 동작합니다.
"""
from __future__ import annotations

import logging
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional, Tuple

try:
    import pymupdf as fitz
except ImportError:
    import fitz

logger = logging.getLogger(__name__)

_INK = (0.118, 0.161, 0.231)          # slate-800
_FRAME = (0.796, 0.835, 0.882)        # slate-300
_RULE = (0.667, 0.706, 0.776)         # slate-400
_SLOT_LINE = (0.576, 0.200, 0.918)    # purple-600
_SLOT_TEXT = (0.659, 0.333, 0.969)    # purple-500
_IMAGE_BOX = (0.900, 0.910, 0.925)    # gray

_MIN_SLOT_WIDTH = 24.0
_DASH = "[2 2] 0"


class _ScaffoldHtmlParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.page: Dict[str, float] = {}
        self.frames: List[Dict[str, float]] = []
        self.blocks: List[Dict[str, Any]] = []
        self._block: Optional[Dict[str, Any]] = None
        self._depth = 0

    @staticmethod
    def _num(attrs: Dict[str, str], key: str, default: float = 0.0) -> float:
        try:
            return float(attrs.get(key, default))
        except (TypeError, ValueError):
            return default

    def handle_starttag(self, tag: str, attrs_list: List[Tuple[str, Optional[str]]]) -> None:
        attrs = {k: (v or "") for k, v in attrs_list}
        kind = attrs.get("data-type")

        if kind == "scaffold-page":
            self.page = {
                "width": self._num(attrs, "data-page-width", 595.0),
                "height": self._num(attrs, "data-page-height", 842.0),
            }
        elif kind == "scaffold-frame":
            self.frames.append({
                "x": self._num(attrs, "data-x"),
                "y": self._num(attrs, "data-y"),
                "w": self._num(attrs, "data-w"),
                "h": self._num(attrs, "data-h"),
            })
        elif kind == "scaffold-block":
            self._block = {
                "id": attrs.get("data-block-id", ""),
                "variant": attrs.get("data-variant", "text"),
                "x": self._num(attrs, "data-x"),
                "y": self._num(attrs, "data-y"),
                "w": self._num(attrs, "data-w"),
                "h": self._num(attrs, "data-h"),
                "fs": self._num(attrs, "data-font-size", 10.0),
                "align": attrs.get("data-align", "left"),
                "parts": [],
            }
            self.blocks.append(self._block)
            self._depth = 0
        elif kind == "scaffold-slot" and self._block is not None:
            label = attrs.get("data-label", "") or "입력"
            self._block["parts"].append(("slot", label))
            self._depth += 1

    def handle_endtag(self, tag: str) -> None:
        if self._block is not None:
            if self._depth > 0:
                self._depth -= 1
            elif tag in ("div", "p"):
                self._block = None

    def handle_data(self, data: str) -> None:
        if self._block is None:
            return
        if self._depth > 0:
            return
        cleaned = " ".join(data.split())
        if cleaned:
            self._block["parts"].append(("text", cleaned))


def _draw_slot(page: Any, x: float, baseline: float, width: float, font_size: float, label: str, font: Any) -> None:
    y_line = baseline + 1.5
    shape = page.new_shape()
    shape.draw_line(fitz.Point(x, y_line), fitz.Point(x + width, y_line))
    shape.finish(color=_SLOT_LINE, width=1.0)
    shape.commit()

    label_size = max(5.0, font_size * 0.75)
    writer = fitz.TextWriter(page.rect)
    prompt = f"[{label}]"
    writer.append(fitz.Point(x + 2.0, baseline), prompt, font=font, fontsize=label_size)
    writer.write_text(page, color=_SLOT_TEXT)


def _draw_block(page: Any, block: Dict[str, Any], font: Any) -> None:
    x, y, w, h = block["x"], block["y"], block["w"], block["h"]
    variant = block["variant"]

    if variant == "rule":
        shape = page.new_shape()
        mid = y + h / 2
        shape.draw_line(fitz.Point(x, mid), fitz.Point(x + w, mid))
        shape.finish(color=_RULE, width=0.8)
        shape.commit()
        return

    if variant == "image":
        shape = page.new_shape()
        shape.draw_rect(fitz.Rect(x, y, x + w, y + h))
        shape.finish(color=_FRAME, fill=_IMAGE_BOX, width=0.6, dashes=_DASH)
        shape.commit()
        return

    parts = block["parts"]
    if not parts:
        return

    size = max(5.0, block["fs"])
    baseline = y + min(h - 2.0, size * 1.05) if h > size else y + size

    text_width = sum(font.text_length(v, size) for kind, v in parts if kind == "text")
    slot_count = sum(1 for kind, _ in parts if kind == "slot")
    slot_width = max(_MIN_SLOT_WIDTH, (w - text_width) / slot_count) if slot_count else 0.0

    total = text_width + slot_width * slot_count
    if block["align"] == "right":
        cursor = x + max(0.0, w - total)
    elif block["align"] == "center":
        cursor = x + max(0.0, (w - total) / 2)
    else:
        cursor = x

    writer = fitz.TextWriter(page.rect)
    has_text = False
    for kind, value in parts:
        if kind == "text":
            writer.append(fitz.Point(cursor, baseline), value, font=font, fontsize=size)
            cursor += font.text_length(value, size)
            has_text = True
        else:
            _draw_slot(page, cursor, baseline, slot_width, size, value, font)
            cursor += slot_width

    if has_text:
        writer.write_text(page, color=_INK)


class VisualOverlayDrawer:
    """Tiptap 서식 HTML 및 기하 메타를 독립 PNG 이미지로 재구성 렌더링하는 도구."""

    @staticmethod
    def render_scaffold_html_to_png(html_content: str, dpi: int = 150) -> Optional[bytes]:
        parser = _ScaffoldHtmlParser()
        parser.feed(html_content)
        parser.close()

        if not parser.blocks:
            logger.warning("[VisualOverlayDrawer] 렌더할 블록이 없습니다.")
            return None

        width = parser.page.get("width") or 595.0
        height = parser.page.get("height") or 842.0

        doc = fitz.open()
        try:
            page = doc.new_page(width=width, height=height)
            font = fitz.Font("cjk")

            for frame in parser.frames:
                shape = page.new_shape()
                shape.draw_rect(fitz.Rect(frame["x"], frame["y"],
                                          frame["x"] + frame["w"], frame["y"] + frame["h"]))
                shape.finish(color=_FRAME, width=0.8)
                shape.commit()

            for block in parser.blocks:
                _draw_block(page, block, font)

            return page.get_pixmap(dpi=dpi).tobytes("png")
        finally:
            doc.close()


def _extract_slot_meta(slot: Any, default_number: int) -> Optional[Tuple[List[int], int, int]]:
    """슬롯 객체(Pydantic or dict)에서 (box_2d, number, page_number) 안전 추출."""
    if hasattr(slot, "box_2d"):
        box = slot.box_2d
        num = getattr(slot, "number", default_number)
        page = getattr(slot, "page_number", 1)
    elif isinstance(slot, dict):
        box = slot.get("box_2d", [])
        num = slot.get("number", default_number)
        page = slot.get("pageNumber", slot.get("page_number", 1))
    else:
        return None

    if len(box) != 4:
        return None
    return box, num, page


def _draw_slot_box_and_badge(page: Any, rect: fitz.Rect, num: int) -> None:
    """PDF 페이지 위에 슬롯 하이라이트 박스와 번호 배지를 렌더링합니다."""
    # 1. 보라색 반투명 박스 (#9333ea)
    page.draw_rect(
        rect,
        color=(0.576, 0.2, 0.918),
        fill=(0.933, 0.867, 0.988),
        width=1.5,
        fill_opacity=0.35,
    )

    # 2. 좌측 상단 번호 배지
    badge_w = min(26.0, max(14.0, rect.width * 0.4))
    badge_h = min(11.0, max(8.0, rect.height * 0.5))
    badge_y0 = max(0.0, rect.y0 - badge_h) if rect.y0 >= badge_h else rect.y0
    badge_rect = fitz.Rect(rect.x0, badge_y0, rect.x0 + badge_w, badge_y0 + badge_h)

    page.draw_rect(
        badge_rect,
        color=(0.576, 0.2, 0.918),
        fill=(0.576, 0.2, 0.918),
        fill_opacity=0.9,
    )
    page.insert_textbox(
        badge_rect,
        f"s{num}",
        fontsize=6.5,
        color=(1.0, 1.0, 1.0),
        align=1,  # 가운데 정렬
    )


def render_slot_overlay_png(
    pdf_path: Any,
    slots: List[Any],
    page_number: int = 1,
    dpi: int = 150,
) -> bytes:
    """
    원본 PDF 페이지 위에 추출된 슬롯들의 위치를 보라색 반투명 박스와 번호 태그로 오버레이 렌더링합니다.
    (0~1000 정규화 좌표 [ymin, xmin, ymax, xmax] -> 이미지 픽셀 좌표 매핑)
    """
    doc = fitz.open(str(pdf_path))
    try:
        idx = min(max(page_number, 1), len(doc)) - 1
        page = doc[idx]
        try:
            page.clean_contents()
        except Exception:
            pass
        pw, ph = page.rect.width, page.rect.height

        for i, s in enumerate(slots):
            meta = _extract_slot_meta(s, default_number=i + 1)
            if not meta:
                continue

            box, num, p_num = meta
            if p_num != page_number:
                continue

            ymin, xmin, ymax, xmax = box
            x0, y0 = (xmin / 1000.0) * pw, (ymin / 1000.0) * ph
            x1, y1 = (xmax / 1000.0) * pw, (ymax / 1000.0) * ph

            if x1 <= x0 or y1 <= y0:
                continue

            _draw_slot_box_and_badge(page, fitz.Rect(x0, y0, x1, y1), num)

        pix = page.get_pixmap(dpi=dpi)
        return pix.tobytes("png")
    finally:
        doc.close()


render_scaffold_png = VisualOverlayDrawer.render_scaffold_html_to_png

__all__ = [
    "VisualOverlayDrawer",
    "render_scaffold_png",
    "render_slot_overlay_png",
]
