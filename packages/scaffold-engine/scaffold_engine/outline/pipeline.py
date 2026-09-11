"""Scaffold Engine — Outline Extraction Pipeline (V2 Cognitive Layout Decomposition).

PyMuPDF 기반 3중 멀티모달 컨텍스트와 보편적 인지 분해 원칙을 적용하여,
한국형 서식 표 및 문서 구조를 1-Stage로 전수 추출하는 고정밀 독립 엔진입니다.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from scaffold_engine.contracts.provenance import EngineProvenance, hash_file, hash_text
from scaffold_engine.harness import (
    DEFAULT_MODEL,
    BaseLlmHarness,
    HarnessFactory,
    LlmExecutionResult,
)
from scaffold_engine.outline.prompts import SYSTEM_INSTRUCTIONS_PATH
from scaffold_engine.outline.prompts.context_builder import DocumentContextBuilder
from scaffold_engine.outline.schemas.models import (
    OutlineDocument,
    OutlineItem,
    OutlineOutput,
)

logger = logging.getLogger(__name__)

DEFAULT_SCHEMA_PATH = Path(__file__).resolve().parent / "schemas" / "outline_schema.json"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class OutlinePipeline:
    """PDF 시각 기하 + 원문 텍스트 융합 멀티모달 1-Stage 아웃라인 추출 파이프라인 (V2 정식)."""

    def __init__(
        self,
        harness: Optional[BaseLlmHarness] = None,
        schema_path: Optional[Path] = None,
        system_instructions_path: Optional[Path] = None,
        default_model: str = DEFAULT_MODEL,
        default_effort: Optional[str] = None,
        timeout_seconds: int = 180,
        context_dir: Optional[Path] = None,
    ) -> None:
        # 파생물을 어디에 둘지는 호스트가 정한다. 엔진이 입력 파일 옆에 쓰면
        # 호스트의 업로드 디렉터리를 오염시키고, 호스트 비의존 계약이 깨진다.
        # 기본값은 "아무 데도 쓰지 않는다" 다.
        self.context_dir = Path(context_dir) if context_dir else None
        self.default_model = default_model
        self.default_effort = default_effort
        self.harness = harness or HarnessFactory.create(
            model=default_model, effort=default_effort, timeout_seconds=timeout_seconds
        )
        self.context_builder = DocumentContextBuilder()
        self.schema_path = schema_path or DEFAULT_SCHEMA_PATH
        self.system_instructions_path = system_instructions_path or SYSTEM_INSTRUCTIONS_PATH

    def run(
        self,
        pdf_path: Union[str, Path],
        model: Optional[str] = None,
        effort: Optional[str] = None,
        context_dir: Optional[Path] = None,
    ) -> OutlineDocument:
        """본 프로젝트 서비스 레이어용 표준 진입점 (OutlineDocument 반환)."""
        res = self.execute(
            pdf_path=pdf_path, model=model, effort=effort, context_dir=context_dir
        )
        if res.get("document") and isinstance(res["document"], OutlineDocument):
            return res["document"]
        return res["fallback_document"]

    def execute(
        self,
        pdf_path: Union[str, Path],
        model: Optional[str] = None,
        effort: Optional[str] = None,
        context_dir: Optional[Path] = None,
    ) -> Dict[str, Any]:
        """실험실(V2 벤치마크) 및 CLI 호환 진입점."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일이 존재하지 않습니다: {pdf_path}")

        target_model = model or self.default_model
        target_effort = effort or self.default_effort

        logger.info("[OutlinePipeline] V2 실행 시작: %s (model: %s, effort: %s)", pdf_path.name, target_model, target_effort)

        # 1. 시스템 프롬프트 지침 로드
        instructions = ""
        if self.system_instructions_path.exists():
            instructions = self.system_instructions_path.read_text(encoding="utf-8")

        # 2. 3중 멀티모달 컨텍스트 추출 및 파일 영속화 (.context.md / .elements.json)
        ctx_started_at = _utc_now_iso()
        t0 = time.time()
        target_context_dir = Path(context_dir) if context_dir else self.context_dir
        doc_ctx = self.context_builder.build_context(pdf_path, output_dir=target_context_dir)
        ctx_duration = round(time.time() - t0, 3)
        ctx_ended_at = _utc_now_iso()

        # 3. 통합 프롬프트 빌드 (파일 참조 및 최적화 지침)
        ctx_file_info = f"- 로컬 컨텍스트 파일: {doc_ctx.get('context_file_path')}\n" if doc_ctx.get("context_file_path") else ""
        prompt = (
            f"{instructions}\n\n"
            f"======================================================================\n"
            f"[분석 대상 문서 정보]\n"
            f"- 대상 파일: {doc_ctx['filename']}\n"
            f"- 총 페이지: {doc_ctx['total_pages']}페이지\n"
            f"{ctx_file_info}\n"
            f"[추출된 멀티모달 기하 및 원문 텍스트 컨텍스트]\n"
            f"{doc_ctx['context_text']}\n"
            f"======================================================================\n\n"
            f"위 문서의 시각적 레이아웃과 텍스트 정보를 종합 분석하여, 지정된 JSON Schema에 맞추어 계층적 목차(Outline Tree, L1~L4)와 각 구획별 컴포넌트 분류(classify: header, key_value, table, list, paragraph, media) 및 실측 기입값(elements)을 1-Stage로 빠짐없이 전수 추출하십시오.\n"
            f"특히 한국형 서식 표(Table)는 내부의 헤더 및 세부 필드명(대학, 학과(부), 학년, 학번 등)까지 L4 단계까지 전수 분해하여 목차 트리로 구성하고, 각 필드 노드의 elements에 실제 기입된 값을 매핑하십시오."
        )

        # 4. CLI / LLM 네이티브 구조화 실행
        llm_started_at = _utc_now_iso()
        llm_t0 = time.time()
        exec_res: LlmExecutionResult = self.harness.run_structured(
            prompt=prompt,
            schema_path=self.schema_path,
            model=target_model,
            effort=target_effort,
        )
        llm_duration = round(time.time() - llm_t0, 3)
        llm_ended_at = _utc_now_iso()
        actual_model = exec_res.model or target_model

        context_chars = len(doc_ctx.get("context_text", ""))

        # `steps` 는 호스트 트레이서가 Span 으로 그대로 복원하는 실측 구간 목록이다.
        # 엔진은 tracer 를 import 하지 않고 순수 dict 만 방출한다(P1 유지).
        # 사후에 Span 을 만들면 start==end 가 되어 duration 이 0 이 되므로,
        # 잰 시각을 여기서 반드시 함께 실어 보낸다.
        steps: List[Dict[str, Any]] = [
            {
                "name": "DocumentContextBuilder",
                "run_type": "tool",
                "start_time": ctx_started_at,
                "end_time": ctx_ended_at,
                "duration_seconds": ctx_duration,
                "inputs": {"filename": pdf_path.name, "total_pages": doc_ctx.get("total_pages", 1)},
                "outputs": {"context_chars": context_chars},
                "status": "SUCCESS",
            },
            {
                "name": f"LLM:{actual_model}",
                "run_type": "llm",
                "start_time": llm_started_at,
                "end_time": llm_ended_at,
                # 프로세스 기동까지 포함한 실제 벽시계 시간. CLI 가 자기 기준으로 보고한
                # 값은 metadata 에 따로 남겨 둔다(둘의 차이가 곧 기동 오버헤드다).
                "duration_seconds": llm_duration,
                "inputs": {"prompt_chars": len(prompt), "prompt_snippet": prompt[:300]},
                "metadata": {
                    **(getattr(exec_res, "telemetry_metadata", None) or {}),
                    "cli_reported_duration": exec_res.duration_seconds,
                },
                "tokens": {
                    "input": exec_res.input_tokens,
                    "output": exec_res.output_tokens,
                    "thinking": exec_res.thinking_tokens,
                    "cache_read": exec_res.cache_read_tokens,
                    "total": exec_res.total_tokens,
                },
                "status": exec_res.status,
                "error": exec_res.error,
            },
        ]

        # 이 dict 형태가 호스트 감사 로그(`app.core.llm.telemetry`)의 입력 규격이다.
        # 키를 바꾸면 `documents/service.py` 의 매핑도 함께 고쳐야 한다.
        telemetry = {
            "model": actual_model,
            "ctx_duration": ctx_duration,
            "cli_duration": exec_res.duration_seconds,
            "tokens": {
                "input": exec_res.input_tokens,
                "output": exec_res.output_tokens,
                "thinking": exec_res.thinking_tokens,
                "cache_read": exec_res.cache_read_tokens,
                "total": exec_res.total_tokens,
            },
            "status": exec_res.status,
            "error": exec_res.error,
            "total_pages": doc_ctx.get("total_pages", 1),
            "context_chars": context_chars,
            "prompt_snippet": prompt[:300],
            "telemetry_metadata": getattr(exec_res, "telemetry_metadata", {}),
            "steps": steps,
            # 산출물을 재현·비교하려면 "무엇이 만들었는가"가 결과와 함께 남아야 한다.
            "provenance": EngineProvenance(
                pipeline="outline",
                model=actual_model,
                effort=target_effort,
                prompt_hash=hash_text(instructions) if instructions else None,
                schema_hash=hash_file(self.schema_path),
            ).to_dict(),
        }

        if exec_res.status != "SUCCESS" or not exec_res.structured_output:
            logger.error("[OutlinePipeline] LLM 실행 실패 (%s): %s", exec_res.status, exec_res.error)
            fallback_doc = self._create_fallback_document(pdf_path, doc_ctx["total_pages"], telemetry)
            return {
                "success": False,
                "status": exec_res.status,
                "error": exec_res.error or "No structured output returned",
                "telemetry": telemetry,
                "fallback_document": fallback_doc,
            }

        # 5. 스키마 유효성 검증 및 표준화
        raw_output = exec_res.structured_output
        val_started_at = _utc_now_iso()
        val_t0 = time.time()
        try:
            validated = OutlineOutput.model_validate(raw_output)
            val_error = None
        except Exception as ve:
            validated, val_error = None, str(ve)
        steps.append({
            "name": "OutlineSchemaValidation",
            "run_type": "parser",
            "start_time": val_started_at,
            "end_time": _utc_now_iso(),
            "duration_seconds": round(time.time() - val_t0, 3),
            "status": "SUCCESS" if val_error is None else "FAILED",
            "error": val_error,
        })

        if validated is None:
            logger.warning("[OutlinePipeline] Pydantic 역직렬화 실패 (%s)", val_error)
            telemetry["status"] = "ERROR"
            telemetry["error"] = f"OUTLINE_SCHEMA_INVALID: {val_error}"
            telemetry["telemetry_metadata"]["failure_code"] = "INVALID_MODEL_OUTPUT"
            return {
                "success": False,
                "status": "ERROR",
                "error": telemetry["error"],
                "fallback_document": self._create_fallback_document(
                    pdf_path, doc_ctx["total_pages"], telemetry
                ),
                "telemetry": telemetry,
            }

        try:
            document = OutlineDocument.from_outline_output(validated, telemetry=telemetry)
            if not document.flat_elements:
                telemetry["status"] = "ERROR"
                telemetry["error"] = "OUTLINE_CONTENT_EMPTY: 문서 구성요소가 하나도 추출되지 않았습니다."
                telemetry["telemetry_metadata"]["failure_code"] = "INVALID_MODEL_OUTPUT"
                steps.append({
                    "name": "OutlineSemanticValidation",
                    "run_type": "parser",
                    "start_time": _utc_now_iso(),
                    "end_time": _utc_now_iso(),
                    "duration_seconds": 0,
                    "status": "FAILED",
                    "error": telemetry["error"],
                })
                return {
                    "success": False,
                    "status": "ERROR",
                    "error": telemetry["error"],
                    "fallback_document": self._create_fallback_document(
                        pdf_path, doc_ctx["total_pages"], telemetry
                    ),
                    "telemetry": telemetry,
                }
            logger.info(
                "[OutlinePipeline] 성공: 루트 노드 %d건, 엘리먼트 %d건 (시간: %ss)",
                len(document.outlines),
                len(document.flat_elements),
                round(ctx_duration + exec_res.duration_seconds, 2),
            )
            return {
                "success": True,
                "document_title": pdf_path.name,
                "data": validated.model_dump(by_alias=True),
                "document": document,
                "telemetry": telemetry,
            }
        except Exception as ve:
            logger.warning("[OutlinePipeline] 문서 표준화 실패 (%s)", ve)
            telemetry["status"] = "ERROR"
            telemetry["error"] = f"OUTLINE_NORMALIZATION_FAILED: {ve}"
            telemetry["telemetry_metadata"]["failure_code"] = "INVALID_MODEL_OUTPUT"
            return {
                "success": False,
                "status": "ERROR",
                "error": telemetry["error"],
                "fallback_document": self._create_fallback_document(
                    pdf_path, doc_ctx["total_pages"], telemetry
                ),
                "telemetry": telemetry,
            }

    def _create_fallback_document(
        self, pdf_path: Path, total_pages: int, telemetry: Dict[str, Any]
    ) -> OutlineDocument:
        root = OutlineItem(
            id="out-root",
            level=1,
            title=pdf_path.name,
            page=1,
            box_2d=[50, 50, 950, 950],
            purpose="문서 전체 (폴백)",
            elements=[],
            children=[],
        )
        return OutlineDocument(
            document_title=pdf_path.name,
            total_pages=total_pages,
            outlines=[root],
            markdown_outline=f"- **{pdf_path.name}** (p.1)",
            flat_elements=[],
            telemetry=telemetry,
        )

    def _lenient_recover(
        self,
        raw_json: Dict[str, Any],
        filename: str,
        total_pages: int,
        telemetry: Dict[str, Any],
    ) -> OutlineDocument:
        outlines_data = raw_json.get("outlines") or []
        items: List[OutlineItem] = []
        for idx, it in enumerate(outlines_data):
            if isinstance(it, dict):
                items.append(
                    OutlineItem(
                        id=it.get("id") or f"out-{idx+1}",
                        level=it.get("level", 1),
                        title=it.get("title") or f"섹션 {idx+1}",
                        page=it.get("page", 1),
                        box_2d=it.get("box_2d"),
                        purpose=it.get("purpose"),
                        elements=[],
                        children=[],
                    )
                )
        if not items:
            return self._create_fallback_document(Path(filename), total_pages, telemetry)

        output = OutlineOutput(
            document_title=raw_json.get("document_title") or filename,
            total_pages=raw_json.get("total_pages") or total_pages,
            outlines=items,
        )
        return OutlineDocument.from_outline_output(output, telemetry=telemetry)


# 별칭 지원
OutlineExtractionStep = OutlinePipeline
