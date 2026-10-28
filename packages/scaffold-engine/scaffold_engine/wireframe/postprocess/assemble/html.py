"""Stage C — 측정 기하 + 역할 판정 -> Tiptap HTML / Markdown / 슬롯 좌표 (Wireframe 트랙).

출력 마크업은 `@vibe/tiptap-scaffold` 스키마와 1:1 로 대응해야 한다.
"""
from __future__ import annotations

import html as html_escape
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING

import fitz  # PyMuPDF

from scaffold_engine.wireframe.inference.classify.schema import SLOT_ROLES

if TYPE_CHECKING:  # pragma: no cover
    from scaffold_engine.tools import Block, PageGeometry, TableGeometry


def _slot_span(slot_id: str, number: int, label: str, fill: bool) -> str:
    css = "scaffold-slot scaffold-slot-fill" if fill else "scaffold-slot"
    return (
        f'<span data-type="scaffold-slot" class="{css}" data-slot-id="{slot_id}" '
        f'data-mapping-num="{number}" '
        f'data-placeholder="{html_escape.escape(label or "입력")}"></span>'
    )


class HtmlAssembler:
    """`core.interfaces.Assembler` 구현체."""

    def assemble(
        self,
        pdf_path: Path,
        page: "PageGeometry",
        decisions: Dict[str, Any],
        start_slot_number: int = 1,
    ) -> Tuple[str, str, List[Dict[str, Any]]]:
        """(html, markdown, slots) 을 돌려준다."""
        doc = fitz.open(pdf_path)
        try:
            return self._build(doc[page.page - 1], page, decisions, start_counter=max(0, start_slot_number - 1))
        finally:
            doc.close()

    # --- 내부 ---

    def _build(
        self,
        fitz_page,
        page: "PageGeometry",
        decisions: Dict[str, Any],
        start_counter: int = 0,
    ):
        width, height = page.width, page.height
        decided = {d["id"]: d for d in decisions.get("blocks", [])}
        by_id = {b.id: b for b in page.blocks}
        slots: List[Dict[str, Any]] = []
        md_lines: List[str] = []
        counter = start_counter

        def emit(block: "Block") -> Tuple[str, bool]:
            """블록 하나를 인라인 조각으로. (조각, 슬롯이_박스를_채움) 반환."""
            nonlocal counter
            decision = decided.get(block.id, {})
            role = decision.get("role", "label")

            if role == "ignore":
                return "", False

            if role not in SLOT_ROLES:
                if block.text:
                    md_lines.append(block.text)
                return html_escape.escape(block.text), False

            counter += 1
            slot_id = f"s{counter}"
            label = decision.get("slot_label") or block.text[:20] or "입력"
            value_text = (decision.get("value_text") or "").strip()
            bbox = block.bbox
            is_partial = role == "mixed" and value_text and value_text != block.text

            if is_partial:
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

            slots.append({
                "id": slot_id,
                "number": counter,
                "label": label,
                "box_2d": [
                    round(bbox[1] / height * 1000), round(bbox[0] / width * 1000),
                    round(bbox[3] / height * 1000), round(bbox[2] / width * 1000),
                ],
                "pageNumber": page.page,
            })
            return fragment, not is_partial

        page_style = (
            f"position:relative;width:{width:.0f}px;height:{height:.0f}px;"
            f"background:#ffffff;overflow:hidden;margin:0 auto;"
        )
        parts = [
            f'<div data-type="scaffold-page" data-w="{width:.0f}" '
            f'data-h="{height:.0f}" data-page="{page.page}" class="scaffold-page" '
            f'style="{page_style}">'
        ]

        def place(block: "Block", variant: str = "text") -> None:
            decision = decided.get(block.id, {})
            if decision.get("role") == "ignore":
                return
            fragment = "" if variant == "rule" else emit(block)[0]
            bw = block.bbox[2] - block.bbox[0]
            bh = max(block.bbox[3] - block.bbox[1], 0.6)
            fs = block.size or 10.0
            fw = "bold" if block.bold or decision.get("role") == "title" else "normal"
            style = (
                f"position:absolute;left:{block.bbox[0]:.1f}px;top:{block.bbox[1]:.1f}px;"
                f"width:{bw:.1f}px;height:{bh:.1f}px;font-size:{fs:.1f}px;font-weight:{fw};"
                f"display:flex;align-items:center;line-height:1;overflow:hidden;box-sizing:border-box;"
            )
            parts.append(
                f'<div data-type="scaffold-block" data-bid="{block.id}" '
                f'data-x="{block.bbox[0]:.1f}" data-y="{block.bbox[1]:.1f}" '
                f'data-w="{bw:.1f}" data-h="{bh:.1f}" '
                f'data-fs="{fs:.1f}" data-align="{block.align}" '
                f'data-variant="{variant}" class="scaffold-block" style="{style}">{fragment}</div>'
            )

        if page.doc_type == "grid" and page.tables:
            in_table = {
                b.id
                for t in page.tables
                for b in (getattr(t, "cells", []) or [])
            }
            if not in_table:
                in_table = {
                    f"{t.id}-r{ri}c{ci}"
                    for t in page.tables
                    for ri in range(t.rows)
                    for ci in range(t.cols)
                }
            for block in page.blocks:
                if block.kind == "cell":
                    continue
                if block.kind == "rule":
                    place(block, "rule")
                elif block.id not in in_table:
                    place(block, "image" if block.kind == "image" else "text")
            for table in page.tables:
                parts.append(self._table(table, by_id, decided, emit))
        else:
            for block in page.blocks:
                if block.kind == "rule":
                    place(block, "rule")
                else:
                    place(block, "image" if block.kind == "image" else "text")

        parts.append("</div>")
        return "\n".join(parts), "\n\n".join(md_lines), slots

    def _table(self, table: "TableGeometry", by_id, decided, emit) -> str:
        tid = table.id
        tb = table.bbox
        table_w = tb[2] - tb[0]
        table_h = tb[3] - tb[1]
        # 열 너비는 비율이 아니라 실측 px 로 준다
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
            f'data-w="{table_w:.1f}" data-h="{table_h:.1f}" class="scaffold-frame" '
            f'style="{frame_style}"><table class="scaffold-table" style="{table_style}"><tbody>'
        ]

        # 행별 셀 그룹화
        cells = getattr(table, "cells", [])
        if not cells:
            cells = [b for b in by_id.values() if getattr(b, "kind", "") == "cell" and getattr(b, "id", "").startswith(f"{tid}-")]

        cells_by_row: Dict[int, List[Any]] = {}
        for c in cells:
            row_idx = getattr(c, "row", 0) if getattr(c, "row", None) is not None else 0
            cells_by_row.setdefault(row_idx, []).append(c)

        for ri in range(table.rows):
            row_h = table.row_h_pt[ri] if ri < len(table.row_h_pt) else 24.0
            row_cells = sorted(cells_by_row.get(ri, []), key=lambda x: getattr(x, "col", 0) or 0)

            out.append(f'<tr data-hpx="{row_h:.1f}" style="height:{row_h:.1f}px;">')

            for cell in row_cells:
                ci = getattr(cell, "col", 0) or 0
                colspan = getattr(cell, "colspan", 1) or 1
                rowspan = getattr(cell, "rowspan", 1) or 1

                # 병합된 원자 열들의 픽셀 합산
                c_width = sum(col_px[c] for c in range(ci, min(ci + colspan, len(col_px))))
                if c_width <= 0:
                    c_width = col_px[ci] if ci < len(col_px) else 50.0

                fragment, filled = emit(cell)
                decision = decided.get(cell.id, {})
                role = decision.get("role", "label")

                # 헤더 여부 판정
                is_header = role in ("header", "label") and (ci == 0 or rowspan > 1 or len(getattr(cell, "text", "")) <= 8)
                tag = "th" if is_header and not filled else "td"

                cell_style_items = [
                    "border:1px solid #334155",
                    "vertical-align:middle",
                    "overflow:hidden",
                    "box-sizing:border-box",
                    f"width:{c_width:.1f}px",
                    f"font-size:{getattr(cell, 'size', 10.0) or 10.0:.1f}px",
                ]
                if filled:
                    cell_style_items.append("padding:0")
                elif tag == "th":
                    cell_style_items.append("padding:2px 4px")
                    cell_style_items.append("background:#f8fafc")
                    cell_style_items.append("font-weight:600")
                    cell_style_items.append("text-align:center")
                    cell_style_items.append("color:#1e293b")
                else:
                    cell_style_items.append("padding:3px 6px")
                    cell_style_items.append("color:#334155")

                cell_style = ";".join(cell_style_items)

                span_attrs = []
                if colspan > 1:
                    span_attrs.append(f'colspan="{colspan}"')
                if rowspan > 1:
                    span_attrs.append(f'rowspan="{rowspan}"')
                span_str = " " + " ".join(span_attrs) if span_attrs else ""

                attrs = (
                    f'data-bid="{cell.id}" data-wpx="{c_width:.1f}" data-fs="{getattr(cell, "size", 10.0) or 10.0:.1f}"'
                    + (' data-fill="true"' if filled else "")
                    + span_str
                    + f' style="{cell_style}"'
                )
                out.append(f'<{tag} {attrs}><p style="margin:0;line-height:1.2;">{fragment}</p></{tag}>')

            out.append("</tr>")
        out.append("</tbody></table></div>")
        return "".join(out)

    @staticmethod
    def _locate(fitz_page, line_bbox: List[float], needle: str) -> Optional[List[float]]:
        """혼합 라인에서 데이터 부분만의 실제 bbox 를 검색으로 확정한다."""
        if not needle:
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
