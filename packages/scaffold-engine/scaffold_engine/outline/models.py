"""Scaffold Engine — Outline & Structural Document Models (SSOT).

문서의 계층적 목차(Outline Tree)와 각 섹션에 소속된 세부 컴포넌트(Element)를 정의하는 도메인 모델입니다.
V2 인지적 분해 스키마와 1-Stage 전수 추출 규격을 통합 지원합니다.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, ConfigDict, Field


ElementType = Literal["header", "key_value", "table", "list", "paragraph", "media", "form_field", "unknown"]


# --- 1. V2 CLI 규격 스키마 (JSON Schema Export & LLM Output) ---

class ElementItem(BaseModel):
    """아웃라인 섹션 내부에 속한 세부 컴포넌트 단위 및 실측 내용 값."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="elem-1 등 고유 식별자")
    outline_id: Optional[str] = Field(None, description="소속 아웃라인 노드 ID (예: out-1)")
    type: str = Field(
        default="key_value",
        description="5대 컴포넌트 분류 유형: key_value | table | list | paragraph | media | form_field",
    )
    label: str = Field(..., description="항목명 / 라벨 (예: 팀명, 성명, 지출내역 표)")
    value: Optional[Any] = Field(default=None, description="기입된 실제 값(문자열, 숫자, 테이블 등)")
    items: Optional[List[str]] = Field(default=None, description="list 타입인 경우 세부 불릿/항목 목록")
    page: int = Field(default=1, description="페이지 번호 (1-based)")
    box_2d: Optional[List[int]] = Field(
        default=None,
        description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표",
    )
    content_summary: Optional[str] = Field(None, description="내용 요약 또는 원문 발췌")
    structured_data: Optional[Dict[str, Any]] = Field(
        default=None, description="표 데이터(columns, rows), Key-Value 쌍 등 구조화 메타"
    )


class OutlineNode(BaseModel):
    """문서의 계층적 목차 및 섹션 뼈대."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="아웃라인 노드 식별자 (예: out-1, out-1-1)")
    level: int = Field(
        default=1, description="계층 깊이: 1 (대주제/장), 2 (절/소주제), 3 (세부항목), 4 (하위 세부필드)"
    )
    title: str = Field(..., description="섹션 제목 / 서식 라벨")
    type: str = Field(
        default="key_value",
        description="컴포넌트 분류: header | key_value | table | list | paragraph | media",
    )
    page: int = Field(default=1, description="페이지 번호 (1-based)")
    box_2d: Optional[List[int]] = Field(
        None, description="[ymin, xmin, ymax, xmax] 0~1000 전체 섹션 추정 영역"
    )
    purpose: Optional[str] = Field(
        None, description="해당 섹션의 도메인/비즈니스 목적 및 역할 요약"
    )
    elements: List[ElementItem] = Field(
        default_factory=list, description="이 섹션에 소속된 세부 엘리먼트 목록"
    )
    children: List["OutlineNode"] = Field(
        default_factory=list, description="하위 아웃라인 노드 목록"
    )


OutlineNode.model_rebuild()

# V2 호환 별칭
OutlineItem = OutlineNode


class OutlineOutput(BaseModel):
    """V2 CLI 네이티브 구조화 출력 스키마."""

    model_config = ConfigDict(populate_by_name=True)

    document_title: str = Field(..., description="분석 대상 문서 파일명")
    total_pages: int = Field(default=1, description="실제 분석한 총 페이지 수")
    outlines: List[OutlineNode] = Field(
        default_factory=list,
        description="계층적 목차 트리 (L1~L4 아웃라인 및 5대 컴포넌트 요소 전수 바인딩)",
    )


# --- 2. 최종 결과 도메인 모델 (Scaffold Engine SSOT) ---

class OutlineDocument(BaseModel):
    """문서 1권 전체의 아웃라인 및 구조화 추출 결과 (평탄화 목록 및 마크다운 목차 포함)."""

    model_config = ConfigDict(populate_by_name=True)

    document_title: str = Field(..., description="문서 파일명 또는 제목")
    total_pages: int = Field(default=1, description="총 페이지 수")
    outlines: List[OutlineNode] = Field(
        default_factory=list, description="루트 계층 아웃라인 노드 목록"
    )
    markdown_outline: str = Field(default="", description="가독성 마크다운 목차 텍스트")
    flat_elements: List[ElementItem] = Field(
        default_factory=list, description="모든 아웃라인에 소속된 엘리먼트 평탄화 목록"
    )
    telemetry: Dict[str, Any] = Field(
        default_factory=dict, description="실행 시간, 토큰 사용량 등 텔레메트리 메타"
    )

    @classmethod
    def from_outline_output(
        cls,
        output: OutlineOutput,
        telemetry: Optional[Dict[str, Any]] = None,
    ) -> "OutlineDocument":
        """OutlineOutput으로부터 flat_elements 및 markdown_outline을 자동 유도하여 Document 생성."""
        flat: List[ElementItem] = []

        def collect(nodes: List[OutlineNode]):
            for n in nodes:
                # 소속 엘리먼트 평탄화
                for elem in n.elements:
                    if not elem.outline_id:
                        elem.outline_id = n.id
                    flat.append(elem)
                if n.children:
                    collect(n.children)

        collect(output.outlines)

        md_lines: List[str] = []

        def build_md(nodes: List[OutlineNode], depth: int = 0):
            for n in nodes:
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
        target_path = Path(__file__).resolve().parent / "prompts" / "outline_schema.json"
    target_path.parent.mkdir(parents=True, exist_ok=True)
    schema = OutlineOutput.model_json_schema()
    target_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    return target_path


if __name__ == "__main__":
    p = export_json_schema()
    print(f"Exported schema: {p}")
