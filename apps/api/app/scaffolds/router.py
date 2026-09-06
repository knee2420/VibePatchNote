"""scaffolds 도메인의 FastAPI 라우터."""
import mimetypes
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from .schemas import (
    ScaffoldArchiveDetail,
    ScaffoldArchiveListResponse,
)
from .service import scaffold_archive_service

router = APIRouter()


@router.get("", response_model=ScaffoldArchiveListResponse)
async def list_archives():
    """보관된 스캐폴드 서식 목록을 최신순으로 조회합니다."""
    return scaffold_archive_service.list_archives()


@router.get("/{scaffold_id}", response_model=ScaffoldArchiveDetail)
async def get_archive_detail(scaffold_id: str):
    """단일 스캐폴드 아카이브의 메타데이터와 HTML/마크다운 상세를 조회합니다."""
    archive = scaffold_archive_service.get_archive(scaffold_id)
    if not archive:
        raise HTTPException(status_code=404, detail="스캐폴드 아카이브를 찾을 수 없습니다.")
    return archive


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
