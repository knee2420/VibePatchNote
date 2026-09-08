"""[scaffold_engine.outline.schemas] 통합 아웃라인 및 5대 컴포넌트 Pydantic V2 모델 (SSOT)."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


ComponentType = Literal["header", "key_value", "table", "list", "paragraph", "media", "form_field", "unknown"]


class ElementItem(BaseModel):
    """아웃라인 섹션 내부에 속한 세부 컴포넌트 단위 및 실제 내용 값."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="elem-1 등 고유 식별자")
    outline_id: Optional[str] = Field(None, description="소속 아웃라인 노드 ID")
    type: str = Field(
        default="key_value",
        description="5대 컴포넌트 분류 유형: key_value | table | list | paragraph | media | form_field",
    )
    label: str = Field(..., description="항목명/라벨")
    value: Optional[Any] = Field(default=None, description="기입된 실제 값(문자열, 숫자, 테이블 등)")
    items: Optional[List[str]] = Field(default=None, description="list 타입인 경우 세부 불릿/항목 목록")
    page: int = Field(1, description="페이지 번호 (1-based)")
    box_2d: Optional[List[int]] = Field(
        default=None, description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    content_summary: Optional[str] = Field(None, description="내용 요약")
    structured_data: Optional[Dict[str, Any]] = Field(
        default=None, description="표 데이터(columns, rows), Key-Value 등 구조화 메타"
    )


class OutlineItem(BaseModel):
    """문서의 계층적 목차(Outline Tree) 및 구획 정보."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="out-1, out-1-1 등 고유 식별자")
    level: int = Field(1, description="계층 깊이: 1(대주제), 2(소주제/섹션), 3(세부항목), 4(하위 세부필드)")
    title: str = Field(..., description="순수 항목명/서식 라벨")
    type: str = Field(
        default="key_value",
        description="컴포넌트 분류: header | key_value | table | list | paragraph | media",
    )
    page: int = Field(1, description="페이지 번호 (1부터 시작)")
    box_2d: Optional[List[int]] = Field(
        default=None, description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    purpose: Optional[str] = Field(None, description="해당 섹션의 비즈니스/도메인 목적 및 역할 요약")
    elements: List[ElementItem] = Field(
        default_factory=list,
        description="해당 노드에 바인딩된 세부 내용 데이터 및 분류",
    )
    children: List["OutlineItem"] = Field(default_factory=list, description="하위 자식 목차 항목 리스트")


OutlineItem.model_rebuild()

# 기존 호환용 별칭
OutlineNode = OutlineItem


class OutlineOutput(BaseModel):
    """CLI --json-schema 강제용 1-Stage 전체 문서 추출 스키마."""

    model_config = ConfigDict(populate_by_name=True)

    document_title: str = Field(..., description="분석 대상 문서 파일명")
    total_pages: int = Field(1, description="실제 분석한 총 페이지 수")
    outlines: List[OutlineItem] = Field(
        default_factory=list,
        description="계층적 목차 트리 (L1~L4 아웃라인 및 5대 컴포넌트 요소 전수 바인딩)",
    )


class OutlineDocument(BaseModel):
    """최종 프론트엔드 및 서비스 레이어가 소비하는 통합 문서 산출물."""

    model_config = ConfigDict(populate_by_name=True)

    document_title: str = Field(..., description="문서 파일명")
    total_pages: int = Field(1, description="총 페이지 수")
    outlines: List[OutlineItem] = Field(default_factory=list, description="계층 목차 트리")
    markdown_outline: str = Field("", description="마크다운 포맷 목차")
    flat_elements: List[ElementItem] = Field(default_factory=list, description="평면 엘리먼트 목록")
    telemetry: Dict[str, Any] = Field(default_factory=dict, description="소요시간 및 토큰 텔레메트리")

    @classmethod
    def from_outline_output(
        cls,
        output: OutlineOutput,
        telemetry: Optional[Dict[str, Any]] = None,
    ) -> "OutlineDocument":
        """OutlineOutput 트리로부터 평탄화 엘리먼트와 마크다운 목차를 유도 생성."""
        flat: List[ElementItem] = []

        def collect(items: List[OutlineItem]):
            for n in items:
                for elem in n.elements:
                    if not elem.outline_id:
                        elem.outline_id = n.id
                    # 부모의 box_2d 폴백 매핑
                    if elem.box_2d is None and n.box_2d:
                        elem.box_2d = n.box_2d
                    flat.append(elem)
                if n.children:
                    collect(n.children)

        collect(output.outlines)

        md_lines: List[str] = []

        def build_md(items: List[OutlineItem], depth: int = 0):
            for n in items:
                indent = "  " * depth
                p_info = f" (p.{n.page})" if n.page else ""
                purpose_info = f" - {n.purpose}" if n.purpose else ""
                md_lines.append(f"{indent}- **{n.title}**{p_info}{purpose_info}")
                if n.children:
                    build_md(n.children, depth + 1)

        build_md(output.outlines)

        return cls(
            document_title=output.document_title,
            total_pages=output.total_pages,
            outlines=output.outlines,
            markdown_outline="\n".join(md_lines),
            flat_elements=flat,
            telemetry=telemetry or {},
        )


def export_json_schema(target_path: Optional[Path] = None) -> Path:
    """CLI --json-schema 플래그 주입용 표준 JSON Schema 파일 내보내기."""
    if target_path is None:
        target_path = Path(__file__).resolve().parent / "outline_schema.json"
    schema = OutlineOutput.model_json_schema()
    target_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    return target_path
