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
from agent_telemetry import SpanPhase, SpanStatus, SpanType, StepCollector

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

        collector = StepCollector(
            pipeline_name="OutlinePipeline",
            domain="documents",
            workflow_name="documents.extract_outline",
            workflow_label="문서 목차 추출",
            target_name=target_display_name,
        )

        # 1. 시스템 프롬프트 지침 로드
        instructions = ""
        if self.system_instructions_path.exists():
            instructions = self.system_instructions_path.read_text(encoding="utf-8")

        # 2. 3중 멀티모달 컨텍스트 추출 및 파일 영속화
        target_context_dir = Path(context_dir) if context_dir else self.context_dir
        with collector.step(
            "DocumentContextBuilder",
            span_type=SpanType.TOOL,
            phase=SpanPhase.PRE_LLM,
            display_label="문서 기하 및 원문 텍스트 실측",
            description="PDF 원본에서 표 구조, 폰트 크기 및 본문 텍스트 전문을 추출합니다.",
            data_in=target_display_name,
            data_via=["context_builder.py (DocumentContextBuilder.build_context)"],
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
            s_ctx.set_inputs({"filename": target_display_name, "total_pages": pages_cnt, "resolved_path": resolved_file_path})
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

        # 3. 통합 프롬프트 빌드
        ctx_file_info = f"- 로컬 컨텍스트 파일: {doc_ctx.get('context_file_path')}\n" if doc_ctx.get("context_file_path") else ""
        with collector.step(
            "PromptAssembly",
            span_type=SpanType.CHAIN,
            phase=SpanPhase.PRE_LLM,
            display_label="맞춤 프롬프트 및 메타데이터 조립",
            description="시스템 지침, 실측 컨텍스트, 대상 문서 메타데이터를 결합합니다.",
            data_in="DocumentContext + Instructions",
            data_via=["pipeline.py (OutlinePipeline.execute)"],
        ) as s_prompt:
            prompt = (
                f"{instructions}\n\n"
                f"======================================================================\n"
                f"[분석 대상 원본 문서]\n"
                f"- 파일명: {doc_ctx['filename']}\n"
                f"- 원본 파일 경로: {resolved_file_path}\n"
                f"- 총 페이지: {doc_ctx['total_pages']}페이지\n"
                f"{ctx_file_info}\n"
                f"[중요 지침: 3중 멀티모달 컨텍스트 활용]\n"
                f"1. [시각적 비전 (PDF 직접 열람)]: 반드시 위 원본 파일 경로('{resolved_file_path}')의 문서를 직접 열람(view/inspect)하여, 전반적인 시각 레이아웃(여백, 밑줄, 박스 테두리, 심미적 위계, 표 내부 구획 및 차수 구분)을 확인하세요.\n"
                f"2. [실측 표(Table) 구조 메타 & 타이포그래피]: 아래 제공된 각 페이지별 실측 표 규격(행x열, 위치)과 폰트 크기 블록을 바탕으로 상위 대주제와 부모 표 구획의 경계를 파악하세요.\n"
                f"3. [원문 텍스트 전문 (Raw Text Flow)]: 좌표 숫자 노이즈 없이 연속된 문장 흐름이 보존된 깨끗한 원문 텍스트를 읽고, 항목명과 세부 라벨의 정확한 명칭을 오타나 누락 없이 파악하세요.\n\n"
                f"[추출된 멀티모달 기하 및 원문 텍스트 컨텍스트]\n"
                f"{doc_ctx['context_text']}\n"
                f"======================================================================\n\n"
                f"위 문서의 시각적 레이아웃과 텍스트 정보를 종합 분석하여, 지정된 JSON Schema에 맞추어 계층적 목차(Outline Tree, L1~L4)와 각 구획별 컴포넌트 분류(classify: header, key_value, table, list, paragraph, media) 및 실측 기입값(elements)을 1-Stage로 빠짐없이 전수 추출하십시오.\n"
                f"특히 한국형 서식 표(Table)는 내부의 헤더 및 세부 필드명(대학, 학과(부), 학년, 학번 등)까지 L4 단계까지 전수 분해하여 목차 트리로 구성하고, 각 필드 노드의 elements에 실제 기입된 값을 매핑하십시오.\n"
                f"좌표(box_2d) 지정 시, 목차 노드는 해당 라벨/헤더 텍스트 영역을, elements는 내용/본문 리스트/입력값/영수증 부착란 전체 사각 영역을 정확히 감싸도록 역할에 맞게 정밀 지정하십시오."
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

        # 4. CLI / LLM 네이티브 구조화 실행
        actual_model = target_model
        with collector.step(
            f"LLM:{target_model}",
            span_type=SpanType.LLM,
            phase=SpanPhase.LLM,
            display_label=f"{target_model} 목차 구조 추론",
            description="실제 LLM 모델에 프롬프트를 전송하고 구조화된 목차 JSON 응답을 수신합니다.",
            data_in=f"Prompt String ({len(prompt):,}자)",
            data_via=[f"{self.harness.__class__.__name__}.run_structured", f"Engine: {target_model}"],
        ) as s_llm:
            exec_res: LlmExecutionResult = self.harness.run_structured(
                prompt=prompt,
                schema_path=self.schema_path,
                model=target_model,
                effort=target_effort,
                file_path=pdf_path,
            )
            actual_model = exec_res.model or target_model
            s_llm.attach_harness_result(exec_res)

            # CLI 또는 Direct API 체계에 따른 실제 실행 명령어 추출 및 조립
            tel_meta = getattr(exec_res, "telemetry_metadata", {})
            raw_command = tel_meta.get("raw_command")
            if not raw_command and "command" in tel_meta:
                c_list = tel_meta["command"]
                raw_command = " ".join(f'"{c}"' if " " in str(c) else str(c) for c in c_list) if isinstance(c_list, list) else str(c_list)
            if not raw_command:
                prov = getattr(exec_res, "provider", "agy_cli")
                if "api" in str(prov).lower():
                    clean_m = re.sub(r"-(low|medium|high)$", "", actual_model)
                    raw_command = (
                        f'curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/{clean_m}:generateContent?key=$GOOGLE_API_KEY" \\\n'
                        f'  -H "Content-Type: application/json" \\\n'
                        f'  -d \'{{"generationConfig": {{"responseMimeType": "application/json", "responseSchema": "<{self.schema_path.name}>"}}, "contents": [{{"role": "user", "parts": [{{"inlineData": {{"mimeType": "application/pdf", "data": "<BASE64_PDF: {target_display_name}>"}}}}, {{"text": "<PROMPT_STRING ({len(prompt)} chars)>"}}]}}]}}\''
                    )
                else:
                    effort_arg = f" --effort {target_effort}" if target_effort else ""
                    raw_command = (
                        f'agy --model {actual_model}{effort_arg} --input-format stream-json --output-format stream-json '
                        f'--dangerously-skip-permissions --disable-slash-commands --json-schema "{self.schema_path}"'
                    )

            s_llm.set_inputs({
                "execution_command": raw_command,
                "target_model": actual_model,
                "provider": getattr(exec_res, "provider", "agy_cli"),
                "effort": target_effort or "default",
                "schema_file": str(self.schema_path),
                "attached_document": target_display_name,
                "prompt_chars": len(prompt),
                "prompt": prompt,
            })
            s_llm.set_outputs({
                "has_structured_output": bool(exec_res.structured_output),
                "tokens": {
                    "input": exec_res.input_tokens,
                    "output": exec_res.output_tokens,
                    "thinking": exec_res.thinking_tokens or 0,
                    "total": exec_res.total_tokens,
                },
                "duration_seconds": exec_res.duration_seconds,
                "raw_response": exec_res.raw_response or "",
                "structured_output": exec_res.structured_output,
            })
            harness_chain = [f"{self.harness.__class__.__name__}.run_structured"]
            if getattr(exec_res, "provider", None):
                harness_chain.append(f"Adapter: {exec_res.provider}")
            harness_chain.append(f"Model: {actual_model}")
            s_llm.set_label(
                display_label=f"{actual_model} 목차 구조 추론",
                summary_pill=f"입력 {exec_res.input_tokens:,}tok ➔ 출력 {exec_res.output_tokens:,}tok",
                data_out="Structured JSON (Raw Response)",
                data_via=harness_chain,
            )

        provenance_dict = EngineProvenance(
            pipeline="outline",
            model=actual_model,
            effort=target_effort,
            prompt_hash=hash_text(instructions) if instructions else None,
            schema_hash=hash_file(self.schema_path),
        ).to_dict()

        # 기존 레거시 steps 호환 리스트 구성
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
                "data_via": sp.data_via,
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

        telemetry = {
            "model": actual_model,
            "ctx_duration": round(collector.spans[0].usage.latency_ms / 1000, 3) if collector.spans else 0.0,
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
            "prompt": prompt,
            "telemetry_metadata": getattr(exec_res, "telemetry_metadata", {}),
            "steps": legacy_steps,
            "provenance": provenance_dict,
            "pipeline_telemetry": collector.export_telemetry(provenance=provenance_dict).model_dump(mode="json"),
        }

        if exec_res.status != "SUCCESS" or not exec_res.structured_output:
            logger.error("[OutlinePipeline] LLM 실행 실패 (%s): %s", exec_res.status, exec_res.error)
            fallback_doc = self._create_fallback_document(
                pdf_path, doc_ctx["total_pages"], telemetry, display_name=target_display_name
            )
            return {
                "success": False,
                "status": exec_res.status,
                "error": exec_res.error or "No structured output returned",
                "telemetry": telemetry,
                "fallback_document": fallback_doc,
            }

        # 5. 스키마 유효성 검증 및 표준화
        raw_output = exec_res.structured_output
        with collector.step(
            "OutlineSchemaValidation",
            span_type=SpanType.PARSER,
            phase=SpanPhase.POST_LLM,
            display_label="AI 응답 스키마 및 무결성 검증",
            description="모델이 생성한 구조화 출력을 Pydantic 스키마 및 목차 계층 트리로 파싱하고 검증합니다.",
            data_in="Structured JSON (Raw Response)",
            data_via=["schema.py (OutlineOutput.model_validate)", "models.py (OutlineDocument.from_outline_output)"],
        ) as s_val:
            s_val.set_inputs({
                "target_model": actual_model,
                "schema_definition": Path(self.schema_path).name if self.schema_path else "outline_schema.json",
                "raw_output": raw_output,
            })
            try:
                validated = OutlineOutput.model_validate(raw_output)
                val_error = None

                def _count_elems(items):
                    c = 0
                    for it in items:
                        c += len(it.elements or [])
                        if it.children:
                            c += _count_elems(it.children)
                    return c

                total_elems = _count_elems(validated.outlines)
                s_val.set_outputs({
                    "is_valid": True,
                    "outlines_count": len(validated.outlines),
                    "total_elements": total_elems,
                    "validated_tree": [n.model_dump(mode="json") for n in validated.outlines],
                })
                s_val.set_label(
                    summary_pill=f"목차 노드 {len(validated.outlines)}건 · 요소 {total_elems}개 무결성 통과",
                    data_out=f"OutlineDocument (outlines: {len(validated.outlines)}건)",
                    data_via=["schema.py (OutlineOutput.model_validate)", "models.py (OutlineDocument.from_outline_output)"],
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
            except Exception as ve:
                validated, val_error = None, str(ve)
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
                "fallback_document": self._create_fallback_document(
                    pdf_path, doc_ctx["total_pages"], telemetry, display_name=target_display_name
                ),
                "telemetry": telemetry,
            }

        try:
            document = OutlineDocument.from_outline_output(validated, telemetry=telemetry)
            if (not document.document_title or document.document_title == "source.pdf") and target_display_name:
                document.document_title = target_display_name

            if not document.flat_elements:
                telemetry["status"] = "ERROR"
                telemetry["error"] = "OUTLINE_CONTENT_EMPTY: 문서 구성요소가 하나도 추출되지 않았습니다."
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
                    "fallback_document": self._create_fallback_document(
                        pdf_path, doc_ctx["total_pages"], telemetry, display_name=target_display_name
                    ),
                    "telemetry": telemetry,
                }
            logger.info(
                "[OutlinePipeline] 성공: 루트 노드 %d건, 엘리먼트 %d건 (시간: %ss)",
                len(document.outlines),
                len(document.flat_elements),
                round(telemetry["ctx_duration"] + exec_res.duration_seconds, 2),
            )
            telemetry["pipeline_telemetry"] = collector.export_telemetry(provenance=provenance_dict).model_dump(mode="json")
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
                "fallback_document": self._create_fallback_document(
                    pdf_path, doc_ctx["total_pages"], telemetry, display_name=target_display_name
                ),
                "telemetry": telemetry,
            }

    def _create_fallback_document(
        self,
        pdf_path: Path,
        total_pages: int,
        telemetry: Dict[str, Any],
        display_name: Optional[str] = None,
    ) -> OutlineDocument:
        title_name = display_name or pdf_path.name
        root = OutlineItem(
            id="out-root",
            level=1,
            title=title_name,
            page=1,
            box_2d=[50, 50, 950, 950],
            purpose="문서 전체 (폴백)",
            elements=[],
            children=[],
        )
        return OutlineDocument(
            document_title=title_name,
            total_pages=total_pages,
            outlines=[root],
            markdown_outline=f"- **{title_name}** (p.1)",
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
            return self._create_fallback_document(
                Path(filename), total_pages, telemetry, display_name=filename
            )

        output = OutlineOutput(
            document_title=raw_json.get("document_title") or filename,
            total_pages=raw_json.get("total_pages") or total_pages,
            outlines=items,
        )
        return OutlineDocument.from_outline_output(output, telemetry=telemetry)


# 별칭 지원
OutlineExtractionStep = OutlinePipeline
