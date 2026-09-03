"""templates 도메인의 비즈니스 로직."""
from typing import List

from app.models import BlankTemplate


class TemplateService:
    """
    Phase 5: 확정된 트리에서 원본 데이터를 제거해 재사용 가능한 빈 템플릿을 추출합니다.
    """

    async def generate_template(self, document_id: str) -> str:
        # TODO: Invoke Template Extraction Service
        # TODO: Save to Template Library DB
        return "tpl-5678"

    async def list_templates(self) -> List[BlankTemplate]:
        # TODO: Load saved templates from the template library
        return []


template_service = TemplateService()
