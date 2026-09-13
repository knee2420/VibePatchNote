"""wireframe 도메인의 FastAPI 라우터."""
import mimetypes
from typing import Annotated

from agent_runtime import AgentRunInput, AgentRuntime
from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.bootstrap.container import Container

from .agents import GenerateWireframeUseCase
from .schemas import (
    WireframeArchiveDetail,
    WireframeArchiveMeta,
    WireframeGenerateRequest,
    WireframeGenerateResponse,
    WireframeRenderUpdate,
)
from .service import WireframeArchiveService

router = APIRouter()

WireframeArchiveServiceDep = Annotated[
    WireframeArchiveService,
    Depends(Provide[Container.scaffold_archive_service]),
]
GenerateWireframeDep = Annotated[
    GenerateWireframeUseCase,
    Depends(Provide[Container.generate_scaffold]),
]
AgentRuntimeDep = Annotated[
    AgentRuntime,
    Depends(Provide[Container.agent_runtime]),
]


@router.post("/extract", response_model=WireframeGenerateResponse)
@inject
async def extract_wireframe(
    payload: WireframeGenerateRequest,
    generator: GenerateWireframeDep,
):
    """문서로부터 Tiptap 스캐폴딩(HTML & Markdown) 와이어프레임을 추출합니다."""
    try:
        result = await generator.execute(payload.doc_id)
        return WireframeGenerateResponse(**result)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다.")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"와이어프레임 생성 실패: {exc}")


@router.post("/runs", status_code=202)
@inject
async def start_wireframe_run(
    payload: WireframeGenerateRequest,
    generator: GenerateWireframeDep,
    runtime: AgentRuntimeDep,
) -> dict[str, str]:
    """긴 AI 서식 추출 분석을 비동기 Agent Runtime 작업으로 접수합니다."""
    run = await runtime.submit(
        generator.name,
        lambda: generator.execute(payload.doc_id),
        doc_id=payload.doc_id,
        run_input=AgentRunInput(
            use_case=generator.name,
            doc_id=payload.doc_id,
            payload={"docId": payload.doc_id},
        ),
    )
    return {"runId": run.run_id, "status": run.status}


@router.get("/{scaffold_id}", response_model=WireframeArchiveDetail)
@inject
async def get_archive_detail(scaffold_id: str, service: WireframeArchiveServiceDep):
    """단일 와이어프레임 아카이브의 메타데이터와 HTML/마크다운 상세를 조회합니다."""
    archive = service.get_archive(scaffold_id)
    if not archive:
        raise HTTPException(status_code=404, detail="와이어프레임 아카이브를 찾을 수 없습니다.")
    return archive


@router.put("/{scaffold_id}/render", response_model=WireframeArchiveMeta)
@inject
async def save_archive_render(
    scaffold_id: str,
    payload: WireframeRenderUpdate,
    service: WireframeArchiveServiceDep,
):
    """캔버스에서 편집된 서식 작업본을 아카이브에 저장합니다."""
    meta = service.update_render(
        scaffold_id=scaffold_id,
        html_content=payload.html_content,
        markdown_content=payload.markdown_content,
    )
    if not meta:
        raise HTTPException(status_code=404, detail="와이어프레임 아카이브를 찾을 수 없습니다.")
    return meta


@router.post("/{scaffold_id}/render/image", response_model=WireframeArchiveMeta)
@inject
async def save_archive_render_image(
    scaffold_id: str,
    file: UploadFile = File(...),
    service: WireframeArchiveServiceDep = None,
):
    """캔버스에서 캡처한 작업본 화면 스냅샷을 아카이브에 보관합니다."""
    png_bytes = await file.read()
    meta = service.update_render_image(scaffold_id=scaffold_id, png_bytes=png_bytes)
    if not meta:
        raise HTTPException(status_code=404, detail="와이어프레임 아카이브를 찾을 수 없습니다.")
    return meta


@router.get("/{scaffold_id}/assets/{asset_subpath:path}")
@inject
async def get_archive_asset(
    scaffold_id: str,
    asset_subpath: str,
    service: WireframeArchiveServiceDep,
):
    """아카이브 내부의 특정 정적 에셋(이미지, HTML, JSON 등)을 반환합니다."""
    file_path = service.get_asset_file(scaffold_id, asset_subpath)
    if not file_path or not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"에셋을 찾을 수 없습니다: {asset_subpath}")

    mime_type, _ = mimetypes.guess_type(str(file_path))
    return FileResponse(path=file_path, media_type=mime_type or "application/octet-stream")
