"""[scaffold_engine.tools] PDF 결정적 기하 측정 도구 (PdfGeometryExtractor).

PDF에서 표 구조, 셀 경계, 행 높이, 열 너비, 텍스트 라인, 이미지, 구분선을
PyMuPDF(fitz)로 실측하여 정규화된 2D 기하 데이터 모델을 생성합니다.
AI 추론을 호출하지 않으며, 모든 파이프라인(wireframe, outline)이 공유하는 결정적 기하 기반입니다.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

try:
    import pymupdf as fitz
except ImportError:
    import fitz

from ..utils.coordinates import normalize_bbox, normalize_coord

logger = logging.getLogger(__name__)

MIN_RULE_WIDTH_PT = 20.0
MAX_RULE_HEIGHT_PT = 6.0


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


@dataclass
class Block:
    """분류 대상이 되는 최소 기하 단위. id는 파이프라인 전체에서 좌표를 찾는 고유 키입니다."""

    id: str
    kind: str  # cell | line | image | rule
    page: int
    bbox: List[float]  # [x0, y0, x1, y1] (pt, 페이지 절대좌표)
    norm: List[int]  # [ymin, xmin, ymax, xmax] (0~1000 상대좌표)
    text: str = ""
    size: float = 0.0
    bold: bool = False
    align: str = "left"
    row: Optional[int] = None
    col: Optional[int] = None
    rowspan: int = 1
    colspan: int = 1


@dataclass
class TableGeometry:
    """실측된 단일 표(Table)의 구조 및 상대 비율 메타데이터."""

    id: str
    page: int
    bbox: List[float]
    norm: List[int]
    rows: int
    cols: int
    col_pct: List[float]
    row_pct: List[float]
    row_h_pt: List[float]
    cells: List[Block] = field(default_factory=list)


@dataclass
class PageGeometry:
    """단일 PDF 페이지의 전체 실측 기하 컨테이너."""

    page: int
    width: float
    height: float
    doc_type: str = "flow"  # grid | flow
    has_text_layer: bool = True
    tables: List[TableGeometry] = field(default_factory=list)
    blocks: List[Block] = field(default_factory=list)

    def classifiable(self) -> List[Block]:
        """역할 판정 대상 블록 (구분선 제외)."""
        return [b for b in self.blocks if b.kind != "rule"]


def _align_of(bbox: List[float], left: float, right: float) -> str:
    center = (left + right) / 2
    cx = (bbox[0] + bbox[2]) / 2
    if abs(bbox[2] - right) < 6 and abs(bbox[0] - left) > 40:
        return "right"
    if abs(cx - center) < 12 and abs(bbox[0] - left) > 25:
        return "center"
    return "left"


class PdfGeometryExtractor:
    """PDF 결정적 기하 측정기 (엔진 공용 도구)."""

    def extract(self, path: Union[str, Path]) -> List[PageGeometry]:
        path = Path(path).resolve()
        if not path.exists():
            raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {path}")

        doc = fitz.open(path)
        try:
            return [self._page(page, i + 1) for i, page in enumerate(doc)]
        finally:
            doc.close()

    def _page(self, page: Any, pno: int) -> PageGeometry:
        width, height = page.rect.width, page.rect.height
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
            logger.warning("[PdfGeometryExtractor] find_tables 실패 (p%d): %s", pno, exc)
            tables = []

        covered: List[List[float]] = []
        for ti, table in enumerate(tables):
            tb = list(table.bbox)
            raw_cells: List[List[float]] = []
            for row in table.rows:
                for c in row.cells:
                    if c is not None:
                        raw_cells.append(list(c))

            if not raw_cells:
                continue

            all_xs = [c[0] for c in raw_cells] + [c[2] for c in raw_cells]
            all_ys = [c[1] for c in raw_cells] + [c[3] for c in raw_cells]
            x_grid = _cluster_coords(all_xs, tol=4.0)
            y_grid = _cluster_coords(all_ys, tol=4.0)

            if len(x_grid) < 2 or len(y_grid) < 2:
                continue

            col_w = [round(x_grid[i + 1] - x_grid[i], 1) for i in range(len(x_grid) - 1)]
            row_h = [round(y_grid[i + 1] - y_grid[i], 1) for i in range(len(y_grid) - 1)]
            sum_w = sum(col_w) or 1.0
            t_height = (tb[3] - tb[1]) or 1.0

            tab_geom = TableGeometry(
                id=f"t{ti}",
                page=pno,
                bbox=[round(v, 1) for v in tb],
                norm=normalize_bbox(tb, width, height),
                rows=len(row_h),
                cols=len(col_w),
                col_pct=[round(w / sum_w * 100, 2) for w in col_w],
                row_pct=[round(h / t_height * 100, 2) for h in row_h],
                row_h_pt=row_h,
                cells=[],
            )
            covered.append(tb)

            # 셀 병합 및 원자 그리드 투영 (rowspan, colspan 정밀 산출)
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

                cell_text = " ".join(page.get_textbox(fitz.Rect(cell)).split())
                cell_sizes = [
                    s["size"]
                    for s in spans
                    if cell[0] - 1 <= s["bbox"][0]
                    and s["bbox"][2] <= cell[2] + 1
                    and cell[1] - 1 <= s["bbox"][1]
                    and s["bbox"][3] <= cell[3] + 1
                ]
                max_size = round(max(cell_sizes), 1) if cell_sizes else 10.0

                cell_block = Block(
                    id=f"t{ti}-r{r_start}c{c_start}",
                    kind="cell",
                    page=pno,
                    bbox=[round(v, 1) for v in cell],
                    norm=normalize_bbox(cell, width, height),
                    text=cell_text,
                    size=max_size,
                    row=r_start,
                    col=c_start,
                    rowspan=rowspan,
                    colspan=colspan,
                )
                tab_geom.cells.append(cell_block)
                geom.blocks.append(cell_block)

            geom.tables.append(tab_geom)

        def is_in_covered_table(bb: List[float]) -> bool:
            bw = bb[2] - bb[0]
            bh = bb[3] - bb[1]
            if bw <= 0 or bh <= 0:
                return False
            b_area = bw * bh
            for t in covered:
                ix0 = max(bb[0], t[0])
                iy0 = max(bb[1], t[1])
                ix1 = min(bb[2], t[2])
                iy1 = min(bb[3], t[3])
                if ix1 > ix0 and iy1 > iy0:
                    inter_area = (ix1 - ix0) * (iy1 - iy0)
                    if inter_area / b_area >= 0.35:
                        return True
            cx = (bb[0] + bb[2]) / 2.0
            cy = (bb[1] + bb[3]) / 2.0
            return any(t[0] - 4 <= cx <= t[2] + 4 and t[1] - 4 <= cy <= t[3] + 4 for t in covered)

        seq = 0
        for b in sorted(raw_blocks, key=lambda blk: (blk["bbox"][1], blk["bbox"][0])):
            bb = b["bbox"]
            if is_in_covered_table(bb):
                continue
            if b.get("type") == 1:
                geom.blocks.append(
                    Block(
                        id=f"img{seq}",
                        kind="image",
                        page=pno,
                        bbox=[round(v, 1) for v in bb],
                        norm=normalize_bbox(bb, width, height),
                        text="[IMAGE]",
                    )
                )
                seq += 1
                continue
            for line in b["lines"]:
                lb = line["bbox"]
                if is_in_covered_table(lb):
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
                        norm=normalize_bbox(lb, width, height),
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
                    norm=normalize_bbox([r.x0, r.y0, r.x1, r.y1], width, height),
                )
            )
            rule_seq += 1

        cells = sum(1 for b in geom.blocks if b.kind == "cell")
        lines = sum(1 for b in geom.blocks if b.kind == "line")
        geom.doc_type = "grid" if cells >= max(4, lines) else "flow"
        geom.has_text_layer = bool(cells or lines)
        return geom
