"""documents 도메인 엔드포인트. 비즈니스 로직은 service 에 위임합니다."""
from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse

from .schemas import (
    ExtractOutlineRequest,
    ExtractOutlineResponse,
    ScanDocumentRequest,
    ScanDocumentResponse,
    ScaffoldDocumentRequest,
    ScaffoldDocumentResponse,
    UploadResponse,
)
from app.bootstrap.container import Container

from .service import ExtractionService, resolve_uploaded_file

router = APIRouter()

ExtractionServiceDep = Annotated[
    ExtractionService,
    Depends(Provide[Container.extraction_service]),
]


@router.post("/upload", response_model=UploadResponse)
@inject
async def upload_reference_document(file: UploadFile = File(...), service: ExtractionServiceDep = None):
    """Phase 1: 참고 문서를 업로드하고 후속 파이프라인 메타를 돌려받습니다."""
    return UploadResponse(**await service.register_upload(file))


@router.post("/scan", response_model=ScanDocumentResponse)
@inject
async def scan_document_segments(req: ScanDocumentRequest, service: ExtractionServiceDep):
    """Phase 2: 업로드된 문서에서 표/목록/섹션 바운딩 박스를 추출합니다."""
    return ScanDocumentResponse(**await service.scan_document_segments(req.filename))


@router.post("/outline", response_model=ExtractOutlineResponse)
@inject
async def extract_document_outline(req: ExtractOutlineRequest, service: ExtractionServiceDep):
    """문서의 계층적 아웃라인과 세부 엘리먼트를 추출(또는 캐시 로드)합니다."""
    result = await service.extract_document_outline(
        req.filename, force_refresh=req.force_refresh
    )
    return ExtractOutlineResponse(**result)


@router.post("/scaffold", response_model=ScaffoldDocumentResponse)
@inject
async def extract_scaffold_wireframe(req: ScaffoldDocumentRequest, service: ExtractionServiceDep):
    """Phase 3: PDF 문서로부터 Tiptap 스캐폴딩(HTML & Markdown)을 추출합니다."""
    return ScaffoldDocumentResponse(**await service.extract_scaffold(req.filename))


@router.get("/files/{filename}")
async def get_uploaded_file(filename: str):
    """프런트엔드가 렌더링할 업로드 파일을 서빙합니다."""
    return FileResponse(resolve_uploaded_file(filename))
