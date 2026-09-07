"""재구성본(scaffold.html) 렌더러.

조립 결과 HTML 을 그림으로 남긴다. 원본 PDF 렌더(original) · 슬롯 오버레이(overlay)와
나란히 두면 "원본 → 좌표 판정 → 재구성 결과" 세 장면을 한자리에서 비교할 수 있다.

브라우저를 쓰지 않는다. scaffold.html 의 블록은 이미 원본 실측 좌표(data-x/y/w/h,
단위 pt)를 들고 있으므로, 그 좌표대로 다시 그리면 된다. CSS 엔진을 흉내 내는 것이
아니라 엔진이 측정한 기하를 그대로 재생하는 것이라, 결과가 결정적이고 재현 가능하다.
"""
from __future__ import annotations

import logging
from html.parser import HTMLParser
from typing import Any, Dict, List, Optional, Tuple

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

# Tiptap 카드(scaffold.css)의 색을 따라간다. 눈으로 바로 대조하기 위해서다.
_INK = (0.118, 0.161, 0.231)          # slate-800 본문
_FRAME = (0.796, 0.835, 0.882)        # slate-300 표 테두리
_RULE = (0.667, 0.706, 0.776)         # slate-400 구분선
_SLOT_LINE = (0.576, 0.200, 0.918)    # purple-600 슬롯 밑줄
_SLOT_TEXT = (0.659, 0.333, 0.969)    # purple-500 플레이스홀더
_IMAGE_BOX = (0.900, 0.910, 0.925)    # 이미지 자리 표시

_MIN_SLOT_WIDTH = 24.0
_DASH = "[2 2] 0"


class _ScaffoldHtmlParser(HTMLParser):
    """scaffold.html 에서 페이지/프레임/블록/표 기하와 인라인 조각을 뽑아낸다."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.page: Dict[str, float] = {}
        self.frames: List[Dict[str, float]] = []
        self.blocks: List[Dict[str, Any]] = []
        self._block: Optional[Dict[str, Any]] = None
        self._depth = 0

        # 표(table) 내부 좌표 누적 추적
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

        # 표 행(tr): 행 높이 측정 및 x 커서 초기화
        if tag == "tr" and self._curr_frame is not None:
            self._curr_row_h = self._num(attrs, "data-hpx", 20.0)
            self._row_cursor_x = self._curr_frame["x"]
            return

        # 표 셀(th, td): 셀 박스 추가 및 텍스트/슬롯 블록 생성
        if tag in ("th", "td") and self._curr_frame is not None:
            col_w = self._num(attrs, "data-wpx", 50.0)
            fs = self._num(attrs, "data-fs", 10.0)
            cell_x = self._row_cursor_x
            cell_y = self._frame_cursor_y
            cell_h = self._curr_row_h

            # 셀 테두리 선 추가
            self.frames.append({
                "x": cell_x,
                "y": cell_y,
                "w": col_w,
                "h": cell_h,
            })

            # 셀 내부 내용물 블록
            self._block = {
                "x": cell_x + 3.0,
                "y": cell_y,
                "w": max(0.0, col_w - 6.0),
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
            # 프레임 div 종료
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


def _draw_slot(page: Any, x: float, y_base: float, width: float, size: float, label: str, font: Any) -> None:
    """슬롯 한 칸: 보라 점선 밑줄 + 가운데 흐린 플레이스홀더."""
    if width < 1:
        return
    shape = page.new_shape()
    shape.draw_line(fitz.Point(x, y_base + 1.5), fitz.Point(x + width, y_base + 1.5))
    shape.finish(color=_SLOT_LINE, width=0.7, dashes=_DASH)
    shape.commit()

    if not label:
        return
    label_size = max(5.0, size * 0.78)
    label_width = font.text_length(label, label_size)
    if label_width > width:  # 칸을 넘치면 표시하지 않는다. 겹쳐 찍는 것보다 낫다.
        return
    writer = fitz.TextWriter(page.rect)
    writer.append(fitz.Point(x + (width - label_width) / 2, y_base - 0.5), label,
                  font=font, fontsize=label_size)
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

    # 슬롯이 가져갈 폭 = 블록 폭에서 고정 텍스트를 뺀 나머지를 슬롯 수로 나눈다.
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


def render_scaffold_png(html_content: str, dpi: int = 150) -> Optional[bytes]:
    """조립된 scaffold.html 을 원본과 같은 지면 크기의 PNG 로 렌더링합니다.

    블록을 하나도 찾지 못하면 None 을 돌려줍니다(빈 그림을 남기지 않기 위해서).
    """
    parser = _ScaffoldHtmlParser()
    parser.feed(html_content)
    parser.close()

    if not parser.blocks:
        logger.warning("[scaffold_renderer] 렌더할 블록이 없습니다.")
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
