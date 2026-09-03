"""documents 도메인 엔드포인트. 비즈니스 로직은 service 에 위임합니다."""
from fastapi import APIRouter, BackgroundTasks, File, UploadFile
from fastapi.responses import FileResponse

from .schemas import (
    ExtractionStatusResponse,
    ScanDocumentRequest,
    ScanDocumentResponse,
    UploadResponse,
)
from .service import (
    ExtractionService,
    build_public_file_url,
    resolve_uploaded_file,
    save_uploaded_file,
)

router = APIRouter()
extraction_service = ExtractionService()


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


@router.post("/scan", response_model=ScanDocumentResponse)
async def scan_document_segments(req: ScanDocumentRequest):
    """
    Phase 2 Entrypoint
    업로드된 문서를 agy-cli 워크플로우 엔진으로 분석하여
    표, 개조식 목록, 섹션 바운딩 박스를 추출합니다.
    """
    result = await extraction_service.scan_document_segments(req.filename)
    return ScanDocumentResponse(**result)


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

