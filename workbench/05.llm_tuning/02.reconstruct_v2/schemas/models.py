"""
[02.reconstruct_v2] 비전 중심 아웃라인 및 스캐폴드 재구성 데이터 모델.
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator

# 지원하는 블록 역할
RoleType = Literal["title", "header", "label", "value", "mixed", "decoration", "ignore"]


class CellDecision(BaseModel):
    """표의 특정 셀 또는 블록에 대한 비전 모델 판정."""
    id: str = Field(..., description="블록 ID (예: 't0-r0c0', 'L1')")
    role: RoleType = Field(..., description="역할: title, header, label, value, mixed, decoration, ignore")
    value_text: str = Field(default="", description="새로 채워야 할 인스턴스 값 텍스트 (원문 그대로)")
    slot_label: str = Field(default="", description="사용자 안내용 한국어 슬롯 라벨 (예: '팀명', '과제명', '회의 일시')")

    @model_validator(mode="before")
    @classmethod
    def normalize_keys(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "block_id" in data and "id" not in data:
                data["id"] = str(data["block_id"])
            elif "cell_id" in data and "id" not in data:
                data["id"] = str(data["cell_id"])
            if "role" in data and isinstance(data["role"], str):
                data["role"] = data["role"].lower()
        return data


class PageVisionOutput(BaseModel):
    """비전 모델이 페이지 이미지와 기하 힌트를 보고 산출하는 구조화 결과."""
    page: int = Field(default=1, description="페이지 번호")
    doc_title: str = Field(default="", description="문서 대제목 (H1)")
    decisions: List[CellDecision] = Field(default_factory=list, description="모든 셀/블록의 역할 및 슬롯 판정 목록")


class SlotMappingItem(BaseModel):
    """Tiptap 와이어프레임과 1:1 매핑되는 슬롯 메타데이터."""
    id: str = Field(..., description="s1, s2 등 슬롯 식별자")
    number: int = Field(..., description="슬롯 번호 (1-based 순차)")
    label: str = Field(..., description="슬롯 한국어 라벨")
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
    """02.reconstruct_v2 최종 산출물."""
    meta: ScaffoldMeta
    html_content: str = Field(..., alias="htmlContent")
    markdown_content: str = Field(default="", alias="markdownContent")
    slots: List[SlotMappingItem] = Field(default_factory=list)

    class Config:
        populate_by_name = True
