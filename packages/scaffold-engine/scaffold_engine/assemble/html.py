"""Stage C — 측정 기하 + 역할 판정 -> Tiptap HTML / Markdown / 슬롯 좌표.

페이지 캔버스를 PDF 포인트와 1:1 px 로 잡아 기하 드리프트를 원천 차단한다.
슬롯의 `box_2d` 는 모델이 아니라 실측 블록에서 나오므로 매핑이 어긋날 수 없다.
"""
from __future__ import annotations

import html as html_escape
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, TYPE_CHECKING

import fitz  # PyMuPDF

from scaffold_engine.classify.schema import SLOT_ROLES

if TYPE_CHECKING:  # pragma: no cover
    from scaffold_engine.extract.geometry import Block, PageGeometry

# 슬롯 하나가 차지할 최소 표시 폭(px). 너무 좁으면 플레이스홀더가 안 보인다.
MIN_SLOT_WIDTH_PX = 24


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
            """블록 하나를 HTML 조각으로. (조각, 슬롯이_박스를_채움) 반환."""
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
            f'<div class="scaffold-page" data-page="{page.page}" '
            f'style="position:relative;width:{width:.1f}px;height:{height:.1f}px;'
            f'background:#fff;overflow:hidden;">'
        ]

        def place(block: "Block") -> None:
            fragment, _ = emit(block)
            w = block.bbox[2] - block.bbox[0]
            h = block.bbox[3] - block.bbox[1]
            justify = {"right": "flex-end", "center": "center"}.get(block.align, "flex-start")
            parts.append(
                f'<div data-bid="{block.id}" style="position:absolute;'
                f'left:{block.bbox[0]:.1f}px;top:{block.bbox[1]:.1f}px;'
                f'width:{w:.1f}px;height:{h:.1f}px;font-size:{block.size or 10:.1f}px;'
                f'line-height:1;display:flex;align-items:center;justify-content:{justify};'
                f'white-space:nowrap;overflow:hidden;">{fragment}</div>'
            )

        if page.doc_type == "grid" and page.tables:
            in_table = {
                f"{t.id[1:]}-r{ri}c{ci}"
                for t in page.tables
                for ri in range(t.rows)
                for ci in range(t.cols)
            }
            for block in page.blocks:
                if block.kind in ("line", "image") and block.id not in in_table:
                    place(block)
            for table in page.tables:
                parts.append(self._table(table, by_id, decided, emit))
        else:
            for block in page.blocks:
                if block.kind == "rule":
                    parts.append(self._rule(block))
                else:
                    place(block)

        parts.append("</div>")
        return "\n".join(parts), "\n\n".join(md_lines), slots

    def _table(self, table, by_id, decided, emit) -> str:
        tid = table.id[1:]
        tb = table.bbox
        out = [
            f'<table class="scaffold-table" data-tid="{table.id}" style="position:absolute;'
            f'left:{tb[0]:.1f}px;top:{tb[1]:.1f}px;width:{tb[2] - tb[0]:.1f}px;'
            f'height:{tb[3] - tb[1]:.1f}px;border-collapse:collapse;table-layout:fixed;'
            f'border:1px solid #333;">',
            "<colgroup>"
            + "".join(f'<col style="width:{w:.2f}%;"/>' for w in table.col_pct)
            + "</colgroup><tbody>",
        ]
        for ri in range(table.rows):
            out.append(f'<tr style="height:{table.row_pct[ri]:.2f}%;">')
            for ci in range(table.cols):
                block = by_id.get(f"{tid}-r{ri}c{ci}")
                if block is None:
                    out.append("<td></td>")
                    continue
                fragment, filled = emit(block)
                role = decided.get(block.id, {}).get("role", "label")
                tag = "th" if role == "label" and ci == 0 else "td"
                style = (
                    f"padding:{'0' if filled else '2px 6px'};border:1px solid #333;"
                    f"vertical-align:middle;font-size:{block.size or 10:.1f}px;overflow:hidden;"
                )
                if tag == "th":
                    style += "text-align:center;font-weight:600;background:#f7f7f7;"
                out.append(f'<{tag} data-bid="{block.id}" style="{style}">{fragment}</{tag}>')
            out.append("</tr>")
        out.append("</tbody></table>")
        return "".join(out)

    @staticmethod
    def _rule(block: "Block") -> str:
        w = block.bbox[2] - block.bbox[0]
        h = max(block.bbox[3] - block.bbox[1], 0.6)
        return (
            f'<div style="position:absolute;left:{block.bbox[0]:.1f}px;'
            f'top:{block.bbox[1]:.1f}px;width:{w:.1f}px;height:{h:.1f}px;'
            f'background:#dcdcdc;"></div>'
        )

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
