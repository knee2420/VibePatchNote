"""templates 도메인의 요청/응답 스키마."""
from typing import List

from pydantic import BaseModel

from app.models import BlankTemplate


class TemplateGenerationResponse(BaseModel):
    status: str
    template_id: str
    message: str


class TemplateLibraryResponse(BaseModel):
    templates: List[BlankTemplate]
