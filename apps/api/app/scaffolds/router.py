"""scaffolds 도메인의 FastAPI 라우터."""
import mimetypes
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from .schemas import (
    ScaffoldArchiveDetail,
    ScaffoldArchiveMeta,
    ScaffoldRenderUpdate,
)
from .service import scaffold_archive_service

router = APIRouter()


@router.get("/{scaffold_id}", response_model=ScaffoldArchiveDetail)
async def get_archive_detail(scaffold_id: str):
    """단일 스캐폴드 아카이브의 메타데이터와 HTML/마크다운 상세를 조회합니다."""
    archive = scaffold_archive_service.get_archive(scaffold_id)
    if not archive:
        raise HTTPException(status_code=404, detail="스캐폴드 아카이브를 찾을 수 없습니다.")
    return archive


@router.put("/{scaffold_id}/render", response_model=ScaffoldArchiveMeta)
async def save_archive_render(scaffold_id: str, payload: ScaffoldRenderUpdate):
    """캔버스에서 편집된 서식 작업본을 아카이브에 저장합니다.

    엔진 원본은 보존되고 작업본만 갱신되며, 리비전이 1 올라갑니다.
    """
    meta = scaffold_archive_service.update_render(
        scaffold_id=scaffold_id,
        html_content=payload.html_content,
        markdown_content=payload.markdown_content,
    )
    if not meta:
        raise HTTPException(status_code=404, detail="스캐폴드 아카이브를 찾을 수 없습니다.")
    return meta


@router.post("/{scaffold_id}/render/image", response_model=ScaffoldArchiveMeta)
async def save_archive_render_image(scaffold_id: str, file: UploadFile = File(...)):
    """재구성된 서식 화면의 스냅샷 PNG 를 아카이브에 보관합니다."""
    if file.content_type not in ("image/png", "application/octet-stream"):
        raise HTTPException(status_code=415, detail="PNG 이미지만 보관할 수 있습니다.")

    png_bytes = await file.read()
    if not png_bytes:
        raise HTTPException(status_code=400, detail="빈 이미지입니다.")

    meta = scaffold_archive_service.update_render_image(scaffold_id, png_bytes)
    if not meta:
        raise HTTPException(status_code=404, detail="스캐폴드 아카이브를 찾을 수 없습니다.")
    return meta


@router.get("/{scaffold_id}/assets/{asset_subpath:path}")
async def get_archive_asset(scaffold_id: str, asset_subpath: str):
    """
    스캐폴드 아카이브에 보관된 에셋 파일(비전 PNG 이미지, 마크다운 명세, HTML 등)을 반환합니다.
    """
    file_path = scaffold_archive_service.get_asset_file(scaffold_id, asset_subpath)
    if not file_path:
        raise HTTPException(status_code=404, detail="요청한 에셋 파일을 찾을 수 없습니다.")

    content_type, _ = mimetypes.guess_type(str(file_path))
    if not content_type:
        if file_path.suffix == ".md":
            content_type = "text/markdown; charset=utf-8"
        elif file_path.suffix == ".html":
            content_type = "text/html; charset=utf-8"
        else:
            content_type = "application/octet-stream"

    return FileResponse(path=file_path, media_type=content_type, filename=file_path.name)
