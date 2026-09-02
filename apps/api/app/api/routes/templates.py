from fastapi import APIRouter

router = APIRouter()

@router.post("/generate/{document_id}")
async def generate_reusable_template(document_id: str):
    """
    Phase 5: Reusable Template Generation
    Strips raw data from the finalized tree and saves the blank schema as a template.
    """
    # TODO: Invoke Template Extraction Service
    # TODO: Save to Template Library DB
    
    return {
        "status": "success",
        "template_id": "tpl-5678",
        "message": "Template successfully extracted and saved."
    }

@router.get("/library")
async def list_templates():
    """
    Lists all saved reusable templates for new projects.
    """
    return {"templates": []}
