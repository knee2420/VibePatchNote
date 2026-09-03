"""templates 도메인 엔드포인트. 비즈니스 로직은 service 에 위임합니다."""
from fastapi import APIRouter

from .schemas import TemplateGenerationResponse, TemplateLibraryResponse
from .service import template_service

router = APIRouter()


@router.post("/generate/{document_id}", response_model=TemplateGenerationResponse)
async def generate_reusable_template(document_id: str):
    """
    Phase 5: Reusable Template Generation
    Strips raw data from the finalized tree and saves the blank schema as a template.
    """
    template_id = await template_service.generate_template(document_id)
    return TemplateGenerationResponse(
        status="success",
        template_id=template_id,
        message="Template successfully extracted and saved.",
    )


@router.get("/library", response_model=TemplateLibraryResponse)
async def list_templates():
    """
    Lists all saved reusable templates for new projects.
    """
    return TemplateLibraryResponse(templates=await template_service.list_templates())
