"""
[02.reconstruct] Stage D / Vision — scaffold.html 초정밀 래스터 렌더러 (ScaffoldRenderer).
조립 결과 HTML 을 원본과 동일한 크기의 고해상도 PNG 로 렌더링합니다.
브라우저 없이도 기하 실측값(pt)과 테두리, 보라색 점선 슬롯을 100% 결정적으로 렌더링합니다.
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

# Tiptap scaffold.css 컬러 팔레트와 100% 일치
_INK = (0.118, 0.161, 0.231)          # slate-800 본문
_FRAME = (0.200, 0.255, 0.333)        # slate-700 표 테두리 실선
_RULE = (0.392, 0.455, 0.545)         # slate-500 구분선
_SLOT_LINE = (0.659, 0.333, 0.969)    # purple-500 슬롯 보라 점선 테두리
_SLOT_TEXT = (0.494, 0.133, 0.808)    # purple-700 플레이스홀더 텍스트
_SLOT_BG = (0.980, 0.961, 1.000)      # purple-50 슬롯 연보라 배경
_IMAGE_BOX = (0.941, 0.957, 0.973)    # slate-100 이미지 자리 표시
_HEADER_BG = (0.973, 0.980, 0.988)    # th 회색 배경

_MIN_SLOT_WIDTH = 24.0
_DASH = "[2 2] 0"


class _ScaffoldHtmlParser(HTMLParser):
    """scaffold.html 에서 페이지/프레임/블록/표 기하와 인라인 조각을 정밀 추출."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.page: Dict[str, float] = {}
        self.frames: List[Dict[str, float]] = []
        self.cells: List[Dict[str, Any]] = []
        self.blocks: List[Dict[str, Any]] = []
        self._block: Optional[Dict[str, Any]] = None
        self._depth = 0

        self._curr_frame: Optional[Dict[str, float]] = None
        self._frame_cursor_y: float = 0.0
        self._row_cursor_x: float = 0.0
        self._curr_row_h: float = 20.0

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
                "width": self._num(attrs, "data-w", 595.0),
                "height": self._num(attrs, "data-h", 842.0),
                "page": self._num(attrs, "data-page", 1.0),
            }
            return

        if kind == "scaffold-frame":
            frame_info = {
                "x": self._num(attrs, "data-x"),
                "y": self._num(attrs, "data-y"),
                "w": self._num(attrs, "data-w"),
                "h": self._num(attrs, "data-h"),
            }
            self.frames.append(frame_info)
            self._curr_frame = frame_info
            self._frame_cursor_y = frame_info["y"]
            return

        if tag == "tr" and self._curr_frame is not None:
            self._curr_row_h = self._num(attrs, "data-hpx", 20.0)
            self._row_cursor_x = self._curr_frame["x"]
            return

        if tag in ("th", "td") and self._curr_frame is not None:
            col_w = self._num(attrs, "data-wpx", 50.0)
            fs = self._num(attrs, "data-fs", 10.0)
            cell_x = self._row_cursor_x
            cell_y = self._frame_cursor_y
            cell_h = self._curr_row_h

            self.cells.append({
                "x": cell_x,
                "y": cell_y,
                "w": col_w,
                "h": cell_h,
                "is_header": tag == "th",
            })

            self._block = {
                "x": cell_x + 4.0,
                "y": cell_y,
                "w": max(0.0, col_w - 8.0),
                "h": cell_h,
                "fs": fs,
                "align": "center" if tag == "th" else "left",
                "variant": "text",
                "parts": [],
            }
            self._depth = 1
            self._row_cursor_x += col_w
            return

        if kind == "scaffold-block":
            self._block = {
                "x": self._num(attrs, "data-x"),
                "y": self._num(attrs, "data-y"),
                "w": self._num(attrs, "data-w"),
                "h": self._num(attrs, "data-h"),
                "fs": self._num(attrs, "data-fs", 10.0),
                "align": attrs.get("data-align", "left"),
                "variant": attrs.get("data-variant", "text"),
                "parts": [],
            }
            self._depth = 1
            return

        if self._block is not None:
            self._depth += 1
            if kind == "scaffold-slot":
                self._block["parts"].append(("slot", attrs.get("data-placeholder", "")))

    def handle_endtag(self, tag: str) -> None:
        if tag == "tr" and self._curr_frame is not None:
            self._frame_cursor_y += self._curr_row_h
            return

        if tag == "div" and self._curr_frame is not None and self._block is None:
            self._curr_frame = None
            return

        if self._block is None:
            return
        self._depth -= 1
        if self._depth <= 0:
            self.blocks.append(self._block)
            self._block = None

    def handle_data(self, data: str) -> None:
        if self._block is None:
            return
        text = data.strip()
        if text:
            self._block["parts"].append(("text", text))


def _draw_slot(page: Any, x: float, y_base: float, width: float, height: float, label: str, font: Any) -> None:
    """슬롯: 연보라 박스 + 보라 점선 테두리 + 중앙 플레이스홀더."""
    if width < 1:
        return

    # 배경 사각형 채우기 및 점선 테두리
    slot_rect = fitz.Rect(x, y_base - height + 2, x + width, y_base + 2)
    shape = page.new_shape()
    shape.draw_rect(slot_rect)
    shape.finish(color=_SLOT_LINE, fill=_SLOT_BG, width=0.8, dashes=_DASH)
    shape.commit()

    if not label:
        return
    label_size = max(6.0, min(9.0, height * 0.65))
    label_width = font.text_length(label, label_size)
    if label_width > width - 4:
        return
    writer = fitz.TextWriter(page.rect)
    writer.append(
        fitz.Point(x + (width - label_width) / 2, y_base - 1.5),
        label,
        font=font,
        fontsize=label_size,
    )
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
        shape.finish(color=_RULE, fill=_IMAGE_BOX, width=0.8, dashes=_DASH)
        shape.commit()
        return

    parts = block["parts"]
    if not parts:
        return

    size = max(7.0, block["fs"])
    baseline = y + min(h - 3.0, size * 1.05) if h > size else y + size

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
            _draw_slot(page, cursor, baseline, slot_width, h, value, font)
            cursor += slot_width

    if has_text:
        writer.write_text(page, color=_INK)


def render_scaffold_png(html_content: str, dpi: int = 150) -> Optional[bytes]:
    """조립된 scaffold.html 을 원본과 동일한 고해상도 PNG 로 렌더링."""
    parser = _ScaffoldHtmlParser()
    parser.feed(html_content)
    parser.close()

    if not parser.blocks and not parser.frames:
        logger.warning("[scaffold_renderer] 렌더할 블록이 없습니다.")
        return None

    width = parser.page.get("width") or 595.0
    height = parser.page.get("height") or 842.0

    doc = fitz.open()
    try:
        page = doc.new_page(width=width, height=height)
        font = fitz.Font("cjk")

        # 1. 셀 배경 및 테두리 선 렌더링
        for cell in parser.cells:
            shape = page.new_shape()
            rect = fitz.Rect(cell["x"], cell["y"], cell["x"] + cell["w"], cell["y"] + cell["h"])
            fill_color = _HEADER_BG if cell["is_header"] else None
            shape.draw_rect(rect)
            shape.finish(color=_FRAME, fill=fill_color, width=1.0)
            shape.commit()

        # 2. 블록 및 슬롯 렌더링
        for block in parser.blocks:
            _draw_block(page, block, font)

        return page.get_pixmap(dpi=dpi).tobytes("png")
    finally:
        doc.close()
