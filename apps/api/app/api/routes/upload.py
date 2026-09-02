from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.services.upload_svc import save_uploaded_file

router = APIRouter()

class UploadResponse(BaseModel):
    status: str
    job_id: str
    message: str
    file_path: str = None

@router.post("/", response_model=UploadResponse)
async def upload_reference_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Phase 1 Entrypoint
    Uploads a document and saves it locally.
    Delegates file processing to the native workflow engine asynchronously.
    """
    # 1. Save file via service layer
    try:
        saved_path = save_uploaded_file(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail="File saving failed")

    # TODO: Trigger Native Workflow Engine asynchronously
    
    return UploadResponse(
        status="processing",
        job_id="native-job-1234",
        message="Reference document uploaded successfully.",
        file_path=saved_path
    )

@router.get("/status/{job_id}")
async def get_extraction_status(job_id: str):
    """
    Checks the status of the extraction pipeline.
    """
    return {"status": "completed", "progress": 100}
