"""
[02.reconstruct] Stage A — 결정적 기하 측정 데이터 모델.
PyMuPDF 실측 좌표(pt) 및 정규화 좌표(0~1000)를 보유하는 기하 엔티티.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


def norm_coord(value: float, total: float) -> int:
    """0~1000 페이지 상대 좌표로 정규화."""
    if total <= 0:
        return 0
    return max(0, min(1000, round(value / total * 1000)))


@dataclass
class Block:
    """분류 대상이 되는 최소 단위 (cell, line, image, rule)."""
    id: str
    kind: str  # 'cell' | 'line' | 'image' | 'rule'
    page: int
    bbox: List[float]  # [x0, y0, x1, y1] (pt, 페이지 절대좌표)
    norm: List[int]    # [ymin, xmin, ymax, xmax] 0~1000
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
    """실측된 표 구조."""
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
    """한 페이지의 전체 실측 기하."""
    page: int
    width: float
    height: float
    doc_type: str = "flow"  # 'grid' | 'flow'
    has_text_layer: bool = True
    tables: List[TableGeometry] = field(default_factory=list)
    blocks: List[Block] = field(default_factory=list)

    def classifiable(self) -> List[Block]:
        """역할 판정 대상 블록(구분선 제외)."""
        return [b for b in self.blocks if b.kind != "rule"]
