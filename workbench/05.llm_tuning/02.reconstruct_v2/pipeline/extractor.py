"""
[02.reconstruct_v2] 기하 실측 및 비전 힌트 추출기 (GeometryHintExtractor).
PyMuPDF를 통해 문서의 물리적 표, 원자 그리드, 셀 병합, 텍스트 라인을 1pt 단위로 실측하고,
비전 모델이 참조할 고정밀 힌트 매트릭스(Hint Matrix)를 생성합니다.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    import pymupdf as fitz
except ImportError:
    import fitz

logger = logging.getLogger(__name__)


def norm_coord(val: float, total: float) -> int:
    if total <= 0:
        return 0
    return max(0, min(1000, round(val / total * 1000)))


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
class V2Cell:
    id: str
    row: int
    col: int
    rowspan: int
    colspan: int
    bbox: List[float]  # [x0, y0, x1, y1]
    norm: List[int]    # [ymin, xmin, ymax, xmax] 0~1000
    text: str
    size: float = 10.0
    bold: bool = False


@dataclass
class V2Table:
    id: str
    page: int
    bbox: List[float]
    norm: List[int]
    rows: int
    cols: int
    col_pct: List[float]
    row_h_pt: List[float]
    cells: List[V2Cell] = field(default_factory=list)


@dataclass
class V2Block:
    id: str
    kind: str  # 'line' | 'image' | 'rule'
    page: int
    bbox: List[float]
    norm: List[int]
    text: str = ""
    size: float = 10.0
    bold: bool = False
    align: str = "left"


@dataclass
class V2PageGeometry:
    page: int
    width: float
    height: float
    tables: List[V2Table] = field(default_factory=list)
    blocks: List[V2Block] = field(default_factory=list)

    def render_hint_text(self) -> str:
        """비전 모델에 전달할 풍부하고 넉넉한 고정밀 표 격자 및 텍스트 힌트 생성."""
        lines = [
            f"=== [페이지 기본 정보: {round(self.width, 1)}pt x {round(self.height, 1)}pt (세로 문서)] ===",
            f"- 검출된 정밀 표 개수: {len(self.tables)}개",
            f"- 검출된 외곽 독립 블록: {len(self.blocks)}개",
        ]

        if self.tables:
            lines.append("\n=== [1. 실측된 정밀 표(Table) 상세 격자 및 셀 구조] ===")
            for ti, t in enumerate(self.tables):
                pos_hint = "상단" if t.norm[0] < 300 else ("중단" if t.norm[0] < 600 else "하단")
                lines.append(f"\n▶ 표 [{t.id}]: 위치={pos_hint} 영역 (좌표: {t.norm}), 규격={t.rows}행 x {t.cols}열")
                lines.append(f"  - 열 너비 비율(%): {t.col_pct}")
                lines.append(f"  - 행 높이(pt): {t.row_h_pt}")
                lines.append("  [셀 목록]")
                for c in t.cells:
                    span_desc = []
                    if c.rowspan > 1:
                        span_desc.append(f"{c.rowspan}행 병합(세로)")
                    if c.colspan > 1:
                        span_desc.append(f"{c.colspan}열 병합(가로)")
                    span_str = f" [{', '.join(span_desc)}]" if span_desc else ""

                    # 힌트 태그 계산
                    hints = []
                    txt = c.text.strip()
                    if c.col == 0:
                        hints.append("첫 번째 열(주로 라벨/항목명)")
                    if any(kw in txt for kw in ["010-", "@", "201", "202", "₩", "$", "원", "팀장", "팀원", "학생", "연구"]):
                        hints.append("인스턴스 기입값/슬롯 후보")
                    hint_suffix = f" <추천: {', '.join(hints)}>" if hints else ""

                    clean_txt = txt.replace("\n", " ").strip()
                    if len(clean_txt) > 250:
                        clean_txt = clean_txt[:250] + " ...(후략)"
                    lines.append(f"  * 셀 [{c.id}] (행{c.row} 열{c.col}){span_str} (폰트:{c.size}pt, 위치:{c.norm}){hint_suffix}: \"{clean_txt}\"")

        if self.blocks:
            lines.append("\n=== [2. 표 외곽 독립 텍스트/미디어 블록 상세] ===")
            for b in self.blocks:
                txt = b.text.replace("\n", " ").strip()
                if len(txt) > 250:
                    txt = txt[:250] + " ...(후략)"
                
                pos_desc = []
                if b.norm[0] < 150:
                    pos_desc.append("문서 최상단 헤더/제목 영역")
                elif b.norm[2] > 900:
                    pos_desc.append("문서 최하단 각주/쪽번호 영역")
                if b.bold or b.size >= 15.0:
                    pos_desc.append("굵은 글씨/대형 폰트(Title 후보)")
                pos_str = f" <특징: {', '.join(pos_desc)}>" if pos_desc else ""

                lines.append(f"- 블록 [{b.id}] ({b.kind}, 정렬:{b.align}, 폰트:{b.size}pt, 위치:{b.norm}){pos_str}: \"{txt}\"")

        return "\n".join(lines)


class V2GeometryExtractor:
    """v2 정밀 기하 실측기."""

    def extract_page(self, page_obj: fitz.Page, page_num: int) -> V2PageGeometry:
        pw, ph = float(page_obj.rect.width), float(page_obj.rect.height)
        geom = V2PageGeometry(page=page_num, width=pw, height=ph)

        # 1. 텍스트 블록
        raw_blocks = page_obj.get_text("dict").get("blocks", [])
        text_blocks = [b for b in raw_blocks if b.get("type") == 0]
        spans = [s for b in text_blocks for line in b.get("lines", []) for s in line.get("spans", [])]

        # 2. 표(Table) 실측
        try:
            detected_tables = page_obj.find_tables().tables
        except Exception:
            detected_tables = []

        covered_bboxes: List[List[float]] = []

        for ti, table in enumerate(detected_tables):
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

            v2_tab = V2Table(
                id=f"t{ti}",
                page=page_num,
                bbox=[round(v, 1) for v in tb],
                norm=[norm_coord(tb[1], ph), norm_coord(tb[0], pw), norm_coord(tb[3], ph), norm_coord(tb[2], pw)],
                rows=len(row_h),
                cols=len(col_w),
                col_pct=[round(w / sum_w * 100, 2) for w in col_w],
                row_h_pt=row_h,
            )
            covered_bboxes.append(tb)

            # 셀 병합 및 투영
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

                cell_text = " ".join(page_obj.get_textbox(fitz.Rect(cell)).split())
                cell_sizes = [
                    s["size"] for s in spans
                    if cell[0] - 1 <= s["bbox"][0] and s["bbox"][2] <= cell[2] + 1
                    and cell[1] - 1 <= s["bbox"][1] and s["bbox"][3] <= cell[3] + 1
                ]
                max_size = round(max(cell_sizes), 1) if cell_sizes else 10.0

                v2_tab.cells.append(
                    V2Cell(
                        id=f"t{ti}-r{r_start}c{c_start}",
                        row=r_start,
                        col=c_start,
                        rowspan=rowspan,
                        colspan=colspan,
                        bbox=[round(v, 1) for v in cell],
                        norm=[norm_coord(cell[1], ph), norm_coord(cell[0], pw), norm_coord(cell[3], ph), norm_coord(cell[2], pw)],
                        text=cell_text,
                        size=max_size,
                    )
                )

            geom.tables.append(v2_tab)

        def is_in_covered_table(bb: List[float]) -> bool:
            bw = bb[2] - bb[0]
            bh = bb[3] - bb[1]
            if bw <= 0 or bh <= 0:
                return False
            b_area = bw * bh
            for t in covered_bboxes:
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
            return any(t[0] - 4 <= cx <= t[2] + 4 and t[1] - 4 <= cy <= t[3] + 4 for t in covered_bboxes)

        # 3. 표 외곽 텍스트 및 이미지
        seq = 0
        for b in sorted(raw_blocks, key=lambda blk: (blk["bbox"][1], blk["bbox"][0])):
            bb = b.get("bbox", [0, 0, 0, 0])
            if is_in_covered_table(bb):
                continue

            if b.get("type") == 1:
                # 이미지
                geom.blocks.append(
                    V2Block(
                        id=f"img{seq}",
                        kind="image",
                        page=page_num,
                        bbox=[round(v, 1) for v in bb],
                        norm=[norm_coord(bb[1], ph), norm_coord(bb[0], pw), norm_coord(bb[3], ph), norm_coord(bb[2], pw)],
                        text="[IMAGE]",
                    )
                )
                seq += 1
                continue

            for line in b.get("lines", []):
                lb = line.get("bbox", [0, 0, 0, 0])
                if is_in_covered_table(lb):
                    continue
                t = "".join(s.get("text", "") for s in line.get("spans", [])).strip()
                if not t:
                    continue
                s0 = line["spans"][0]
                geom.blocks.append(
                    V2Block(
                        id=f"L{seq}",
                        kind="line",
                        page=page_num,
                        bbox=[round(v, 1) for v in lb],
                        norm=[norm_coord(lb[1], ph), norm_coord(lb[0], pw), norm_coord(lb[3], ph), norm_coord(lb[2], pw)],
                        text=t,
                        size=round(s0.get("size", 10.0), 1),
                        bold="bold" in s0.get("font", "").lower(),
                        align="center" if abs((lb[0] + lb[2]) / 2 - pw / 2) < 20 else "left",
                    )
                )
                seq += 1

        return geom
