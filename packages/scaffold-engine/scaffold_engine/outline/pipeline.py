"""Scaffold Engine — Outline Extraction Pipeline (Isolated Track).

기존 서식 복원 트랙과 완전히 격리된 문서 구조화(Outline & Element) 전용 파이프라인입니다.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field

from scaffold_engine.extract.geometry import PageGeometry, PdfGeometryExtractor
from scaffold_engine.harness.agy_client import DEFAULT_MODEL, AgyHarness
from scaffold_engine.core.interfaces import LlmHarness
from scaffold_engine.outline.models import (
    ElementItem,
    OutlineDocument,
    OutlineNode,
)
from scaffold_engine.outline.prompt import (
    build_elements_prompt,
    build_outline_prompt,
)

logger = logging.getLogger(__name__)


class _RawOutlineItem(BaseModel):
    id: str
    level: int = 1
    title: str
    page: int = 1
    box_2d: Optional[List[int]] = None
    purpose: Optional[str] = None
    children: List["_RawOutlineItem"] = Field(default_factory=list)


_RawOutlineItem.model_rebuild()


class _OutlineOutput(BaseModel):
    document_title: str
    total_pages: int
    outlines: List[_RawOutlineItem]


class _RawElementItem(BaseModel):
    id: str
    outline_id: str
    type: str = "paragraph"
    label: str
    page: int = 1
    box_2d: List[int] = Field(default_factory=lambda: [0, 0, 1000, 1000])
    content_summary: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None


class _ElementsOutput(BaseModel):
    elements: List[_RawElementItem]


class OutlinePipeline:
    """문서 목차(Outline Tree) 및 세부 컴포넌트(Element) 독립 추출 파이프라인."""

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        harness: Optional[LlmHarness] = None,
        timeout_seconds: int = 90,
    ) -> None:
        self.harness = harness or AgyHarness(model=model, timeout_seconds=timeout_seconds)
        self.extractor = PdfGeometryExtractor()

    def run(self, pdf_path: Union[str, Path]) -> OutlineDocument:
        """PDF를 분석하여 완성된 계층 목차와 엘리먼트가 바인딩된 OutlineDocument 반환."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")

        logger.info("[OutlinePipeline] 분석 시작: %s", pdf_path.name)

        # 1. 기하 측정
        pages = self.extractor.extract(pdf_path)
        if not pages:
            raise ValueError(f"PDF 페이지를 읽을 수 없습니다: {pdf_path.name}")

        # 2. Step 1: 아웃라인 추출
        text_context = self._build_text_context(pages)
        outline_prompt = build_outline_prompt(pdf_path.name, text_context)
        raw_outline_res = self.harness.call_json(outline_prompt)

        outlines = self._parse_outlines(raw_outline_res, pdf_path.name)
        logger.info("[OutlinePipeline] Step 1 완료: 루트 노드 %d개", len(outlines))

        # 3. Step 2: 엘리먼트 추출 및 아웃라인 바인딩
        outline_summary = self._build_outline_summary(outlines)
        geometry_summary = self._build_geometry_summary(pages)
        elements_prompt = build_elements_prompt(pdf_path.name, outline_summary, geometry_summary)

        raw_elements_res = self.harness.call_json(elements_prompt)
        flat_elements = self._parse_and_bind_elements(raw_elements_res, outlines)
        logger.info("[OutlinePipeline] Step 2 완료: 엘리먼트 %d개 바인딩", len(flat_elements))

        # 4. 마크다운 목차 생성
        markdown_outline = self._generate_markdown_outline(outlines)

        return OutlineDocument(
            document_title=pdf_path.name,
            total_pages=len(pages),
            outlines=outlines,
            markdown_outline=markdown_outline,
            flat_elements=flat_elements,
        )

    def _build_text_context(self, pages: List[PageGeometry]) -> str:
        lines: List[str] = []
        for p in pages:
            lines.append(f"--- [페이지 {p.page_number}] ---")
            # 텍스트 전체를 분석할 수 있도록 슬라이싱 제한 해제
            for b in p.text_blocks:
                text = b.text.replace("\n", " ").strip()
                if text:
                    lines.append(f"- (폰트:{b.size}, 위치:{b.bbox}) {text}")
        return "\n".join(lines)

    def _build_outline_summary(self, nodes: List[OutlineNode]) -> str:
        lines: List[str] = []
        def walk(n_list: List[OutlineNode], depth: int = 0):
            prefix = "  " * depth + "- "
            for n in n_list:
                lines.append(f"{prefix}ID: {n.id} | 제목: '{n.title}' | 레벨: {n.level} | 페이지: {n.page}")
                if n.children:
                    walk(n.children, depth + 1)
        walk(nodes)
        return "\n".join(lines)

    def _build_geometry_summary(self, pages: List[PageGeometry]) -> str:
        lines: List[str] = []
        for p in pages:
            lines.append(f"--- [페이지 {p.page_number}] ---")
            for t in p.tables:
                lines.append(f"[실측 표 테이블] norm_bbox={t.norm_bbox}, col={t.col_count}, row={t.row_count}")
            # 텍스트 전체를 분석할 수 있도록 슬라이싱 제한 해제
            for b in p.text_blocks:
                text = b.text.replace("\n", " ").strip()
                if text:
                    lines.append(f"[텍스트] bbox={b.bbox} text='{text}'")
        return "\n".join(lines)

    def _parse_outlines(self, raw_json: Optional[Dict[str, Any]], filename: str) -> List[OutlineNode]:
        if not raw_json:
            return [OutlineNode(id="out-1", level=1, title=filename, page=1)]

        try:
            parsed = _OutlineOutput.model_validate(raw_json)
            def convert(items: List[_RawOutlineItem]) -> List[OutlineNode]:
                res = []
                for it in items:
                    res.append(OutlineNode(
                        id=it.id,
                        level=it.level,
                        title=it.title,
                        page=it.page,
                        box_2d=it.box_2d,
                        purpose=it.purpose,
                        elements=[],
                        children=convert(it.children),
                    ))
                return res
            return convert(parsed.outlines)
        except Exception:
            outlines_data = raw_json.get("outlines", [])
            nodes = []
            for idx, item in enumerate(outlines_data):
                if isinstance(item, dict):
                    nodes.append(OutlineNode(
                        id=item.get("id") or f"out-{idx+1}",
                        level=item.get("level", 1),
                        title=item.get("title") or f"섹션 {idx+1}",
                        page=item.get("page", 1),
                        box_2d=item.get("box_2d"),
                        purpose=item.get("purpose"),
                    ))
            return nodes or [OutlineNode(id="out-1", level=1, title=filename, page=1)]

    def _parse_and_bind_elements(
        self, raw_json: Optional[Dict[str, Any]], outlines: List[OutlineNode]
    ) -> List[ElementItem]:
        if not raw_json:
            return []

        node_map: Dict[str, OutlineNode] = {}
        def map_nodes(nodes: List[OutlineNode]):
            for n in nodes:
                node_map[n.id] = n
                if n.children:
                    map_nodes(n.children)
        map_nodes(outlines)

        raw_elems: List[_RawElementItem] = []
        try:
            parsed = _ElementsOutput.model_validate(raw_json)
            raw_elems = parsed.elements
        except Exception:
            for idx, item in enumerate(raw_json.get("elements", [])):
                if isinstance(item, dict):
                    raw_elems.append(_RawElementItem(
                        id=item.get("id") or f"elem-{idx+1}",
                        outline_id=item.get("outline_id") or "out-1",
                        type=item.get("type", "paragraph"),
                        label=item.get("label") or "컴포넌트",
                        page=item.get("page", 1),
                        box_2d=item.get("box_2d") or [0, 0, 1000, 1000],
                        content_summary=item.get("content_summary"),
                        structured_data=item.get("structured_data"),
                    ))

        flat: List[ElementItem] = []
        for raw in raw_elems:
            item = ElementItem(
                id=raw.id,
                outline_id=raw.outline_id,
                type=raw.type,
                label=raw.label,
                page=raw.page,
                box_2d=raw.box_2d,
                content_summary=raw.content_summary,
                structured_data=raw.structured_data,
            )
            flat.append(item)
            target = node_map.get(raw.outline_id)
            if target:
                target.elements.append(item)
            elif outlines:
                outlines[0].elements.append(item)

        return flat

    def _generate_markdown_outline(self, nodes: List[OutlineNode], depth: int = 0) -> str:
        lines: List[str] = []
        for n in nodes:
            indent = "  " * depth
            p_info = f" (p.{n.page})" if n.page else ""
            purpose_info = f" - {n.purpose}" if n.purpose else ""
            lines.append(f"{indent}- **{n.title}**{p_info}{purpose_info}")
            if n.children:
                lines.append(self._generate_markdown_outline(n.children, depth + 1))
        return "\n".join(lines)
