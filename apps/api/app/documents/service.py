"""documents 도메인의 비즈니스 로직."""
import json
import logging
import shutil
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import HTTPException, UploadFile

from urllib.parse import unquote

from app.core.config import settings
from app.core.workflow.engine import NativeWorkflowEngine

from .prompts import build_segment_scan_prompt

logger = logging.getLogger(__name__)

# 분석 결과 디스크 캐시 확장자. 같은 문서를 다시 스캔할 때 재분석을 건너뜁니다.
SEGMENT_CACHE_SUFFIX = ".segments.json"

# 네이티브 워크플로우 잡 큐가 붙기 전까지 사용하는 고정 식별자.
# TODO: 워크플로우 잡 큐 도입 시 실제 잡 ID 로 교체할 것.
PLACEHOLDER_JOB_ID = "native-job-1234"


def _safe_filename(filename: Optional[str]) -> str:
    """경로 구분자를 제거해 업로드 디렉터리 밖으로 벗어나는 것을 막습니다."""
    candidate = Path(filename or "").name
    if not candidate or candidate in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid file name")
    return candidate


def save_uploaded_file(file: UploadFile) -> Path:
    """업로드된 파일을 로컬 파일시스템에 저장하고 저장 경로를 돌려줍니다."""
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
    다운로드 또는 스캔 요청된 파일의 실제 경로를 확인합니다.
    1. URL 인코딩 해제 (예: %20 -> 공백)
    2. settings.upload_dir 에서 탐색
    3. 확장자(.pdf) 누락 시 .pdf 붙여서 재탐색
    4. workbench/95.data_source 폴백 탐색
    """
    decoded = unquote(filename or "")
    safe_name = _safe_filename(decoded)
    upload_dir = settings.upload_dir.resolve()

    candidate = (upload_dir / safe_name).resolve()
    if str(candidate).startswith(str(upload_dir)) and candidate.exists():
        return candidate

    # 확장자 누락 폴백 (.pdf)
    if not candidate.suffix:
        pdf_candidate = (upload_dir / f"{safe_name}.pdf").resolve()
        if str(pdf_candidate).startswith(str(upload_dir)) and pdf_candidate.exists():
            return pdf_candidate

    # workbench/95.data_source 폴백
    source_dir = (Path(__file__).resolve().parents[3] / "workbench" / "95.data_source").resolve()
    if source_dir.exists():
        src_candidate = (source_dir / safe_name).resolve()
        if str(src_candidate).startswith(str(source_dir)) and src_candidate.exists():
            return src_candidate
        if not src_candidate.suffix:
            src_pdf = (source_dir / f"{safe_name}.pdf").resolve()
            if str(src_pdf).startswith(str(source_dir)) and src_pdf.exists():
                return src_pdf

    raise HTTPException(status_code=404, detail=f"File not found: {filename}")


def build_public_file_url(filename: str) -> str:
    """프런트엔드가 접근할 수 있는 파일 URL을 조립합니다."""
    return f"{settings.public_base_url}/api/v1/documents/files/{filename}"


class ExtractionService:
    """
    Phase 1~2 오케스트레이터.

    업로드 접수와 세그먼트 스캔을 담당하며, 실제 에이전트 실행은
    NativeWorkflowEngine 에 위임합니다. 프롬프트는 이 도메인의 `prompts.py` 가 소유합니다.
    """

    def __init__(self, workflow_engine: Optional[NativeWorkflowEngine] = None) -> None:
        self.workflow_engine = workflow_engine or NativeWorkflowEngine()

    async def register_upload(self, file: UploadFile) -> Dict[str, Any]:
        """
        Phase 1: 참고 문서를 저장하고 후속 파이프라인이 참조할 메타를 돌려줍니다.
        TODO: 저장 직후 네이티브 워크플로우 엔진을 비동기로 트리거할 것.
        """
        saved_path = save_uploaded_file(file)

        return {
            "status": "processing",
            "job_id": PLACEHOLDER_JOB_ID,
            "message": "Reference document uploaded successfully.",
            "file_url": build_public_file_url(saved_path.name),
        }

    async def get_extraction_status(self, job_id: str) -> Dict[str, Any]:
        """
        추출 파이프라인의 진행 상태를 돌려줍니다.
        TODO: 잡 큐 도입 시 job_id 로 실제 진행률을 조회할 것.
        """
        return {"status": "completed", "progress": 100}

    async def scan_document_segments(self, filename: str) -> Dict[str, Any]:
        """
        Phase 2: 업로드된 문서의 논리 영역(표/목록/섹션)을 실시간 추출합니다.
        캐싱 없이 항상 최신 프롬프트와 비전 엔진으로 새롭게 분석합니다.
        """
        file_path = resolve_uploaded_file(filename)
        logger.info("[ExtractionService] Starting fresh segment scan for %s", file_path.name)

        prompt = build_segment_scan_prompt(file_path)
        raw_result = await self.workflow_engine.execute_agent_json(prompt)

        response_data = self._to_scan_response(raw_result, file_path)
        return response_data


    # --- 내부 헬퍼 ---

    @staticmethod
    def _cache_path(file_path: Path) -> Path:
        return file_path.with_name(f"{file_path.name}{SEGMENT_CACHE_SUFFIX}")

    def _load_cached_scan(self, file_path: Path) -> Optional[Dict[str, Any]]:
        cache_file = self._cache_path(file_path)
        if not cache_file.exists():
            return None
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except (OSError, json.JSONDecodeError) as exc:
            # 캐시가 손상됐으면 무시하고 재분석합니다.
            logger.warning("Segment cache unreadable (%s): %s", cache_file.name, exc)
            return None

    def _store_cached_scan(self, file_path: Path, payload: Dict[str, Any]) -> None:
        cache_file = self._cache_path(file_path)
        try:
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except OSError as exc:
            # 캐시 저장 실패는 응답을 막을 이유가 되지 않습니다.
            logger.warning("Failed to write segment cache (%s): %s", cache_file.name, exc)

    def _to_scan_response(
        self, raw_result: Optional[Dict[str, Any]], file_path: Path
    ) -> Dict[str, Any]:
        """에이전트 원본 응답을 API 응답 형태로 정규화합니다."""
        segments = (raw_result or {}).get("segments")
        if not isinstance(segments, list) or not segments:
            return self._fallback_scan_response(file_path)

        return {
            "status": "completed",
            "document_title": (raw_result or {}).get("document_title") or file_path.name,
            "total_segments": len(segments),
            "segments": segments,
        }

    @staticmethod
    def _fallback_scan_response(file_path: Path) -> Dict[str, Any]:
        """에이전트 분석이 불가능할 때 돌려줄 최소 구조 (서버 중단 방지)."""
        logger.info("Generating fallback structural segments for %s", file_path.name)
        segments = [
            {
                "id": "seg-fb-1",
                "page": 1,
                "type": "section",
                "label": "문서 헤더 및 기본 개요",
                "box_2d": [50, 80, 180, 920],
                "content_summary": f"{file_path.name} 상단 섹션",
            },
            {
                "id": "seg-fb-2",
                "page": 1,
                "type": "table",
                "label": "핵심 내용 및 데이터 표",
                "box_2d": [200, 80, 780, 920],
                "content_summary": "주요 항목 및 상세 본문 영역",
            },
        ]
        return {
            "status": "completed",
            "document_title": file_path.name,
            "total_segments": len(segments),
            "segments": segments,
        }

    async def extract_scaffold(self, filename: str) -> Dict[str, Any]:
        """
        Phase 3: PDF 문서를 분석하여 Tiptap 스캐폴딩(HTML DOM & Markdown)을 생성합니다.
        순수 AI 엔진 패키지(`packages/scaffold-engine`)에 위임합니다.
        """
        from scaffold_engine import ScaffoldPipeline
        import asyncio

        logger.info("[ExtractionService] >>> extract_scaffold requested for filename: '%s'", filename)

        try:
            file_path = resolve_uploaded_file(filename)
            logger.info("[ExtractionService] Resolved file path: %s (exists=%s)", file_path, file_path.exists())
        except Exception as exc:
            logger.exception("[ExtractionService] Failed to resolve file for '%s': %s", filename, exc)
            raise

        try:
            pipeline = ScaffoldPipeline()
            logger.info("[ExtractionService] Starting async thread execution for ScaffoldPipeline...")
            result = await asyncio.to_thread(pipeline.run, file_path)
            logger.info("[ExtractionService] ScaffoldPipeline finished for %s, slots=%d, html_len=%d", file_path.name, len(result.slots), len(result.html_content))

            return {
                "status": "completed",
                "meta": result.meta.model_dump(by_alias=True),
                "htmlContent": result.html_content,
                "markdownContent": result.markdown_content,
                "slots": [s.model_dump(by_alias=True) for s in result.slots],
            }
        except Exception as exc:
            logger.exception("[ExtractionService] ScaffoldPipeline execution failed for %s: %s", file_path.name, exc)
            raise




extraction_service = ExtractionService()
