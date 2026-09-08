"""
[02.reconstruct] Stage C — Tiptap 와이어프레임 & 마크다운 & 슬롯 정밀 조립기 (HtmlAssembler).
실측 기하(PageGeometry)와 판정 결과(ClassificationResult)를 결합하여
@vibe/tiptap-scaffold 스키마 및 브라우저 독립 렌더링과 100% 호환되는
완벽한 인라인 스타일 및 스키마 속성을 조립합니다.
"""
from __future__ import annotations

import html as html_escape
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from schemas.geometry import Block, PageGeometry, TableGeometry, norm_coord
from schemas.models import SLOT_ROLES, SlotMappingItem

JUSTIFY_MAP = {
    "right": "flex-end",
    "center": "center",
    "left": "flex-start",
}


def _slot_span(slot_id: str, number: int, label: str, fill: bool) -> str:
    css = "scaffold-slot scaffold-slot-fill" if fill else "scaffold-slot"
    return (
        f'<span data-type="scaffold-slot" class="{css}" data-slot-id="{slot_id}" '
        f'data-mapping-num="{number}" '
        f'data-placeholder="{html_escape.escape(label or "입력")}"></span>'
    )


class HtmlAssembler:
    """Stage C 조립기."""

    def assemble(
        self,
        pdf_path: Optional[Path],
        page: PageGeometry,
        decisions: Dict[str, Any],
        start_counter: int = 0,
    ) -> Tuple[str, str, List[SlotMappingItem], int]:
        fitz_doc = None
        fitz_page = None
        if pdf_path and Path(pdf_path).exists():
            try:
                fitz_doc = fitz.open(pdf_path)
                if 0 <= page.page - 1 < len(fitz_doc):
                    fitz_page = fitz_doc[page.page - 1]
            except Exception:
                fitz_doc = None

        try:
            return self._build(fitz_page, page, decisions, start_counter)
        finally:
            if fitz_doc:
                fitz_doc.close()

    def _build(
        self,
        fitz_page,
        page: PageGeometry,
        decisions: Dict[str, Any],
        start_counter: int,
    ) -> Tuple[str, str, List[SlotMappingItem], int]:
        width, height = page.width, page.height
        decided = {d["id"]: d for d in decisions.get("blocks", [])}
        by_id = {b.id: b for b in page.blocks}
        slots: List[SlotMappingItem] = []
        md_lines: List[str] = []
        counter = start_counter

        def emit(block: Block) -> Tuple[str, bool]:
            nonlocal counter
            decision = decided.get(block.id, {})
            role = decision.get("role", "label")

            if role not in SLOT_ROLES:
                if block.text and block.text != "[IMAGE]":
                    md_lines.append(block.text)
                return html_escape.escape(block.text if block.text != "[IMAGE]" else ""), False

            counter += 1
            slot_id = f"s{counter}"
            label = decision.get("slot_label") or block.text[:20] or "입력"
            value_text = (decision.get("value_text") or "").strip()
            bbox = block.bbox
            is_partial = role == "mixed" and value_text and value_text != block.text

            if is_partial and fitz_page:
                narrowed = self._locate(fitz_page, block.bbox, value_text)
                if narrowed:
                    bbox = narrowed
                fragment = html_escape.escape(block.text).replace(
                    html_escape.escape(value_text),
                    _slot_span(slot_id, counter, label, fill=False),
                    1,
                )
                md_lines.append(block.text.replace(value_text, f"[ {label} ]", 1))
            else:
                fragment = _slot_span(slot_id, counter, label, fill=True)
                md_lines.append(f"[ {label} ]")

            slots.append(
                SlotMappingItem(
                    id=slot_id,
                    number=counter,
                    label=label,
                    box_2d=[
                        norm_coord(bbox[1], height),
                        norm_coord(bbox[0], width),
                        norm_coord(bbox[3], height),
                        norm_coord(bbox[2], width),
                    ],
                    pageNumber=page.page,
                )
            )
            return fragment, not is_partial

        # 1. 페이지 루트 컨테이너 (인라인 스타일 필수 부여)
        page_style = (
            f"position:relative;width:{width:.0f}px;height:{height:.0f}px;"
            f"background:#ffffff;overflow:hidden;margin:0 auto;"
        )
        parts = [
            f'<div data-type="scaffold-page" data-w="{width:.0f}" '
            f'data-h="{height:.0f}" data-page="{page.page}" class="scaffold-page" '
            f'style="{page_style}">'
        ]

        def place(block: Block, variant: str = "text") -> None:
            fragment = "" if variant == "rule" else emit(block)[0]
            bw = block.bbox[2] - block.bbox[0]
            bh = max(block.bbox[3] - block.bbox[1], 0.6)
            fs = block.size or 10.0
            justify = JUSTIFY_MAP.get(block.align, "flex-start")

            style_items = [
                "position:absolute",
                f"left:{block.bbox[0]:.1f}px",
                f"top:{block.bbox[1]:.1f}px",
                f"width:{bw:.1f}px",
                f"height:{bh:.1f}px",
                f"font-size:{fs:.1f}px",
                "line-height:1",
                "display:flex",
                "align-items:center",
                f"justify-content:{justify}",
                "white-space:nowrap",
                "overflow:hidden",
            ]
            if variant == "rule":
                style_items.append("background:#64748b")
                style_items.append("pointer-events:none")
            elif variant == "image":
                style_items.append("border:1px dashed #cbd5e1")
                style_items.append("background:#f8fafc")

            style_attr = ";".join(style_items)

            parts.append(
                f'<div data-type="scaffold-block" data-bid="{block.id}" '
                f'data-x="{block.bbox[0]:.1f}" data-y="{block.bbox[1]:.1f}" '
                f'data-w="{bw:.1f}" data-h="{bh:.1f}" '
                f'data-fs="{fs:.1f}" data-align="{block.align}" '
                f'data-variant="{variant}" class="scaffold-block scaffold-block-{variant}" '
                f'style="{style_attr}">{fragment}</div>'
            )

        # 2. 본문 블록 및 표 배치
        if page.doc_type == "grid" and page.tables:
            in_table = {b.id for b in page.blocks if b.kind == "cell"}
            for block in page.blocks:
                if block.kind == "rule":
                    place(block, "rule")
                elif block.id not in in_table:
                    place(block, "image" if block.kind == "image" else "text")
            for table in page.tables:
                parts.append(self._table(table, page.blocks, decided, emit))
        else:
            for block in page.blocks:
                if block.kind == "rule":
                    place(block, "rule")
                else:
                    place(block, "image" if block.kind == "image" else "text")

        parts.append("</div>")
        return "\n".join(parts), "\n\n".join(md_lines), slots, counter

    def _table(self, table: TableGeometry, blocks: List[Block], decided: Dict[str, Any], emit) -> str:
        tid = table.id[1:]
        tb = table.bbox
        table_w = tb[2] - tb[0]
        table_h = tb[3] - tb[1]
        col_px = [round(table_w * pct / 100, 1) for pct in table.col_pct]

        frame_style = (
            f"position:absolute;left:{tb[0]:.1f}px;top:{tb[1]:.1f}px;"
            f"width:{table_w:.1f}px;height:{table_h:.1f}px;box-sizing:border-box;"
        )
        table_style = (
            "width:100%;height:100%;border-collapse:collapse;table-layout:fixed;"
            "border:1.5px solid #334155;box-sizing:border-box;"
        )

        out = [
            f'<div data-type="scaffold-frame" data-x="{tb[0]:.1f}" data-y="{tb[1]:.1f}" '
            f'data-w="{table_w:.1f}" data-h="{table_h:.1f}" class="scaffold-frame" style="{frame_style}">'
            f'<table class="scaffold-table" style="{table_style}"><tbody>'
        ]

        # 이 표에 속한 셀 블록들 수집 및 행별 그룹화
        table_cells = [b for b in blocks if b.kind == "cell" and b.id.startswith(f"{tid}-")]
        cells_by_row: Dict[int, List[Block]] = {}
        for c in table_cells:
            r = c.row if c.row is not None else 0
            cells_by_row.setdefault(r, []).append(c)

        for ri in range(table.rows):
            row_h = table.row_h_pt[ri] if ri < len(table.row_h_pt) else 20.0
            row_cells = sorted(cells_by_row.get(ri, []), key=lambda b: b.col if b.col is not None else 0)

            out.append(f'<tr data-hpx="{row_h:.1f}" style="height:{row_h:.1f}px;">')
            if not row_cells:
                # 행 전체가 이전 행의 rowspan에 의해 커버된 경우 빈 행 유지
                pass

            for block in row_cells:
                fragment, filled = emit(block)
                role = decided.get(block.id, {}).get("role", "label")
                ci = block.col if block.col is not None else 0
                tag = "th" if role == "label" and ci == 0 else "td"

                colspan = max(1, getattr(block, "colspan", 1))
                rowspan = max(1, getattr(block, "rowspan", 1))

                # 셀의 실제 픽셀 너비 (포함하는 원자 열들의 너비 합산)
                c_width = sum(col_px[c] for c in range(ci, min(ci + colspan, len(col_px))))
                if c_width <= 0:
                    c_width = col_px[ci] if ci < len(col_px) else 50.0

                c_fs = block.size or 10.0

                cell_style_items = [
                    "border:1px solid #334155",
                    "vertical-align:middle",
                    "overflow:hidden",
                    f"width:{c_width:.1f}px",
                    f"font-size:{c_fs:.1f}px",
                    "box-sizing:border-box",
                ]
                if tag == "th":
                    cell_style_items.append("text-align:center")
                    cell_style_items.append("font-weight:600")
                    cell_style_items.append("background:#f8fafc")
                    cell_style_items.append("color:#1e293b")
                else:
                    cell_style_items.append("color:#334155")

                if filled:
                    cell_style_items.append("padding:0")
                else:
                    cell_style_items.append("padding:3px 6px")

                cell_style_attr = ";".join(cell_style_items)

                span_attrs = []
                if colspan > 1:
                    span_attrs.append(f'colspan="{colspan}"')
                if rowspan > 1:
                    span_attrs.append(f'rowspan="{rowspan}"')
                span_str = " " + " ".join(span_attrs) if span_attrs else ""

                attrs = (
                    f'data-bid="{block.id}" data-wpx="{c_width:.1f}" data-fs="{c_fs:.1f}"'
                    + (' data-fill="true"' if filled else "")
                    + span_str
                    + f' style="{cell_style_attr}"'
                )
                out.append(f"<{tag} {attrs}><p style=\"margin:0;line-height:1.2;\">{fragment}</p></{tag}>")
            out.append("</tr>")
        out.append("</tbody></table></div>")
        return "".join(out)

    @staticmethod
    def _locate(fitz_page, line_bbox: List[float], needle: str) -> Optional[List[float]]:
        """혼합 라인에서 실제 데이터 부분의 BBox 확정."""
        if not needle or not fitz_page:
            return None
        clip = fitz.Rect(line_bbox) + (-1, -1, 1, 1)
        try:
            hits = fitz_page.search_for(needle, clip=clip)
        except Exception:
            return None
        if not hits:
            return None
        rect = hits[0]
        for hit in hits[1:]:
            rect |= hit
        return [rect.x0, rect.y0, rect.x1, rect.y1]
