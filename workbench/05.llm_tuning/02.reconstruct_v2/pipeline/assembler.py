"""
[02.reconstruct_v2] Tiptap 와이어프레임 & 마크다운 & 슬롯 정밀 조립기 (V2Assembler).
실측 기하(V2PageGeometry)와 비전 판정(PageVisionOutput)을 1:1 결합하여,
원본 PDF와 100% 동일한 셀 병합(rowspan, colspan), 행 높이, 열 너비 비율, 슬롯을 완벽히 조립합니다.
"""
from __future__ import annotations

import html as html_escape
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from pipeline.extractor import V2Block, V2Cell, V2PageGeometry, V2Table, norm_coord
from schemas.models import CellDecision, PageVisionOutput, SlotMappingItem


def _slot_span(slot_id: str, number: int, label: str, fill: bool = True) -> str:
    css = "scaffold-slot scaffold-slot-fill" if fill else "scaffold-slot"
    return (
        f'<span data-type="scaffold-slot" class="{css}" data-slot-id="{slot_id}" '
        f'data-mapping-num="{number}" '
        f'data-placeholder="{html_escape.escape(label or "입력")}"></span>'
    )


class V2Assembler:
    """v2 정밀 조립기."""

    def assemble_page(
        self,
        page_geom: V2PageGeometry,
        vision_output: PageVisionOutput,
        page_obj: Optional[fitz.Page] = None,
        start_counter: int = 0,
    ) -> Tuple[str, str, List[SlotMappingItem], int]:
        pw, ph = page_geom.width, page_geom.height
        counter = start_counter
        slots: List[SlotMappingItem] = []
        md_lines: List[str] = []

        # 결정 사항 맵 (id -> CellDecision)
        decision_map: Dict[str, CellDecision] = {d.id: d for d in vision_output.decisions}

        # 1. 페이지 루트 컨테이너
        page_style = (
            f"position:relative;width:{pw:.0f}px;height:{ph:.0f}px;"
            f"background:#ffffff;overflow:hidden;margin:0 auto;"
        )
        parts = [
            f'<div data-type="scaffold-page" data-w="{pw:.0f}" '
            f'data-h="{ph:.0f}" data-page="{page_geom.page}" class="scaffold-page" '
            f'style="{page_style}">'
        ]

        # 2. 표(Table) 렌더링 — 원자 그리드 & 정밀 병합(rowspan, colspan)
        for tab in page_geom.tables:
            tb = tab.bbox
            t_w = tb[2] - tb[0]
            t_h = tb[3] - tb[1]
            col_px = [round(t_w * pct / 100, 1) for pct in tab.col_pct]

            frame_style = (
                f"position:absolute;left:{tb[0]:.1f}px;top:{tb[1]:.1f}px;"
                f"width:{t_w:.1f}px;height:{t_h:.1f}px;box-sizing:border-box;"
            )
            table_style = (
                "width:100%;height:100%;border-collapse:collapse;table-layout:fixed;"
                "border:1.5px solid #334155;box-sizing:border-box;"
            )

            parts.append(
                f'<div data-type="scaffold-frame" data-x="{tb[0]:.1f}" data-y="{tb[1]:.1f}" '
                f'data-w="{t_w:.1f}" data-h="{t_h:.1f}" class="scaffold-frame" style="{frame_style}">'
                f'<table class="scaffold-table" style="{table_style}"><tbody>'
            )

            # 행별 셀 그룹화
            cells_by_row: Dict[int, List[V2Cell]] = {}
            for c in tab.cells:
                cells_by_row.setdefault(c.row, []).append(c)

            for ri in range(tab.rows):
                row_h = tab.row_h_pt[ri] if ri < len(tab.row_h_pt) else 24.0
                row_cells = sorted(cells_by_row.get(ri, []), key=lambda x: x.col)

                parts.append(f'<tr data-hpx="{row_h:.1f}" style="height:{row_h:.1f}px;">')

                for cell in row_cells:
                    ci = cell.col
                    colspan = cell.colspan
                    rowspan = cell.rowspan

                    # 병합된 원자 열들의 픽셀 합산
                    c_width = sum(col_px[c] for c in range(ci, min(ci + colspan, len(col_px))))
                    if c_width <= 0:
                        c_width = col_px[ci] if ci < len(col_px) else 50.0

                    # 비전 판정 확인
                    dec = decision_map.get(cell.id)
                    role = dec.role if dec else ("label" if ci == 0 else "value")
                    label_name = dec.slot_label if dec and dec.slot_label else cell.text[:15] or "입력"

                    if role in ("value", "mixed"):
                        counter += 1
                        slot_id = f"s{counter}"
                        fragment = _slot_span(slot_id, counter, label_name, fill=True)
                        slots.append(
                            SlotMappingItem(
                                id=slot_id,
                                number=counter,
                                label=label_name,
                                box_2d=cell.norm,
                                pageNumber=page_geom.page,
                            )
                        )
                        md_lines.append(f"[ {label_name} ]")
                        is_slot = True
                    else:
                        fragment = html_escape.escape(cell.text)
                        if cell.text:
                            md_lines.append(cell.text)
                        is_slot = False

                    # th vs td 분기
                    is_header = role in ("header", "label") and (ci == 0 or rowspan > 1 or len(cell.text) <= 8)
                    tag = "th" if is_header and not is_slot else "td"

                    cell_style_items = [
                        "border:1px solid #334155",
                        "vertical-align:middle",
                        "overflow:hidden",
                        "box-sizing:border-box",
                        f"width:{c_width:.1f}px",
                        f"font-size:{cell.size:.1f}px",
                    ]
                    if is_slot:
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
                        f'data-bid="{cell.id}" data-wpx="{c_width:.1f}" data-fs="{cell.size:.1f}"'
                        + (' data-fill="true"' if is_slot else "")
                        + span_str
                        + f' style="{cell_style}"'
                    )
                    parts.append(f'<{tag} {attrs}><p style="margin:0;line-height:1.2;">{fragment}</p></{tag}>')

                parts.append("</tr>")

            parts.append("</tbody></table></div>")

        # 3. 표 외곽 독립 텍스트/이미지 렌더링
        for blk in page_geom.blocks:
            bw = blk.bbox[2] - blk.bbox[0]
            bh = max(blk.bbox[3] - blk.bbox[1], 0.6)
            fs = blk.size or 10.0

            dec = decision_map.get(blk.id)
            role = dec.role if dec else ("title" if fs >= 14.0 else "label")
            if role == "ignore":
                continue

            if blk.kind == "image":
                counter += 1
                slot_id = f"s{counter}"
                img_label = dec.slot_label if dec and dec.slot_label else "회사 로고"
                fragment = _slot_span(slot_id, counter, img_label, fill=True)
                slots.append(
                    SlotMappingItem(
                        id=slot_id,
                        number=counter,
                        label=img_label,
                        box_2d=blk.norm,
                        pageNumber=page_geom.page,
                    )
                )
                md_lines.append(f"![{img_label}]([ {img_label} ])")
                style = (
                    f"position:absolute;left:{blk.bbox[0]:.1f}px;top:{blk.bbox[1]:.1f}px;"
                    f"width:{bw:.1f}px;height:{bh:.1f}px;box-sizing:border-box;"
                )
                parts.append(
                    f'<div data-type="scaffold-block" data-bid="{blk.id}" '
                    f'data-x="{blk.bbox[0]:.1f}" data-y="{blk.bbox[1]:.1f}" '
                    f'data-w="{bw:.1f}" data-h="{bh:.1f}" '
                    f'data-variant="image" class="scaffold-block scaffold-block-image" style="{style}">'
                    f'{fragment}</div>'
                )
                continue

            if role in ("value", "mixed"):
                counter += 1
                slot_id = f"s{counter}"
                s_label = dec.slot_label if dec and dec.slot_label else blk.text[:15] or "입력"
                fragment = _slot_span(slot_id, counter, s_label, fill=True)
                slots.append(
                    SlotMappingItem(
                        id=slot_id,
                        number=counter,
                        label=s_label,
                        box_2d=blk.norm,
                        pageNumber=page_geom.page,
                    )
                )
                md_lines.append(f"[ {s_label} ]")
            else:
                fragment = html_escape.escape(blk.text)
                if blk.text:
                    if role == "title":
                        md_lines.append(f"# {blk.text}")
                    else:
                        md_lines.append(blk.text)

            fw = "bold" if blk.bold or role == "title" else "normal"
            style = (
                f"position:absolute;left:{blk.bbox[0]:.1f}px;top:{blk.bbox[1]:.1f}px;"
                f"width:{bw:.1f}px;height:{bh:.1f}px;font-size:{fs:.1f}px;font-weight:{fw};"
                f"display:flex;align-items:center;line-height:1;overflow:hidden;box-sizing:border-box;"
            )
            parts.append(
                f'<div data-type="scaffold-block" data-bid="{blk.id}" '
                f'data-x="{blk.bbox[0]:.1f}" data-y="{blk.bbox[1]:.1f}" '
                f'data-w="{bw:.1f}" data-h="{bh:.1f}" data-fs="{fs:.1f}" '
                f'data-variant="text" class="scaffold-block" style="{style}">'
                f'{fragment}</div>'
            )

        parts.append("</div>")
        return "\n".join(parts), "\n\n".join(md_lines), slots, counter
