"""Stage 4: 품질 측정 및 충실도 검증 (Evaluation Track)."""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from scaffold_engine.outline.schemas.models import OutlineDocument

logger = logging.getLogger(__name__)


@dataclass
class OutlineValidationReport:
    """목차 추출 완성도 및 유효성 리포트."""

    ok: bool
    total_nodes: int
    total_elements: int
    max_depth: int
    has_empty_content: bool
    warnings: List[str] = field(default_factory=list)

    def summary(self) -> str:
        status_str = "통과" if self.ok else "경고"
        return (
            f"목차 검증 [{status_str}]: 노드 {self.total_nodes}개 · 깊이 L{self.max_depth} · "
            f"요소 {self.total_elements}개"
            + (f" (경고: {', '.join(self.warnings)})" if self.warnings else "")
        )


class OutlineValidator:
    """아웃라인 계층 트리 및 요소 정밀도 검증기."""

    @staticmethod
    def validate(document: OutlineDocument) -> OutlineValidationReport:
        warnings: List[str] = []
        total_nodes = len(document.outlines)
        total_elements = len(document.flat_elements)

        if not document.flat_elements:
            warnings.append("문서 구성요소가 하나도 추출되지 않았습니다 (flat_elements empty).")

        max_depth = 1
        for it in document.outlines:
            lvl = getattr(it, "level", 1) or 1
            if lvl > max_depth:
                max_depth = lvl

        has_empty_content = (total_nodes == 0 or total_elements == 0)
        ok = not has_empty_content

        return OutlineValidationReport(
            ok=ok,
            total_nodes=total_nodes,
            total_elements=total_elements,
            max_depth=max_depth,
            has_empty_content=has_empty_content,
            warnings=warnings,
        )
