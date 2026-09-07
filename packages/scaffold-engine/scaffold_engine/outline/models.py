"""Scaffold Engine — Outline & Structural Document Models (SSOT).

문서의 계층적 목차(Outline Tree)와 각 섹션에 소속된 세부 컴포넌트(Element)를 정의하는 도메인 모델입니다.
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


ElementType = Literal["table", "form_field", "list", "paragraph", "media", "unknown"]


class ElementItem(BaseModel):
    """아웃라인 섹션 내부에 속한 세부 컴포넌트 단위."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="엘리먼트 고유 식별자 (예: elem-1)")
    outline_id: Optional[str] = Field(None, description="소속 아웃라인 노드 ID (예: out-1)")
    type: str = Field(
        default="paragraph",
        description="컴포넌트 타입: table | form_field | list | paragraph | media",
    )
    label: str = Field(..., description="표시 라벨 / 항목명 (예: 일 시, 참석자, 지출내역 표)")
    page: int = Field(default=1, description="페이지 번호 (1-based)")
    box_2d: List[int] = Field(
        default_factory=lambda: [0, 0, 1000, 1000],
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
        default=1, description="계층 깊이: 1 (대주제/장), 2 (절/소주제), 3 (세부항목)"
    )
    title: str = Field(..., description="섹션 제목 (예: 1차 회의, 일 시, 안 건)")
    page: int = Field(default=1, description="페이지 번호 (1-based)")
    box_2d: Optional[List[int]] = Field(
        None, description="[ymin, xmin, ymax, xmax] 0~1000 전체 섹션 추정 영역"
    )
    purpose: Optional[str] = Field(
        None, description="해당 섹션의 도메인/비즈니스 목적"
    )
    elements: List[ElementItem] = Field(
        default_factory=list, description="이 섹션에 소속된 세부 엘리먼트 목록"
    )
    children: List["OutlineNode"] = Field(
        default_factory=list, description="하위 아웃라인 노드 목록"
    )


OutlineNode.model_rebuild()


class OutlineDocument(BaseModel):
    """문서 1권 전체의 아웃라인 및 구조화 추출 결과."""

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
