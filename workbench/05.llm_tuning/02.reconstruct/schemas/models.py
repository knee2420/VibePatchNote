"""
[02.reconstruct] Stage B 및 Stage C 데이터 모델 및 계약 스키마.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# 역할 목록
ROLES = ("title", "label", "value", "mixed", "decoration")
SLOT_ROLES = frozenset({"value", "mixed"})


class BlockDecision(BaseModel):
    """Stage B: 개별 블록의 역할 판정 결과."""
    id: str
    role: str = Field(..., description="title | label | value | mixed | decoration")
    value_text: str = Field(default="", description="비워야 할 인스턴스 데이터 텍스트 원문")
    slot_label: str = Field(default="", description="해당 자리에 무엇을 넣어야 하는지 안내하는 한국어 라벨")


class ClassificationResult(BaseModel):
    """Stage B: 페이지별 판정 결과 페이로드."""
    doc_title: str
    blocks: List[BlockDecision]


class SlotMappingItem(BaseModel):
    """Stage C: 최종 Tiptap 와이어프레임과 1:1 매핑되는 슬롯 메타데이터."""
    id: str
    number: int
    label: str
    box_2d: List[int] = Field(..., description="[ymin, xmin, ymax, xmax] 0~1000 상대좌표")
    page_number: int = Field(default=1, alias="pageNumber")

    class Config:
        populate_by_name = True


class ScaffoldMeta(BaseModel):
    id: str
    title: str
    target_doc: str = Field(default="", alias="targetDoc")
    source_pdf_file_name: str = Field(default="", alias="sourcePdfFileName")
    description: str = Field(default="")
    difficulty: str = Field(default="easy")
    total_pages: int = Field(default=1, alias="totalPages")

    class Config:
        populate_by_name = True


class ScaffoldExtractResult(BaseModel):
    """02.reconstruct 파이프라인의 최종 산출물."""
    meta: ScaffoldMeta
    html_content: str = Field(..., alias="htmlContent")
    markdown_content: str = Field(default="", alias="markdownContent")
    slots: List[SlotMappingItem] = Field(default_factory=list)

    class Config:
        populate_by_name = True
