from fastapi import APIRouter, UploadFile, File, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()

class UploadResponse(BaseModel):
    status: str
    job_id: str
    message: str

@router.post("/", response_model=UploadResponse)
async def upload_reference_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Phase 1 & 2 Entrypoint
    Uploads a document, triggers Dify for Reference Classification,
    Goal Reverse-Engineering, Schema Extraction, and Scaffold Extraction.
    """
    # TODO: Save file temporarily
    # TODO: Invoke Services (Dify Classifier -> Dify Workflow)
    # TODO: Trigger Semantic Tagging (Phase 3) asynchronously
    
    return UploadResponse(
        status="processing",
        job_id="dummy-job-1234",
        message="Reference document uploaded and extraction pipeline started."
    )

@router.get("/status/{job_id}")
async def get_extraction_status(job_id: str):
    """
    Checks the status of the extraction pipeline.
    """
    return {"status": "completed", "progress": 100}
