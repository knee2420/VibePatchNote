"""templates 도메인의 요청/응답 스키마 및 도메인 모델."""
from typing import Any, Dict, List

from pydantic import BaseModel


class BlankTemplate(BaseModel):
    """원본 데이터를 제거하고 뼈대만 남긴 재사용 템플릿."""

    template_id: str
    domain: str
    scaffold_schema: Dict[str, Any]


class TemplateGenerationResponse(BaseModel):
    status: str
    template_id: str
    message: str


class TemplateLibraryResponse(BaseModel):
    templates: List[BlankTemplate]
