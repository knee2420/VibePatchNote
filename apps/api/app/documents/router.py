"""documents 도메인 엔드포인트. 비즈니스 로직은 use_cases에 위임합니다."""
from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.bootstrap.container import Container
from app.core.config import settings

from .schemas import (
    DocumentArtifactsResponse,
    DocumentSummary,
    UploadResponse,
)
from .service import DocumentService

router = APIRouter()

DocumentServiceDep = Annotated[
    DocumentService,
    Depends(Provide[Container.document_service]),
]


def _document_http_error(exc: Exception) -> HTTPException:
    if isinstance(exc, ValueError):
        return HTTPException(status_code=400, detail=str(exc))
    if isinstance(exc, FileNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    return HTTPException(status_code=500, detail="Document storage operation failed")


def _file_url(doc_id: str) -> str:
    return f"{settings.public_base_url}/api/v1/documents/{doc_id}/file"


# --- 문서 파일 CRUD -----------------------------------------------------------


@router.post("/upload", response_model=UploadResponse)
@inject
async def upload_reference_document(
    service: DocumentServiceDep, file: UploadFile = File(...)
):
    """참고 문서를 업로드하고 문서 식별자를 돌려받습니다."""
    try:
        meta = service.register_upload(file.filename or "", await file.read())
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc

    return UploadResponse(
        status="completed",
        doc_id=meta.doc_id,
        message="Reference document uploaded successfully.",
        title=meta.original_name,
        file_url=_file_url(meta.doc_id),
    )


@router.get("", response_model=list[DocumentSummary])
@inject
async def list_documents(service: DocumentServiceDep):
    """등록된 문서 목록. 고아 데이터 판정의 기준점입니다."""
    return [DocumentSummary(**item) for item in service.list_documents()]


@router.get("/{doc_id}/file")
@inject
async def get_document_file(doc_id: str, service: DocumentServiceDep):
    """프런트엔드가 렌더링할 원본 파일을 서빙합니다."""
    try:
        path, meta = service.get_file_by_id(doc_id)
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc
    return FileResponse(path, filename=meta.original_name, media_type=meta.mime or None)

@router.get("/{doc_id}/artifacts", response_model=DocumentArtifactsResponse)
@inject
async def list_document_artifacts(doc_id: str, service: DocumentServiceDep):
    """문서의 산출물 이력과 현재 채택본(HEAD)."""
    try:
        return DocumentArtifactsResponse(**service.list_artifacts(doc_id))
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
async def delete_document(doc_id: str, service: DocumentServiceDep):
    """문서와 그 문서에서 파생된 모든 것(아티팩트·캐시·서식 틀·트레이스)을 지웁니다."""
    try:
        service.delete_document(doc_id)
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


@router.get("/files/{filename}", deprecated=True)
@inject
async def get_uploaded_file_by_name(filename: str, service: DocumentServiceDep):
    """(과도기) 파일명으로 원본을 서빙합니다. 새 클라이언트는 `/{doc_id}/file` 을 씁니다."""
    try:
        path, meta = service.get_file_by_name(filename)
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc
    return FileResponse(path, filename=meta.original_name, media_type=meta.mime or None)
