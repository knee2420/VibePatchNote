"""Stage 3: 후처리 및 아웃라인 파싱·표준화 (Postprocess Track)."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from scaffold_engine.outline.schemas.models import (
    OutlineDocument,
    OutlineItem,
    OutlineOutput,
)

logger = logging.getLogger(__name__)


class OutlineResponseParser:
    """LLM 구조화 출력을 OutlineDocument로 파싱, 검증, 폴백 보정하는 후처리기."""

    @staticmethod
    def validate_schema(raw_output: Any) -> Tuple[Optional[OutlineOutput], Optional[str]]:
        """Pydantic 스키마 검증을 수행합니다."""
        try:
            validated = OutlineOutput.model_validate(raw_output)
            return validated, None
        except Exception as e:
            return None, str(e)

    @staticmethod
    def count_elements(items: List[OutlineItem]) -> int:
        """목차 트리의 모든 elements 수를 재귀 집계합니다."""
        c = 0
        for it in items:
            c += len(it.elements or [])
            if it.children:
                c += OutlineResponseParser.count_elements(it.children)
        return c

    @staticmethod
    def create_fallback_document(
        pdf_path: Path,
        total_pages: int,
        telemetry: Dict[str, Any],
        display_name: Optional[str] = None,
    ) -> OutlineDocument:
        """분석 실패 시 최소 복원용 단일 루트 폴백 문서를 생성합니다."""
        title_name = display_name or pdf_path.name
        root = OutlineItem(
            id="out-root",
            level=1,
            title=title_name,
            page=1,
            box_2d=[50, 50, 950, 950],
            purpose="문서 전체 (폴백)",
            elements=[],
            children=[],
        )
        return OutlineDocument(
            document_title=title_name,
            total_pages=total_pages,
            outlines=[root],
            markdown_outline=f"- **{title_name}** (p.1)",
            flat_elements=[],
            telemetry=telemetry,
        )

    @staticmethod
    def lenient_recover(
        raw_json: Dict[str, Any],
        filename: str,
        total_pages: int,
        telemetry: Dict[str, Any],
    ) -> OutlineDocument:
        """부분적으로 손상된 JSON 응답에서 목차 노드를 관용적으로 복구합니다."""
        outlines_data = raw_json.get("outlines") or []
        items: List[OutlineItem] = []
        for idx, it in enumerate(outlines_data):
            if isinstance(it, dict):
                items.append(
                    OutlineItem(
                        id=it.get("id") or f"out-{idx+1}",
                        level=it.get("level", 1),
                        title=it.get("title") or f"섹션 {idx+1}",
                        page=it.get("page", 1),
                        box_2d=it.get("box_2d"),
                        purpose=it.get("purpose"),
                        elements=[],
                        children=[],
                    )
                )
        if not items:
            return OutlineResponseParser.create_fallback_document(
                Path(filename), total_pages, telemetry, display_name=filename
            )

        output = OutlineOutput(
            document_title=raw_json.get("document_title") or filename,
            total_pages=raw_json.get("total_pages") or total_pages,
            outlines=items,
        )
        return OutlineDocument.from_outline_output(output, telemetry=telemetry)
