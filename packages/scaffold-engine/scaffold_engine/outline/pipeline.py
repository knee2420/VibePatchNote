"""Scaffold Engine — Outline Extraction Pipeline (V2 Cognitive Layout Decomposition).

PyMuPDF 기반 3중 멀티모달 컨텍스트와 보편적 인지 분해 원칙을 적용하여,
한국형 서식 표 및 문서 구조를 1-Stage로 전수 추출하는 고정밀 독립 엔진입니다.

파이프라인 단계 구조:
    1. 전처리·실측 및 프롬프트 조립   ->  2. LLM 구조화 추론   ->  3. 후처리·파싱 및 표준화  ->  4. 품질검증
    preprocess/                       inference/                postprocess/                 evaluate/
    (context_builder, prompt_assembler) (agent)                 (parser)                     (validator)
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from agent_telemetry import (
    SpanPhase,
    SpanStatus,
    SpanType,
    StepCollector,
    current_collector,
    model_source,
    source_of,
)

from scaffold_engine.contracts import LlmHarness
from scaffold_engine.contracts.provenance import EngineProvenance, hash_file, hash_text

from .evaluate.validator import OutlineValidator
from .inference.agent import OutlineInferencer
from .postprocess.parser import OutlineResponseParser
from .preprocess.context_builder import DocumentContextBuilder
from .preprocess.prompt_assembler import (
    SYSTEM_INSTRUCTIONS_PATH,
    OutlinePromptAssembler,
)
from .schemas.models import (
    OutlineDocument,
    OutlineItem,
    OutlineOutput,
)

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "default"
DEFAULT_SCHEMA_PATH = Path(__file__).resolve().parent / "schemas" / "outline_schema.json"


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class OutlinePipeline:
    """PDF 시각 기하 + 원문 텍스트 융합 멀티모달 1-Stage 아웃라인 추출 파이프라인 (V2 정식)."""

    def __init__(
        self,
        harness: Optional[LlmHarness] = None,
        schema_path: Optional[Path] = None,
        system_instructions_path: Optional[Path] = None,
        default_model: str = DEFAULT_MODEL,
        default_effort: Optional[str] = None,
        timeout_seconds: int = 180,
        context_dir: Optional[Path] = None,
    ) -> None:
        if harness is None:
            raise ValueError("OutlinePipeline에 LlmHarness 인스턴스를 반드시 주입해야 합니다.")
        self.context_dir = Path(context_dir) if context_dir else None
        self.default_model = default_model
        self.default_effort = default_effort
        self.harness = harness
        self.schema_path = schema_path or DEFAULT_SCHEMA_PATH
        self.system_instructions_path = system_instructions_path or SYSTEM_INSTRUCTIONS_PATH

        # 4단계 파이프라인 컴포넌트 초기화
        self.context_builder = DocumentContextBuilder()
        self.prompt_assembler = OutlinePromptAssembler(self.system_instructions_path)
        self.inferencer = OutlineInferencer(self.harness)
        self.parser = OutlineResponseParser()
        self.validator = OutlineValidator()

        # 마지막 실행의 계측 결과 (호스트 관측 계약)
        self.last_telemetry: Optional[Any] = None

    def run(
        self,
        pdf_path: Union[str, Path],
        model: Optional[str] = None,
        effort: Optional[str] = None,
        context_dir: Optional[Path] = None,
        display_name: Optional[str] = None,
    ) -> OutlineDocument:
        """본 프로젝트 서비스 레이어용 표준 진입점 (OutlineDocument 반환)."""
        res = self.execute(
            pdf_path=pdf_path,
            model=model,
            effort=effort,
            context_dir=context_dir,
            display_name=display_name,
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
        display_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """실험실(V2 벤치마크) 및 CLI 호환 진입점."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일이 존재하지 않습니다: {pdf_path}")

        target_model = model or self.default_model
        target_effort = effort or self.default_effort
        target_display_name = display_name or pdf_path.name

        logger.info(
            "[OutlinePipeline] V2 실행 시작: %s (model: %s, effort: %s)",
            target_display_name,
            target_model,
            target_effort,
        )

        collector = (
            current_collector()
            or StepCollector(
                pipeline_name="OutlinePipeline",
                domain="documents",
                workflow_name="documents.extract_outline",
                workflow_label="문서 목차 추출",
                target_name=target_display_name,
            )
        )

        # 1. 시스템 프롬프트 지침 로드
        instructions = self.prompt_assembler.load_instructions()

        # 2. [Stage 1-A: 전처리] 3중 멀티모달 컨텍스트 추출 및 파일 영속화
        target_context_dir = Path(context_dir) if context_dir else self.context_dir
        with collector.step(
            "DocumentContextBuilder",
            span_type=SpanType.TOOL,
            phase=SpanPhase.PRE_LLM,
            display_label="문서 기하 및 원문 텍스트 실측",
            description="PDF 원본에서 표 구조, 폰트 크기 및 본문 텍스트 전문을 추출합니다.",
            data_in=target_display_name,
            sources=[source_of(DocumentContextBuilder.build_context)],
        ) as s_ctx:
            try:
                doc_ctx = self.context_builder.build_context(
                    pdf_path, output_dir=target_context_dir, display_name=target_display_name
                )
            except TypeError:
                doc_ctx = self.context_builder.build_context(
                    pdf_path, output_dir=target_context_dir
                )
            context_chars = len(doc_ctx.get("context_text", ""))
            pages_cnt = doc_ctx.get("total_pages", 1)
            resolved_file_path = doc_ctx.get("resolved_path") or str(pdf_path.resolve())
            s_ctx.set_inputs({
                "filename": target_display_name,
                "total_pages": pages_cnt,
                "resolved_path": resolved_file_path,
            })
            s_ctx.set_outputs({
                "context_chars": context_chars,
                "total_pages": pages_cnt,
                "context_text": doc_ctx.get("context_text", ""),
                "pages_meta": doc_ctx.get("pages_meta", []),
            })
            s_ctx.set_label(
                summary_pill=f"{pages_cnt}페이지 · 텍스트 {context_chars:,}자 실측",
                data_out=f"DocumentContext ({context_chars:,}자)",
            )
            s_ctx.snapshot(
                stage_id="context_build",
                stage_name="문서 컨텍스트 빌드",
                payload={
                    "filename": target_display_name,
                    "total_pages": pages_cnt,
                    "context_chars": context_chars,
                    "context_file_path": doc_ctx.get("context_file_path"),
                },
            )

        # 3. [Stage 1-B: 전처리] 통합 프롬프트 빌드
        with collector.step(
            "PromptAssembly",
            span_type=SpanType.CHAIN,
            phase=SpanPhase.PRE_LLM,
            display_label="맞춤 프롬프트 및 메타데이터 조립",
            description="시스템 지침, 실측 컨텍스트, 대상 문서 메타데이터를 결합합니다.",
            data_in="DocumentContext + Instructions",
            sources=[source_of(OutlinePromptAssembler.assemble)],
        ) as s_prompt:
            prompt = self.prompt_assembler.assemble(
                instructions=instructions,
                doc_ctx=doc_ctx,
                target_display_name=target_display_name,
                resolved_file_path=resolved_file_path,
            )
            s_prompt.set_inputs({
                "target_document": target_display_name,
                "instructions_chars": len(instructions),
                "dynamic_context_chars": context_chars,
                "instructions": instructions,
                "dynamic_context": doc_ctx.get("context_text", ""),
            })
            s_prompt.set_outputs({"total_prompt_chars": len(prompt), "prompt": prompt})
            s_prompt.set_label(
                summary_pill=f"프롬프트 {len(prompt):,}자 구성",
                data_out=f"Prompt String ({len(prompt):,}자)",
            )
            s_prompt.snapshot(
                stage_id="prompt_assembly",
                stage_name="프롬프트 역분해 조립",
                payload={
                    "constitution_chars": len(instructions),
                    "dynamic_context_chars": context_chars,
                    "total_prompt_chars": len(prompt),
                },
            )

        # 4. [Stage 2: LLM 추론] 구조화 목차 인지 실행
        actual_model = target_model
        with collector.step(
            "LlmInference",
            span_type=SpanType.LLM,
            phase=SpanPhase.LLM,
            display_label=f"{target_model} 목차 구조 추론",
            description="실제 LLM 모델에 프롬프트를 전송하고 구조화된 목차 JSON 응답을 수신합니다.",
            data_in=f"Prompt String ({len(prompt):,}자)",
            sources=[
                source_of(type(self.harness).run_structured),
                model_source(target_model),
            ],
        ) as s_llm:
            exec_res = self.inferencer.infer(
                prompt=prompt,
                schema_path=self.schema_path,
                pdf_path=pdf_path,
                model=target_model,
                effort=target_effort,
            )
            actual_model = exec_res.model or target_model
            s_llm.attach_harness_result(exec_res)

            actual_provider = getattr(exec_res, "provider", "agy_cli")
            raw_command = OutlineInferencer.build_raw_command(
                exec_res=exec_res,
                actual_model=actual_model,
                actual_provider=actual_provider,
                target_effort=target_effort,
                schema_path=self.schema_path,
                target_display_name=target_display_name,
                prompt_len=len(prompt),
            )

            s_llm.set_inputs({
                "execution_command": raw_command,
                "target_model": actual_model,
                "provider": actual_provider,
                "effort": target_effort or "default",
                "schema_file": str(self.schema_path),
                "attached_document": target_display_name,
                "prompt_chars": len(prompt),
                "prompt": prompt,
            })
            s_llm.set_outputs({
                "has_structured_output": bool(getattr(exec_res, "structured_output", None)),
                "tokens": {
                    "input": getattr(exec_res, "input_tokens", 0) or 0,
                    "output": getattr(exec_res, "output_tokens", 0) or 0,
                    "thinking": getattr(exec_res, "thinking_tokens", 0) or 0,
                    "total": getattr(exec_res, "total_tokens", 0) or 0,
                },
                "duration_seconds": getattr(exec_res, "duration_seconds", 0.0) or 0.0,
                "raw_response": getattr(exec_res, "raw_response", "") or "",
                "structured_output": getattr(exec_res, "structured_output", None),
            })
            s_llm.set_sources(
                type(self.harness).run_structured,
                model_source(actual_model),
                replace=True,
            )
            s_llm.set_label(
                display_label=f"{actual_model} 목차 구조 추론",
                summary_pill=f"입력 {exec_res.input_tokens:,}tok ➔ 출력 {exec_res.output_tokens:,}tok",
                data_out="Structured JSON (Raw Response)",
            )

        provenance_dict = EngineProvenance(
            pipeline="outline",
            model=actual_model,
            effort=target_effort,
            prompt_hash=hash_text(instructions) if instructions else None,
            schema_hash=hash_file(self.schema_path),
        ).to_dict()

        legacy_steps: List[Dict[str, Any]] = [
            {
                "name": sp.name,
                "run_type": sp.span_type.value,
                "start_time": sp.start_time.isoformat(),
                "end_time": sp.end_time.isoformat() if sp.end_time else None,
                "duration_seconds": round(sp.usage.latency_ms / 1000, 3),
                "inputs": sp.inputs,
                "outputs": sp.outputs or {},
                "data_in": sp.data_in,
                "data_out": sp.data_out,
                "sources": [src.model_dump(mode="json") for src in sp.sources],
                "status": sp.status.value.upper(),
                "error": sp.error.message if sp.error else None,
                "tokens": {
                    "input": sp.usage.prompt_tokens,
                    "output": sp.usage.completion_tokens,
                    "thinking": sp.usage.reasoning_tokens or 0,
                    "total": sp.usage.total_tokens,
                },
                "metadata": sp.metadata.extra,
            }
            for sp in collector.spans
        ]

        pipeline_tel = collector.export_telemetry(provenance=provenance_dict)
        self.last_telemetry = pipeline_tel
        telemetry = {
            "model": actual_model,
            "ctx_duration": round(collector.spans[0].usage.latency_ms / 1000, 3) if collector.spans else 0.0,
            "cli_duration": getattr(exec_res, "duration_seconds", 0.0) or 0.0,
            "tokens": {
                "input": getattr(exec_res, "input_tokens", 0) or 0,
                "output": getattr(exec_res, "output_tokens", 0) or 0,
                "thinking": getattr(exec_res, "thinking_tokens", 0) or 0,
                "cache_read": getattr(exec_res, "cache_read_tokens", 0) or 0,
                "total": getattr(exec_res, "total_tokens", 0) or 0,
            },
            "status": getattr(exec_res, "status", "SUCCESS"),
            "error": getattr(exec_res, "error", None),
            "total_pages": doc_ctx.get("total_pages", 1),
            "context_chars": context_chars,
            "prompt": prompt,
            "telemetry_metadata": getattr(exec_res, "telemetry_metadata", {}),
            "steps": legacy_steps,
            "provenance": provenance_dict,
            "pipeline_telemetry": pipeline_tel.model_dump(mode="json"),
        }

        if exec_res.status != "SUCCESS" or not exec_res.structured_output:
            logger.error("[OutlinePipeline] LLM 실행 실패 (%s): %s", exec_res.status, exec_res.error)
            fallback_doc = self.parser.create_fallback_document(
                pdf_path, doc_ctx["total_pages"], telemetry, display_name=target_display_name
            )
            return {
                "success": False,
                "status": exec_res.status,
                "error": exec_res.error or "No structured output returned",
                "telemetry": telemetry,
                "fallback_document": fallback_doc,
            }

        # 5. [Stage 3: 후처리] 스키마 유효성 검증 및 표준화
        raw_output = exec_res.structured_output
        with collector.step(
            "OutlineSchemaValidation",
            span_type=SpanType.PARSER,
            phase=SpanPhase.POST_LLM,
            display_label="AI 응답 스키마 및 무결성 검증",
            description="모델이 생성한 구조화 출력을 Pydantic 스키마 및 목차 계층 트리로 파싱하고 검증합니다.",
            data_in="Structured JSON (Raw Response)",
            sources=[
                source_of(OutlineOutput),
                source_of(OutlineDocument.from_outline_output),
            ],
        ) as s_val:
            s_val.set_inputs({
                "target_model": actual_model,
                "schema_definition": Path(self.schema_path).name if self.schema_path else "outline_schema.json",
                "raw_output": raw_output,
            })
            validated, val_error = self.parser.validate_schema(raw_output)
            if validated:
                total_elems = self.parser.count_elements(validated.outlines)
                s_val.set_outputs({
                    "is_valid": True,
                    "outlines_count": len(validated.outlines),
                    "total_elements": total_elems,
                    "validated_tree": [n.model_dump(mode="json") for n in validated.outlines],
                })
                s_val.set_label(
                    summary_pill=f"목차 노드 {len(validated.outlines)}건 · 요소 {total_elems}개 무결성 통과",
                    data_out=f"OutlineDocument (outlines: {len(validated.outlines)}건)",
                )
                s_val.snapshot(
                    stage_id="structured_parsing",
                    stage_name="아웃라인 파싱 및 보정",
                    payload={
                        "outlines_count": len(validated.outlines),
                        "total_elements": total_elems,
                        "is_valid": True,
                    },
                )
            else:
                s_val.status = SpanStatus.FAILED
                s_val.set_outputs({"is_valid": False, "error": val_error})

        if validated is None:
            logger.warning("[OutlinePipeline] Pydantic 역직렬화 실패 (%s)", val_error)
            telemetry["status"] = "ERROR"
            telemetry["error"] = f"OUTLINE_SCHEMA_INVALID: {val_error}"
            telemetry["telemetry_metadata"]["failure_code"] = "INVALID_MODEL_OUTPUT"
            return {
                "success": False,
                "status": "ERROR",
                "error": telemetry["error"],
                "fallback_document": self.parser.create_fallback_document(
                    pdf_path, doc_ctx["total_pages"], telemetry, display_name=target_display_name
                ),
                "telemetry": telemetry,
            }

        try:
            document = OutlineDocument.from_outline_output(validated, telemetry=telemetry)
            if (not document.document_title or document.document_title == "source.pdf") and target_display_name:
                document.document_title = target_display_name

            # 6. [Stage 4: 품질 검증] 목차 및 엘리먼트 무결성 평가
            val_report = self.validator.validate(document)
            if not val_report.ok:
                telemetry["status"] = "ERROR"
                telemetry["error"] = f"OUTLINE_CONTENT_EMPTY: {'; '.join(val_report.warnings)}"
                telemetry["telemetry_metadata"]["failure_code"] = "INVALID_MODEL_OUTPUT"
                legacy_steps.append({
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
                    "fallback_document": self.parser.create_fallback_document(
                        pdf_path, doc_ctx["total_pages"], telemetry, display_name=target_display_name
                    ),
                    "telemetry": telemetry,
                }

            logger.info(
                "[OutlinePipeline] 성공: %s (시간: %ss)",
                val_report.summary(),
                round(telemetry["ctx_duration"] + exec_res.duration_seconds, 2),
            )
            pipeline_tel = collector.export_telemetry(provenance=provenance_dict)
            self.last_telemetry = pipeline_tel
            telemetry["pipeline_telemetry"] = pipeline_tel.model_dump(mode="json")
            document.telemetry = telemetry
            return {
                "success": True,
                "document_title": target_display_name,
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
                "fallback_document": self.parser.create_fallback_document(
                    pdf_path, doc_ctx["total_pages"], telemetry, display_name=target_display_name
                ),
                "telemetry": telemetry,
            }

    # 하위 호환성 메서드 (외부/테스트에서 직접 호출하는 경우 대비)
    def _create_fallback_document(
        self,
        pdf_path: Path,
        total_pages: int,
        telemetry: Dict[str, Any],
        display_name: Optional[str] = None,
    ) -> OutlineDocument:
        return self.parser.create_fallback_document(pdf_path, total_pages, telemetry, display_name)

    def _lenient_recover(
        self,
        raw_json: Dict[str, Any],
        filename: str,
        total_pages: int,
        telemetry: Dict[str, Any],
    ) -> OutlineDocument:
        return self.parser.lenient_recover(raw_json, filename, total_pages, telemetry)


# 별칭 지원
OutlineExtractionStep = OutlinePipeline
