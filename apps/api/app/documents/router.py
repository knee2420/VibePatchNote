"""documents 도메인 엔드포인트. 비즈니스 로직은 use_cases 에 위임합니다."""
from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse

from app.bootstrap.container import Container
from app.core.config import settings

from .schemas import (
    AgreementDecision,
    AgreementView,
    DocumentArtifactsResponse,
    DocumentSummary,
    ExtractOutlineRequest,
    ExtractOutlineResponse,
    RunAccepted,
    RunResponse,
    ScaffoldDocumentRequest,
    ScaffoldDocumentResponse,
    ScanDocumentRequest,
    ScanDocumentResponse,
    SegmentsUpdate,
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


# --- 일반 경로 ---------------------------------------------------------------


@router.post("/upload", response_model=UploadResponse)
@inject
async def upload_reference_document(
    file: UploadFile = File(...), service: DocumentServiceDep = None
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
    """산출물 이력과 현재 채택본(HEAD)."""
    try:
        return DocumentArtifactsResponse(**service.list_artifacts(doc_id))
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


@router.get("/{doc_id}/outline", response_model=ExtractOutlineResponse)
@inject
async def get_adopted_outline(doc_id: str, service: DocumentServiceDep):
    """채택된 아웃라인을 읽습니다. LLM 을 호출하지 않습니다.

    패널을 다시 열었다는 이유로 분석이 다시 돌면 안 되므로, 읽기와 실행을
    엔드포인트부터 나눕니다.
    """
    try:
        result = service.load_adopted_outline(doc_id)
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc
    if result is None:
        raise HTTPException(status_code=404, detail="No adopted outline artifact")
    return ExtractOutlineResponse(**result)


@router.get("/{doc_id}/segments", response_model=ScanDocumentResponse)
@inject
async def get_adopted_segments(doc_id: str, service: DocumentServiceDep):
    """채택된 세그먼트를 읽습니다. 아직 없으면 빈 목록을 돌려줍니다."""
    try:
        result = service.load_adopted_segments(doc_id)
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc
    return ScanDocumentResponse(**result)


@router.put("/{doc_id}/segments", response_model=ScanDocumentResponse)
@inject
async def save_edited_segments(
    doc_id: str, req: SegmentsUpdate, service: DocumentServiceDep
):
    """사용자가 손으로 고친 세그먼트를 새 아티팩트로 남깁니다.

    사람이 고친 값은 파생물이 아니라 저작물입니다. 노드에 사본으로 두면 재분석 때
    조용히 사라지므로, 아티팩트로 쌓고 채택본을 옮깁니다.
    """
    try:
        payload = [item.model_dump() for item in req.segments]
        return ScanDocumentResponse(**service.save_edited_segments(doc_id, payload))
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
async def delete_document(doc_id: str, service: DocumentServiceDep):
    """문서와 그 문서에서 파생된 모든 것(아티팩트·캐시·스캐폴드·트레이스)을 지웁니다."""
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


# --- Agent 경로 --------------------------------------------------------------


@router.post("/scan", response_model=ScanDocumentResponse)
@inject
async def scan_document_segments(req: ScanDocumentRequest, service: DocumentServiceDep):
    """문서에서 표/목록/섹션 바운딩 박스를 추출합니다."""
    try:
        doc_id = service.resolve_doc_id(req.doc_id, req.filename)
        return ScanDocumentResponse(**await service.scan_document_segments(doc_id))
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


@router.post("/scan/runs", response_model=RunAccepted, status_code=202)
@inject
async def start_document_scan(req: ScanDocumentRequest, service: DocumentServiceDep):
    try:
        doc_id = service.resolve_doc_id(req.doc_id, req.filename)
        return RunAccepted(**await service.start_document_scan(doc_id))
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


@router.post("/outline", response_model=ExtractOutlineResponse)
@inject
async def extract_document_outline(req: ExtractOutlineRequest, service: DocumentServiceDep):
    """계층 아웃라인과 세부 엘리먼트를 추출(또는 채택본 로드)합니다."""
    try:
        doc_id = service.resolve_doc_id(req.doc_id, req.filename)
        result = await service.extract_document_outline(
            doc_id, force_refresh=req.force_refresh
        )
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc

    response = ExtractOutlineResponse(**result)
    if response.status == "failed":
        error = response.error
        status_code = 503 if error and error.retryable else 424
        return JSONResponse(status_code=status_code, content=response.model_dump(by_alias=True))
    return response


@router.post("/outline/runs", response_model=RunAccepted, status_code=202)
@inject
async def start_document_outline(req: ExtractOutlineRequest, service: DocumentServiceDep):
    try:
        doc_id = service.resolve_doc_id(req.doc_id, req.filename)
        return RunAccepted(**await service.start_document_outline(doc_id, req.force_refresh))
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


@router.post("/scaffold", response_model=ScaffoldDocumentResponse)
@inject
async def extract_scaffold_wireframe(
    req: ScaffoldDocumentRequest, service: DocumentServiceDep
):
    """PDF 문서로부터 Tiptap 스캐폴딩(HTML & Markdown)을 추출합니다."""
    try:
        doc_id = service.resolve_doc_id(req.doc_id, req.filename)
        return ScaffoldDocumentResponse(**await service.extract_scaffold(doc_id))
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


@router.post("/scaffold/runs", response_model=RunAccepted, status_code=202)
@inject
async def start_scaffold_wireframe(
    req: ScaffoldDocumentRequest, service: DocumentServiceDep
):
    try:
        doc_id = service.resolve_doc_id(req.doc_id, req.filename)
        return RunAccepted(**await service.start_scaffold(doc_id))
    except (ValueError, FileNotFoundError, OSError) as exc:
        raise _document_http_error(exc) from exc


# --- 실행 상태 ---------------------------------------------------------------


@router.get("/runs/{run_id}", response_model=RunResponse)
@inject
async def get_run(run_id: str, service: DocumentServiceDep):
    result = service.get_run(run_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Agent run was not found")
    return RunResponse(**result)


@router.post("/runs/{run_id}/resume", response_model=RunAccepted, status_code=202)
@inject
async def resume_run(run_id: str, service: DocumentServiceDep):
    """끊기거나 보류된 실행을 입력 스냅샷으로 이어서 실행합니다."""
    result = await service.resume_run(run_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Agent run was not found")
    return RunAccepted(**result)


@router.get("/outline/runs/{run_id}", response_model=RunResponse, deprecated=True)
@inject
async def get_outline_run(run_id: str, service: DocumentServiceDep):
    """(과도기) 아웃라인 전용 실행 조회. 새 클라이언트는 `/runs/{run_id}` 를 씁니다."""
    result = service.get_run(run_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Agent run was not found")
    return RunResponse(**result)


# --- 사용자 동의 -------------------------------------------------------------


@router.get("/agreements/pending", response_model=list[AgreementView])
@inject
async def list_pending_agreements(service: DocumentServiceDep):
    """사람의 결정을 기다리는 항목. 재시작을 넘어 살아남습니다."""
    return [AgreementView(**item) for item in service.list_pending_agreements()]


@router.post("/agreements/{agreement_id}", response_model=AgreementView)
@inject
async def decide_agreement(
    agreement_id: str, decision: AgreementDecision, service: DocumentServiceDep
):
    result = service.decide_agreement(agreement_id, decision.approved)
    if result is None:
        raise HTTPException(status_code=404, detail="Agreement was not found")
    return AgreementView(**result)
