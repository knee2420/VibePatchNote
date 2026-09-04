"""Scaffold Engine Data Types & Schemas (SSOT).

프론트엔드 `@vibe/tiptap-scaffold` 의 `types.ts` 와 1:1 호환되는 Pydantic 모델입니다.
"""
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ScaffoldMeta(BaseModel):
    id: str = Field(..., description="고유 식별자")
    title: str = Field(..., description="문서 서식 제목")
    target_doc: str = Field(..., alias="targetDoc", description="타겟 문서 유형")
    source_pdf_file_name: str = Field(..., alias="sourcePdfFileName", description="원본 PDF 파일명")
    description: str = Field(default="", description="서식 레이아웃 및 뼈대 설명")
    difficulty: Literal["easy", "medium", "hard"] = Field(default="easy", description="서식 복잡도")

    class Config:
        populate_by_name = True


class ScaffoldExtractResult(BaseModel):
    meta: ScaffoldMeta = Field(..., description="서식 메타데이터")
    html_content: str = Field(..., alias="htmlContent", description="Tiptap 에디터 렌더링용 HTML")
    markdown_content: str = Field(..., alias="markdownContent", description="에이전트/MCP 용 마크다운 텍스트")

    class Config:
        populate_by_name = True
