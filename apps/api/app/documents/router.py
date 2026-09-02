from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from .service import save_uploaded_file, UPLOAD_DIR

router = APIRouter()

class UploadResponse(BaseModel):
    status: str
    job_id: str
    message: str
    file_url: str = None

@router.post("/upload", response_model=UploadResponse)
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
        file_url=f"http://127.0.0.1:8000/api/v1/documents/files/{file.filename}"
    )

@router.get("/status/{job_id}")
async def get_extraction_status(job_id: str):
    """
    Checks the status of the extraction pipeline.
    """
    return {"status": "completed", "progress": 100}

@router.get("/files/{filename}")
async def get_uploaded_file(filename: str):
    """
    Serves an uploaded file for the frontend to render.
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
