"""documents 도메인 엔드포인트. 비즈니스 로직은 service 에 위임합니다."""
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse

from .schemas import (
    ExtractOutlineRequest,
    ExtractOutlineResponse,
    ExtractionStatusResponse,
    ScanDocumentRequest,
    ScanDocumentResponse,
    ScaffoldDocumentRequest,
    ScaffoldDocumentResponse,
    UploadResponse,
)
from .service import extraction_service, resolve_uploaded_file

router = APIRouter()


@router.post("/outline", response_model=ExtractOutlineResponse)
async def extract_document_outline(req: ExtractOutlineRequest):
    """문서의 계층적 아웃라인과 세부 엘리먼트를 추출(또는 캐시 로드)합니다."""
    result = await extraction_service.extract_document_outline(
        req.filename, force_refresh=req.force_refresh
    )
    return ExtractOutlineResponse(**result)


@router.get("/outline/{filename}", response_model=ExtractOutlineResponse)
async def get_document_outline(filename: str):
    """스토리지에 저장된 문서 아웃라인 패키지를 조회합니다."""
    result = extraction_service.get_document_outline(filename)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Outline not found for: {filename}")
    return ExtractOutlineResponse(**result)


@router.post("/upload", response_model=UploadResponse)
async def upload_reference_document(file: UploadFile = File(...)):
    """Phase 1: 참고 문서를 업로드하고 후속 파이프라인 메타를 돌려받습니다."""
    return UploadResponse(**await extraction_service.register_upload(file))


@router.post("/scan", response_model=ScanDocumentResponse)
async def scan_document_segments(req: ScanDocumentRequest):
    """Phase 2: 업로드된 문서에서 표/목록/섹션 바운딩 박스를 추출합니다."""
    return ScanDocumentResponse(**await extraction_service.scan_document_segments(req.filename))


@router.post("/scaffold", response_model=ScaffoldDocumentResponse)
async def extract_scaffold_wireframe(req: ScaffoldDocumentRequest):
    """Phase 3: PDF 문서로부터 Tiptap 스캐폴딩(HTML & Markdown)을 추출합니다."""
    return ScaffoldDocumentResponse(**await extraction_service.extract_scaffold(req.filename))


@router.get("/status/{job_id}", response_model=ExtractionStatusResponse)
async def get_extraction_status(job_id: str):
    """추출 파이프라인의 진행 상태를 조회합니다."""
    return ExtractionStatusResponse(**await extraction_service.get_extraction_status(job_id))


@router.get("/files/{filename}")
async def get_uploaded_file(filename: str):
    """프런트엔드가 렌더링할 업로드 파일을 서빙합니다."""
    return FileResponse(resolve_uploaded_file(filename))
