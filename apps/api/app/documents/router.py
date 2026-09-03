"""documents 도메인 엔드포인트. 비즈니스 로직은 service 에 위임합니다."""
from fastapi import APIRouter, BackgroundTasks, File, UploadFile
from fastapi.responses import FileResponse

from .schemas import ExtractionStatusResponse, UploadResponse
from .service import build_public_file_url, resolve_uploaded_file, save_uploaded_file

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_reference_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """
    Phase 1 Entrypoint
    Uploads a document and saves it locally.
    Delegates file processing to the native workflow engine asynchronously.
    """
    saved_path = save_uploaded_file(file)

    # TODO: Trigger Native Workflow Engine asynchronously

    return UploadResponse(
        status="processing",
        job_id="native-job-1234",
        message="Reference document uploaded successfully.",
        file_url=build_public_file_url(saved_path.name),
    )


@router.get("/status/{job_id}", response_model=ExtractionStatusResponse)
async def get_extraction_status(job_id: str):
    """
    Checks the status of the extraction pipeline.
    """
    return ExtractionStatusResponse(status="completed", progress=100)


@router.get("/files/{filename}")
async def get_uploaded_file(filename: str):
    """
    Serves an uploaded file for the frontend to render.
    """
    return FileResponse(resolve_uploaded_file(filename))
