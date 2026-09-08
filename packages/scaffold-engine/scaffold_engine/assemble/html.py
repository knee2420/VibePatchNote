"""Stage C — 측정 기하 + 역할 판정 -> Tiptap HTML / Markdown / 슬롯 좌표.

**출력 마크업은 `@vibe/tiptap-scaffold` 스키마와 1:1 로 대응해야 한다.**
Tiptap 은 스키마에 없는 태그·속성·인라인 스타일을 파싱 단계에서 버리므로,
기하 정보는 전부 스키마가 선언한 `data-*` 속성으로 실어 보낸다.
(래퍼 div 나 style="" 로 보내면 화면에서 흔적도 없이 사라진다.)

    scaffoldPage   <div data-type="scaffold-page" data-w data-h data-page>
    scaffoldBlock  <div data-type="scaffold-block" data-x data-y data-w data-h data-fs ...>
    scaffoldFrame  <div data-type="scaffold-frame" data-x data-y data-w data-h>  (표 위치 고정)
    tr             <tr data-hpx="행 높이 px">
    td/th          <td data-wpx="열 너비 px" data-fs="폰트 px" data-fill>
"""
from __future__ import annotations

import html as html_escape
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING

import fitz  # PyMuPDF

from scaffold_engine.classify.schema import SLOT_ROLES

if TYPE_CHECKING:  # pragma: no cover
    from scaffold_engine.extract.geometry import Block, PageGeometry, TableGeometry


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
    ) -> Tuple[str, str, List[Dict[str, Any]]]:
        """(html, markdown, slots) 을 돌려준다."""
        doc = fitz.open(pdf_path)
        try:
            return self._build(doc[page.page - 1], page, decisions)
        finally:
            doc.close()

    # --- 내부 ---

    def _build(self, fitz_page, page: "PageGeometry", decisions: Dict[str, Any]):
        width, height = page.width, page.height
        decided = {d["id"]: d for d in decisions.get("blocks", [])}
        by_id = {b.id: b for b in page.blocks}
        slots: List[Dict[str, Any]] = []
        md_lines: List[str] = []
        counter = 0

        def emit(block: "Block") -> Tuple[str, bool]:
            """블록 하나를 인라인 조각으로. (조각, 슬롯이_박스를_채움) 반환."""
            nonlocal counter
            decision = decided.get(block.id, {})
            role = decision.get("role", "label")

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

        parts = [
            f'<div data-type="scaffold-page" data-w="{width:.0f}" '
            f'data-h="{height:.0f}" data-page="{page.page}">'
        ]

        def place(block: "Block", variant: str = "text") -> None:
            fragment = "" if variant == "rule" else emit(block)[0]
            parts.append(
                f'<div data-type="scaffold-block" data-bid="{block.id}" '
                f'data-x="{block.bbox[0]:.1f}" data-y="{block.bbox[1]:.1f}" '
                f'data-w="{block.bbox[2] - block.bbox[0]:.1f}" '
                f'data-h="{max(block.bbox[3] - block.bbox[1], 0.6):.1f}" '
                f'data-fs="{block.size or 10:.1f}" data-align="{block.align}" '
                f'data-variant="{variant}">{fragment}</div>'
            )

        if page.doc_type == "grid" and page.tables:
            in_table = {
                f"{t.id[1:]}-r{ri}c{ci}"
                for t in page.tables
                for ri in range(t.rows)
                for ci in range(t.cols)
            }
            for block in page.blocks:
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
        tid = table.id[1:]
        tb = table.bbox
        table_w = tb[2] - tb[0]
        # 열 너비는 비율이 아니라 실측 px 로 준다 (페이지 캔버스가 pt 와 1:1 px 이므로 정확).
        col_px = [round(table_w * pct / 100, 1) for pct in table.col_pct]

        out = [
            f'<div data-type="scaffold-frame" data-x="{tb[0]:.1f}" data-y="{tb[1]:.1f}" '
            f'data-w="{table_w:.1f}" data-h="{tb[3] - tb[1]:.1f}"><table><tbody>'
        ]
        for ri in range(table.rows):
            out.append(f'<tr data-hpx="{table.row_h_pt[ri]:.1f}">')
            for ci in range(table.cols):
                block = by_id.get(f"{tid}-r{ri}c{ci}")
                if block is None:
                    out.append("<td></td>")
                    continue
                fragment, filled = emit(block)
                role = decided.get(block.id, {}).get("role", "label")
                tag = "th" if role == "label" and ci == 0 else "td"
                attrs = (
                    f'data-bid="{block.id}" data-wpx="{col_px[ci] if ci < len(col_px) else 0:.1f}" '
                    f'data-fs="{block.size or 10:.1f}"'
                    + (' data-fill="true"' if filled else "")
                )
                out.append(f"<{tag} {attrs}><p>{fragment}</p></{tag}>")
            out.append("</tr>")
        out.append("</tbody></table></div>")
        return "".join(out)

    @staticmethod
    def _locate(fitz_page, line_bbox: List[float], needle: str) -> Optional[List[float]]:
        """혼합 라인에서 데이터 부분만의 실제 bbox 를 검색으로 확정한다 (AI 아님)."""
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
