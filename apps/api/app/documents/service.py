"""documents 도메인의 비즈니스 로직."""
import json
import logging
import shutil
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import HTTPException, UploadFile

from urllib.parse import unquote

import asyncio

from app.core.config import settings
from app.core.llm import (
    LlmExecutionResult,
    record_llm_run,
    span_context,
    trace_session,
)
from app.core.workflow.engine import NativeWorkflowEngine
from app.scaffolds.service import ScaffoldArchiveService
from scaffold_engine import OutlinePipeline, OutlineDocument, ScaffoldPipeline
from scaffold_engine.harness import BaseLlmHarness

from .experimental import build_segment_scan_prompt
from .ports import DocumentAnalysisRepository

logger = logging.getLogger(__name__)

# 분석 결과 디스크 캐시 확장자. 같은 문서를 다시 스캔할 때 재분석을 건너뜁니다.
SEGMENT_CACHE_SUFFIX = ".segments.json"

# 네이티브 워크플로우 잡 큐가 붙기 전까지 사용하는 고정 식별자.
# TODO: 워크플로우 잡 큐 도입 시 실제 잡 ID 로 교체할 것.
PLACEHOLDER_JOB_ID = "native-job-1234"


def _result_from_pipeline_telemetry(
    telemetry: Dict[str, Any], fallback_model: str
) -> LlmExecutionResult:
    """OutlinePipeline 텔레메트리 dict → 감사 로그 표준 엔벨로프.

    파이프라인은 컨텍스트 구성 시간과 LLM 시간을 나눠 담고 토큰은 `tokens` 하위에 중첩합니다.
    키 이름을 맞추는 지점은 여기 한 곳뿐입니다.
    """
    tokens = telemetry.get("tokens") or {}
    ctx_seconds = float(telemetry.get("ctx_duration", 0.0) or 0.0)
    llm_seconds = float(telemetry.get("cli_duration", 0.0) or 0.0)
    return LlmExecutionResult(
        status=telemetry.get("status") or "SUCCESS",
        model=telemetry.get("model") or fallback_model,
        duration_seconds=round(ctx_seconds + llm_seconds, 3),
        input_tokens=tokens.get("input", 0),
        output_tokens=tokens.get("output", 0),
        thinking_tokens=tokens.get("thinking", 0),
        cache_read_tokens=tokens.get("cache_read", 0),
        total_tokens=tokens.get("total", 0),
        error=telemetry.get("error"),
        telemetry_metadata={
            "ctx_duration": ctx_seconds,
            "llm_duration": llm_seconds,
        },
    )


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

    def __init__(
        self,
        workflow_engine: NativeWorkflowEngine,
        document_analysis: DocumentAnalysisRepository,
        llm_harness: BaseLlmHarness,
        scaffold_archives: ScaffoldArchiveService,
    ) -> None:
        self._workflow_engine = workflow_engine
        self._document_analysis = document_analysis
        self._llm_harness = llm_harness
        self._scaffold_archives = scaffold_archives

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

    async def scan_document_segments(self, filename: str) -> Dict[str, Any]:
        """
        Phase 2: 업로드된 문서의 논리 영역(표/목록/섹션)을 실시간 추출합니다.
        캐싱 없이 항상 최신 프롬프트와 비전 엔진으로 새롭게 분석합니다.
        """
        file_path = resolve_uploaded_file(filename)
        logger.info("[ExtractionService] Starting fresh segment scan for %s", file_path.name)

        prompt = build_segment_scan_prompt(file_path)
        raw_result = await self._workflow_engine.execute_agent_json(prompt)

        response_data = self._to_scan_response(raw_result, file_path)
        self._store_cached_scan(file_path, response_data)
        return response_data

    async def extract_document_outline(
        self, filename: str, force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        문서의 계층적 아웃라인과 세부 엘리먼트를 2-Stage 파이프라인으로 추출합니다.
        force_refresh가 False이고 스토리지에 캐시가 존재하면 즉시 반환합니다.
        """
        file_path = resolve_uploaded_file(filename)

        if not force_refresh and self._document_analysis.outline_exists(file_path.name):
            cached = self._document_analysis.load_outline(file_path.name)
            if cached:
                manifest = cached.get("manifest", {})
                # 실패 폴백 문서(purpose 에 "폴백" 포함)는 유효 캐시로 인정하지 않고 재추출
                is_fallback = any(
                    "폴백" in str(o.get("purpose", ""))
                    for o in cached.get("outlines", [])
                )
                if not is_fallback:
                    logger.info("[ExtractionService] Cached outline loaded for %s", file_path.name)
                    return {
                        "status": "completed",
                        "document_title": manifest.get("document_title", file_path.name),
                        "total_pages": manifest.get("total_pages", 1),
                        "total_outlines": manifest.get("total_outlines", 0),
                        "total_elements": manifest.get("total_elements", 0),
                        "outlines": cached.get("outlines", []),
                        "elements": cached.get("elements", []),
                        "markdown_outline": cached.get("markdown_outline", ""),
                        "manifest": manifest,
                    }

        logger.info("[ExtractionService] Running fresh OutlinePipeline (scaffold-engine) with core.llm for %s", file_path.name)
        pipeline = OutlinePipeline(harness=self._llm_harness)

        # LangSmith 스타일 Trace 세션 시작
        with trace_session(
            name="OutlineExtractionPipeline",
            inputs={"filename": file_path.name, "model": self._llm_harness.model},
            document_name=file_path.name,
        ) as trace:
            # 엔진 호출 구간은 실시간 Span 으로 잡고, 엔진이 자기 스레드 안에서 잰
            # 세부 단계(`telemetry["steps"]`)는 그 아래에 실측 시각 그대로 복원한다.
            with span_context(
                "OutlinePipeline.run",
                run_type="chain",
                inputs={"filename": file_path.name},
            ):
                doc: OutlineDocument = await asyncio.to_thread(pipeline.run, file_path)
                trace.replay_steps((doc.telemetry or {}).get("steps"))

            status_val = doc.telemetry.get("status", "SUCCESS") if doc.telemetry else "SUCCESS"
            error_val = doc.telemetry.get("error") if doc.telemetry else None

            # 성공 시에만 영구 캐시 저장 (실패/타임아웃 폴백 문서는 캐시하지 않음)
            if status_val == "SUCCESS":
                with span_context(
                    "OutlineStorage.save",
                    run_type="tool",
                    inputs={"filename": file_path.name},
                ):
                    self._document_analysis.save_outline(file_path.name, doc)
            else:
                logger.warning(
                    "[ExtractionService] Outline extraction status is %s; bypassing outline disk cache.",
                    status_val,
                )

            trace.finish(
                outputs={
                    "total_outlines": len(doc.outlines),
                    "total_elements": len(doc.flat_elements),
                },
                status=status_val,
                error=error_val,
            )

            # Audit Trail 레거시 호환
            if doc.telemetry:
                record_llm_run(
                    document_name=file_path.name,
                    task_name="outline_extraction",
                    result=_result_from_pipeline_telemetry(doc.telemetry, self._llm_harness.model),
                    extra_metadata={
                        "trace_id": trace.trace_id,
                        "total_outlines": len(doc.outlines),
                        "total_elements": len(doc.flat_elements),
                    },
                )

        return {
            # 폴백 문서를 정상 결과로 오인하지 않도록 실패를 그대로 드러낸다.
            # 스키마 계약: completed | failed
            "status": "completed" if status_val == "SUCCESS" else "failed",
            "document_title": file_path.name,
            "total_pages": doc.total_pages,
            "total_outlines": len(doc.outlines),
            "total_elements": len(doc.flat_elements),
            "outlines": [n.model_dump(by_alias=True) for n in doc.outlines],
            "elements": [e.model_dump(by_alias=True) for e in doc.flat_elements],
            "markdown_outline": doc.markdown_outline,
            "manifest": doc.telemetry,
        }

    # --- 내부 헬퍼 ---

    @staticmethod
    def _legacy_cache_path(file_path: Path) -> Path:
        return file_path.with_name(f"{file_path.name}{SEGMENT_CACHE_SUFFIX}")

    def _load_cached_scan(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """신규 통합 스토리지에서 세그먼트 캐시를 조회하며, 레거시 파일이 있으면 자동 마이그레이션합니다."""
        cached = self._document_analysis.load_segment_scan(file_path.name)
        if cached:
            return cached

        # 레거시 폴백: uploads/*.segments.json
        legacy_file = self._legacy_cache_path(file_path)
        if legacy_file.exists():
            try:
                with open(legacy_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                # 신규 스토리지로 마이그레이션
                self._document_analysis.save_segment_scan(file_path.name, data)
                logger.info("[ExtractionService] Migrated legacy segment cache to document package: %s", file_path.name)
                return data
            except Exception as exc:
                logger.warning("Legacy segment cache unreadable (%s): %s", legacy_file.name, exc)

        return None

    def _store_cached_scan(self, file_path: Path, payload: Dict[str, Any]) -> None:
        """세그먼트 캐시를 문서 패키지 전용 디렉터리(storage/documents/{slug}/segments/)에 보관합니다."""
        try:
            self._document_analysis.save_segment_scan(file_path.name, payload)
        except Exception as exc:
            logger.warning("Failed to write segment cache for %s: %s", file_path.name, exc)

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
            pipeline = ScaffoldPipeline(harness=self._llm_harness)
            logger.info("[ExtractionService] Starting async thread execution for ScaffoldPipeline...")
            result = await asyncio.to_thread(pipeline.run, file_path)
            logger.info("[ExtractionService] ScaffoldPipeline finished for %s, slots=%d, html_len=%d", file_path.name, len(result.slots), len(result.html_content))

            # --- 신규 파이프라인 인터셉트: 전용 아카이브 모듈에 파일 및 비전 오버레이 영속화 ---
            archive_meta_dict = None
            try:
                logger.info("[ExtractionService] Archiving scaffold to storage and generating vision overlay...")
                archive_meta = await asyncio.to_thread(
                    self._scaffold_archives.archive_scaffold, file_path, result
                )
                archive_meta_dict = archive_meta.model_dump(by_alias=True)
                logger.info("[ExtractionService] Archived successfully: %s", archive_meta.scaffold_id)
            except Exception as archive_err:
                logger.warning("[ExtractionService] Non-fatal archive failure: %s", archive_err, exc_info=True)

            return {
                "status": "completed",
                "meta": result.meta.model_dump(by_alias=True),
                "htmlContent": result.html_content,
                "markdownContent": result.markdown_content,
                "slots": [s.model_dump(by_alias=True) for s in result.slots],
                "archive": archive_meta_dict,
            }
        except Exception as exc:
            logger.exception("[ExtractionService] ScaffoldPipeline execution failed for %s: %s", file_path.name, exc)
            raise
