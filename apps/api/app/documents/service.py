"""documents 도메인의 비즈니스 로직."""
import shutil
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.core.workflow.engine import NativeWorkflowEngine


def _safe_filename(filename: str | None) -> str:
    """경로 구분자를 제거해 업로드 디렉터리 밖으로 벗어나는 것을 막습니다."""
    candidate = Path(filename or "").name
    if not candidate or candidate in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid file name")
    return candidate


def save_uploaded_file(file: UploadFile) -> Path:
    """
    업로드된 파일을 로컬 파일시스템에 저장하고 저장 경로를 돌려줍니다.
    """
    settings.ensure_directories()
    file_path = settings.upload_dir / _safe_filename(file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {exc}") from exc

    return file_path


def resolve_uploaded_file(filename: str) -> Path:
    """
    다운로드 요청된 파일의 실제 경로를 확인합니다.
    업로드 디렉터리를 벗어나는 요청은 거부합니다.
    """
    file_path = (settings.upload_dir / _safe_filename(filename)).resolve()

    if not str(file_path).startswith(str(settings.upload_dir.resolve())):
        raise HTTPException(status_code=400, detail="Invalid file path")
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    return file_path


def build_public_file_url(filename: str) -> str:
    """프런트엔드가 접근할 수 있는 파일 URL을 조립합니다."""
    return f"{settings.public_base_url}/api/v1/documents/files/{filename}"


class ExtractionService:
    """
    Business logic orchestrator for Phase 1 and 2, utilizing our native workflow engine.
    """

    def __init__(self) -> None:
        self.workflow_engine = NativeWorkflowEngine()

    async def process_document(self, document_text: str):
        # 1. Classify & Reverse Engineer (Phase 1)
        meta = await self.workflow_engine.execute_classification_node(document_text)

        # 2. Extract Scaffold & Schema (Phase 2)
        tree = await self.workflow_engine.execute_extraction_pipeline(document_text, meta)

        return {"meta": meta, "tree": tree}

    async def scan_document_segments(self, filename: str) -> dict:
        """
        업로드된 문서를 찾아 NativeWorkflowEngine의 세그먼트 스캔 노드를 실행합니다.
        이미 분석된 문서라면 캐시 파일(.segments.json)에서 0.001초 만에 즉시 반환합니다.
        """
        import json

        # 경로 안전성 검증
        file_path = resolve_uploaded_file(filename)
        cache_file = file_path.with_name(f"{file_path.name}.segments.json")

        # 1. 캐시 히트 (Disk Cache Hit)
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                return cached_data
            except Exception:
                pass  # 캐시 손상 시 재분석 진행

        # 2. 워크플로우 엔진 호출 (Cache Miss)
        raw_result = await self.workflow_engine.execute_segment_scan(file_path)

        segments = raw_result.get("segments", [])
        response_data = {
            "status": "completed",
            "document_title": raw_result.get("document_title", file_path.name),
            "total_segments": len(segments),
            "segments": segments,
        }

        # 3. 캐시 저장
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(response_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

        return response_data


