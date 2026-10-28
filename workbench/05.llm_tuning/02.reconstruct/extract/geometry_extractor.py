"""
[02.reconstruct] Stage A — 결정적 기하 측정기 (GeometryExtractor).
PDF 에서 표 구조, 셀 경계, 행 높이, 열 너비, 텍스트 라인, 이미지, 구분선을
PyMuPDF 로 100% 결정적으로 실측합니다 (LLM 미호출).
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import List, Union

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from schemas.geometry import Block, PageGeometry, TableGeometry, norm_coord

logger = logging.getLogger(__name__)

MIN_RULE_WIDTH_PT = 20.0
MAX_RULE_HEIGHT_PT = 6.0


def _align_of(bbox: List[float], left: float, right: float) -> str:
    center = (left + right) / 2
    cx = (bbox[0] + bbox[2]) / 2
    if abs(bbox[2] - right) < 6 and abs(bbox[0] - left) > 40:
        return "right"
    if abs(cx - center) < 12 and abs(bbox[0] - left) > 25:
        return "center"
    return "left"


def _cluster_coords(coords: List[float], tol: float = 4.0) -> List[float]:
    if not coords:
        return []
    sorted_coords = sorted(coords)
    clusters = [[sorted_coords[0]]]
    for c in sorted_coords[1:]:
        if abs(c - clusters[-1][-1]) <= tol:
            clusters[-1].append(c)
        else:
            clusters.append([c])
    return [round(sum(cl) / len(cl), 1) for cl in clusters]


def _find_nearest_idx(val: float, grid: List[float]) -> int:
    return min(range(len(grid)), key=lambda i: abs(grid[i] - val))


class PdfGeometryExtractor:
    """PDF 기하 실측 추출기."""

    def extract(self, path: Union[str, Path]) -> List[PageGeometry]:
        pdf_file = Path(path).resolve()
        if not pdf_file.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_file}")

        doc = fitz.open(pdf_file)
        try:
            return [self._extract_page(page, i + 1) for i, page in enumerate(doc)]
        finally:
            doc.close()

    def _extract_page(self, page, pno: int) -> PageGeometry:
        width, height = float(page.rect.width), float(page.rect.height)
        geom = PageGeometry(page=pno, width=width, height=height)

        raw_blocks = page.get_text("dict")["blocks"]
        text_blocks = [b for b in raw_blocks if b.get("type") == 0]

        xs0 = [b["bbox"][0] for b in text_blocks]
        xs1 = [b["bbox"][2] for b in text_blocks]
        left = min(xs0) if xs0 else 0.0
        right = max(xs1) if xs1 else width

        spans = [s for b in text_blocks for line in b["lines"] for s in line["spans"]]

        try:
            tables = page.find_tables().tables
        except Exception as exc:
            logger.warning("[geometry] find_tables 실패 (p%d): %s", pno, exc)
            tables = []

        covered: List[List[float]] = []
        for ti, table in enumerate(tables):
            tb = list(table.bbox)
            t_height = (tb[3] - tb[1]) or 1.0
            t_width = (tb[2] - tb[0]) or 1.0

            # 1. 모든 유효 셀 수집
            raw_cells: List[List[float]] = []
            for row in table.rows:
                for c in row.cells:
                    if c is not None:
                        raw_cells.append(list(c))

            if not raw_cells:
                continue

            # 2. 원자 그리드(Atomic Grid) 경계 클러스터링
            all_xs = [c[0] for c in raw_cells] + [c[2] for c in raw_cells]
            all_ys = [c[1] for c in raw_cells] + [c[3] for c in raw_cells]
            x_grid = _cluster_coords(all_xs, tol=4.0)
            y_grid = _cluster_coords(all_ys, tol=4.0)

            if len(x_grid) < 2 or len(y_grid) < 2:
                continue

            col_w = [round(x_grid[i + 1] - x_grid[i], 1) for i in range(len(x_grid) - 1)]
            row_h = [round(y_grid[i + 1] - y_grid[i], 1) for i in range(len(y_grid) - 1)]
            sum_w = sum(col_w) or 1.0
            sum_h = sum(row_h) or 1.0

            geom.tables.append(
                TableGeometry(
                    id=f"t{ti}",
                    page=pno,
                    bbox=[round(v, 1) for v in tb],
                    norm=[
                        norm_coord(tb[1], height),
                        norm_coord(tb[0], width),
                        norm_coord(tb[3], height),
                        norm_coord(tb[2], width),
                    ],
                    rows=len(row_h),
                    cols=len(col_w),
                    col_pct=[round(w / sum_w * 100, 2) for w in col_w],
                    row_pct=[round(h / sum_h * 100, 2) for h in row_h],
                    row_h_pt=row_h,
                )
            )
            covered.append(tb)

            # 3. 셀을 원자 그리드에 투영하여 colspan, rowspan 정밀 산출
            seen_cells = set()
            for cell in raw_cells:
                c_start = _find_nearest_idx(cell[0], x_grid)
                c_end = _find_nearest_idx(cell[2], x_grid)
                r_start = _find_nearest_idx(cell[1], y_grid)
                r_end = _find_nearest_idx(cell[3], y_grid)

                colspan = max(1, c_end - c_start)
                rowspan = max(1, r_end - r_start)

                cell_key = (r_start, c_start)
                if cell_key in seen_cells:
                    continue
                seen_cells.add(cell_key)

                cell_sizes = [
                    s["size"] for s in spans
                    if cell[0] - 1 <= s["bbox"][0] and s["bbox"][2] <= cell[2] + 1
                    and cell[1] - 1 <= s["bbox"][1] and s["bbox"][3] <= cell[3] + 1
                ]
                geom.blocks.append(
                    Block(
                        id=f"{ti}-r{r_start}c{c_start}",
                        kind="cell",
                        page=pno,
                        bbox=[round(v, 1) for v in cell],
                        norm=[
                            norm_coord(cell[1], height),
                            norm_coord(cell[0], width),
                            norm_coord(cell[3], height),
                            norm_coord(cell[2], width),
                        ],
                        text=" ".join(page.get_textbox(fitz.Rect(cell)).split()),
                        size=round(max(cell_sizes), 1) if cell_sizes else 0.0,
                        row=r_start,
                        col=c_start,
                        rowspan=rowspan,
                        colspan=colspan,
                    )
                )

        def inside_table(bb) -> bool:
            cx = (bb[0] + bb[2]) / 2
            cy = (bb[1] + bb[3]) / 2
            return any(
                t[0] - 5 <= cx <= t[2] + 5 and t[1] - 5 <= cy <= t[3] + 5
                for t in covered
            )

        seq = 0
        for b in sorted(raw_blocks, key=lambda blk: (blk["bbox"][1], blk["bbox"][0])):
            bb = b["bbox"]
            # 표 영역 내부의 블록(텍스트/이미지)은 표 셀로 흡수되므로 독립 블록 생성에서 완전 배제 (고스트 오버레이 차단)
            if inside_table(bb):
                continue

            if b.get("type") == 1:
                geom.blocks.append(
                    Block(
                        id=f"img{seq}",
                        kind="image",
                        page=pno,
                        bbox=[round(v, 1) for v in bb],
                        norm=[
                            norm_coord(bb[1], height),
                            norm_coord(bb[0], width),
                            norm_coord(bb[3], height),
                            norm_coord(bb[2], width),
                        ],
                        text="[IMAGE]",
                    )
                )
                seq += 1
                continue

            for line in b["lines"]:
                lb = line["bbox"]
                if inside_table(lb):
                    continue
                text = "".join(s["text"] for s in line["spans"]).strip()
                if not text:
                    continue
                s0 = line["spans"][0]
                geom.blocks.append(
                    Block(
                        id=f"L{seq}",
                        kind="line",
                        page=pno,
                        bbox=[round(v, 1) for v in lb],
                        norm=[
                            norm_coord(lb[1], height),
                            norm_coord(lb[0], width),
                            norm_coord(lb[3], height),
                            norm_coord(lb[2], width),
                        ],
                        text=text,
                        size=round(s0["size"], 1),
                        bold="bold" in s0["font"].lower(),
                        align=_align_of(lb, left, right),
                    )
                )
                seq += 1

        rule_seq = 0
        for d in page.get_drawings():
            r = d["rect"]
            if r.width < MIN_RULE_WIDTH_PT or r.height > MAX_RULE_HEIGHT_PT:
                continue
            geom.blocks.append(
                Block(
                    id=f"R{rule_seq}",
                    kind="rule",
                    page=pno,
                    bbox=[round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1)],
                    norm=[
                        norm_coord(r.y0, height),
                        norm_coord(r.x0, width),
                        norm_coord(r.y1, height),
                        norm_coord(r.x1, width),
                    ],
                )
            )
            rule_seq += 1

        cells = sum(1 for b in geom.blocks if b.kind == "cell")
        lines = sum(1 for b in geom.blocks if b.kind == "line")
        geom.doc_type = "grid" if cells >= max(4, lines) else "flow"
        geom.has_text_layer = bool(cells or lines)
        return geom
