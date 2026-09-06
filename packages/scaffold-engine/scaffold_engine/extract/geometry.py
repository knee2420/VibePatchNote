"""Stage A — 결정적 기하 측정.

PDF 에서 표 구조, 셀 경계, 행 높이, 열 너비, 텍스트 라인, 이미지, 구분선을
PyMuPDF 로 실측한다. **AI 를 호출하지 않으며 어떤 PDF 에서도 동일하게 동작한다.**
이후 단계(분류/조립)는 여기서 나온 값만 좌표의 단일 출처로 삼는다.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Union

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)

# 이 크기 미만/이상의 도형은 구분선으로 보지 않는다.
MIN_RULE_WIDTH_PT = 20.0
MAX_RULE_HEIGHT_PT = 6.0


def _norm(value: float, total: float) -> int:
    """0~1000 페이지 상대 좌표로 정규화."""
    if total <= 0:
        return 0
    return max(0, min(1000, round(value / total * 1000)))


@dataclass
class Block:
    """분류 대상이 되는 최소 단위. id 는 파이프라인 전체에서 좌표를 찾는 열쇠다."""

    id: str
    kind: str  # cell | line | image | rule
    page: int
    bbox: List[float]  # [x0, y0, x1, y1] (pt, 페이지 절대좌표)
    norm: List[int]  # [ymin, xmin, ymax, xmax] 0~1000
    text: str = ""
    size: float = 0.0
    bold: bool = False
    align: str = "left"
    row: Optional[int] = None
    col: Optional[int] = None


@dataclass
class TableGeometry:
    id: str
    page: int
    bbox: List[float]
    norm: List[int]
    rows: int
    cols: int
    col_pct: List[float]
    row_pct: List[float]
    row_h_pt: List[float]


@dataclass
class PageGeometry:
    page: int
    width: float
    height: float
    doc_type: str = "flow"  # grid | flow
    has_text_layer: bool = True
    tables: List[TableGeometry] = field(default_factory=list)
    blocks: List[Block] = field(default_factory=list)

    def classifiable(self) -> List[Block]:
        """역할 판정 대상 블록(구분선 제외)."""
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
    """`core.interfaces.GeometryExtractor` 구현체."""

    def extract(self, path: Union[str, Path]) -> List[PageGeometry]:
        path = Path(path)
        doc = fitz.open(path)
        try:
            return [self._page(page, i + 1) for i, page in enumerate(doc)]
        finally:
            doc.close()

    # --- 내부 ---

    def _page(self, page, pno: int) -> PageGeometry:
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
        except Exception as exc:  # PyMuPDF 버전차 / 손상 PDF 방어
            logger.warning("[geometry] find_tables 실패 (p%d): %s", pno, exc)
            tables = []

        covered: List[List[float]] = []
        for ti, table in enumerate(tables):
            tb = list(table.bbox)
            t_height = (tb[3] - tb[1]) or 1.0
            row_h = [r.bbox[3] - r.bbox[1] for r in table.rows]
            first_row = [c for c in table.rows[0].cells if c] if table.rows else []
            col_w = [c[2] - c[0] for c in first_row]
            t_width = sum(col_w) or 1.0

            geom.tables.append(
                TableGeometry(
                    id=f"t{ti}",
                    page=pno,
                    bbox=[round(v, 1) for v in tb],
                    norm=[_norm(tb[1], height), _norm(tb[0], width),
                          _norm(tb[3], height), _norm(tb[2], width)],
                    rows=len(table.rows),
                    cols=len(col_w),
                    col_pct=[round(w / t_width * 100, 2) for w in col_w],
                    row_pct=[round(h / t_height * 100, 2) for h in row_h],
                    row_h_pt=[round(h, 1) for h in row_h],
                )
            )
            covered.append(tb)

            for ri, row in enumerate(table.rows):
                for ci, cell in enumerate(row.cells):
                    if cell is None:
                        continue
                    cell_sizes = [
                        s["size"] for s in spans
                        if cell[0] - 1 <= s["bbox"][0] and s["bbox"][2] <= cell[2] + 1
                        and cell[1] - 1 <= s["bbox"][1] and s["bbox"][3] <= cell[3] + 1
                    ]
                    geom.blocks.append(
                        Block(
                            id=f"{ti}-r{ri}c{ci}",
                            kind="cell",
                            page=pno,
                            bbox=[round(v, 1) for v in cell],
                            norm=[_norm(cell[1], height), _norm(cell[0], width),
                                  _norm(cell[3], height), _norm(cell[2], width)],
                            text=" ".join(page.get_textbox(fitz.Rect(cell)).split()),
                            size=round(max(cell_sizes), 1) if cell_sizes else 0.0,
                            row=ri,
                            col=ci,
                        )
                    )

        def inside_table(bb) -> bool:
            return any(
                bb[0] >= t[0] - 2 and bb[1] >= t[1] - 2
                and bb[2] <= t[2] + 2 and bb[3] <= t[3] + 2
                for t in covered
            )

        seq = 0
        for b in sorted(raw_blocks, key=lambda blk: (blk["bbox"][1], blk["bbox"][0])):
            bb = b["bbox"]
            if b.get("type") == 1:
                geom.blocks.append(
                    Block(id=f"img{seq}", kind="image", page=pno,
                          bbox=[round(v, 1) for v in bb],
                          norm=[_norm(bb[1], height), _norm(bb[0], width),
                                _norm(bb[3], height), _norm(bb[2], width)],
                          text="[IMAGE]")
                )
                seq += 1
                continue
            if inside_table(bb):
                continue
            for line in b["lines"]:
                text = "".join(s["text"] for s in line["spans"]).strip()
                if not text:
                    continue
                s0 = line["spans"][0]
                lb = line["bbox"]
                geom.blocks.append(
                    Block(id=f"L{seq}", kind="line", page=pno,
                          bbox=[round(v, 1) for v in lb],
                          norm=[_norm(lb[1], height), _norm(lb[0], width),
                                _norm(lb[3], height), _norm(lb[2], width)],
                          text=text, size=round(s0["size"], 1),
                          bold="bold" in s0["font"].lower(),
                          align=_align_of(lb, left, right))
                )
                seq += 1

        rule_seq = 0
        for d in page.get_drawings():
            r = d["rect"]
            if r.width < MIN_RULE_WIDTH_PT or r.height > MAX_RULE_HEIGHT_PT:
                continue
            geom.blocks.append(
                Block(id=f"R{rule_seq}", kind="rule", page=pno,
                      bbox=[round(r.x0, 1), round(r.y0, 1), round(r.x1, 1), round(r.y1, 1)],
                      norm=[_norm(r.y0, height), _norm(r.x0, width),
                            _norm(r.y1, height), _norm(r.x1, width)])
            )
            rule_seq += 1

        cells = sum(1 for b in geom.blocks if b.kind == "cell")
        lines = sum(1 for b in geom.blocks if b.kind == "line")
        geom.doc_type = "grid" if cells >= max(4, lines) else "flow"
        geom.has_text_layer = bool(cells or lines)
        return geom
