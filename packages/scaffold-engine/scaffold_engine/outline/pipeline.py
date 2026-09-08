"""Scaffold Engine — Outline Extraction Pipeline (V2 Cognitive Layout Decomposition).

PyMuPDF 기반 3중 멀티모달 컨텍스트와 보편적 인지 분해 원칙을 적용하여,
한국형 서식 표 및 문서 구조를 1-Stage로 전수 추출하는 고정밀 독립 엔진입니다.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
import time
from typing import Any, Dict, List, Optional, Union

from scaffold_engine.harness.agy_client import DEFAULT_MODEL, AgyHarness, CLIExecutionResult
from scaffold_engine.outline.context_builder import DocumentContextBuilder
from scaffold_engine.outline.models import (
    ElementItem,
    OutlineDocument,
    OutlineNode,
    OutlineOutput,
)

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
DEFAULT_SCHEMA_PATH = PROMPTS_DIR / "outline_schema.json"
DEFAULT_INSTRUCTIONS_PATH = PROMPTS_DIR / "system_instructions.md"


class OutlinePipeline:
    """PDF 시각 기하 + 원문 텍스트 융합 멀티모달 1-Stage 아웃라인 추출 파이프라인."""

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        effort: str = "low",
        timeout_seconds: int = 180,
        schema_path: Optional[Path] = None,
        instructions_path: Optional[Path] = None,
        harness: Optional[AgyHarness] = None,
    ) -> None:
        self.model = model
        self.effort = effort
        self.harness = harness or AgyHarness(
            model=model, effort=effort, timeout_seconds=timeout_seconds
        )
        self.context_builder = DocumentContextBuilder()
        self.schema_path = schema_path or DEFAULT_SCHEMA_PATH
        self.instructions_path = instructions_path or DEFAULT_INSTRUCTIONS_PATH

    def run(
        self,
        pdf_path: Union[str, Path],
        model: Optional[str] = None,
        effort: Optional[str] = None,
    ) -> OutlineDocument:
        """PDF를 분석하여 완성된 계층 목차와 5대 엘리먼트가 바인딩된 OutlineDocument 반환."""
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일을 찾을 수 없습니다: {pdf_path}")

        logger.info("[OutlinePipeline] V2 분석 시작: %s (모델: %s)", pdf_path.name, model or self.model)

        # 1. 시스템 프롬프트 지침 로드
        instructions = ""
        if self.instructions_path.exists():
            instructions = self.instructions_path.read_text(encoding="utf-8")

        # 2. 3중 멀티모달 컨텍스트 추출 (표 기하 + 타이포그래피 블록 + 원문 텍스트 흐름)
        t0 = time.time()
        doc_ctx = self.context_builder.build_context(pdf_path)
        ctx_duration = round(time.time() - t0, 3)

        # 3. 통합 프롬프트 빌드
        prompt = (
            f"{instructions}\n\n"
            f"======================================================================\n"
            f"[분석 대상 문서 정보]\n"
            f"- 대상 파일 경로: {doc_ctx['resolved_path']}\n"
            f"- 파일명: {doc_ctx['filename']}\n"
            f"- 총 페이지: {doc_ctx['total_pages']}페이지\n\n"
            f"[추출된 멀티모달 기하 및 원문 텍스트 컨텍스트]\n"
            f"{doc_ctx['context_text']}\n"
            f"======================================================================\n\n"
            f"위 문서의 시각적 레이아웃과 텍스트 정보를 종합 분석하여, 지정된 JSON Schema에 맞추어 계층적 목차(Outline Tree, L1~L4)와 각 구획별 컴포넌트 분류(classify: header, key_value, table, list, paragraph, media) 및 실측 기입값(elements)을 1-Stage로 빠짐없이 전수 추출하십시오.\n"
            f"특히 한국형 서식 표(Table)는 내부의 헤더 및 세부 필드명(대학, 학과(부), 학년, 학번 등)까지 L4 단계까지 전수 분해하여 목차 트리로 구성하고, 각 필드 노드의 elements에 실제 기입된 값을 매핑하십시오."
        )

        # 4. CLI 네이티브 구조화 실행
        exec_res: CLIExecutionResult = self.harness.run_structured(
            prompt=prompt,
            schema_path=self.schema_path,
            model=model or self.model,
            effort=effort or self.effort,
        )

        telemetry = {
            "ctx_duration": ctx_duration,
            "cli_duration": exec_res.duration_seconds,
            "tokens": {
                "input": exec_res.input_tokens,
                "output": exec_res.output_tokens,
                "thinking": exec_res.thinking_tokens,
                "total": exec_res.total_tokens,
            },
            "status": exec_res.status,
        }

        if exec_res.status != "SUCCESS" or not exec_res.structured_output:
            logger.warning("[OutlinePipeline] CLI 구조화 출력 회수 실패 (%s): %s", exec_res.status, exec_res.error)
            return self._fallback_outline(pdf_path, doc_ctx["total_pages"], telemetry)

        # 5. 스키마 파싱 및 도메인 모델 생성
        raw_output = exec_res.structured_output
        try:
            parsed = OutlineOutput.model_validate(raw_output)
            document = OutlineDocument.from_outline_output(parsed, telemetry=telemetry)
            logger.info(
                "[OutlinePipeline] V2 추출 성공: 루트 목차 %d건, 평면 엘리먼트 %d건 (소요: %ss)",
                len(document.outlines),
                len(document.flat_elements),
                round(ctx_duration + exec_res.duration_seconds, 2),
            )
            return document
        except Exception as ve:
            logger.warning("[OutlinePipeline] Pydantic 검증 실패 (%s) — 관대 복구 시도", ve)
            return self._lenient_parse(raw_output, pdf_path.name, doc_ctx["total_pages"], telemetry)

    def _fallback_outline(
        self, pdf_path: Path, total_pages: int, telemetry: Dict[str, Any]
    ) -> OutlineDocument:
        """실패 시 안전 폴백 루트 아웃라인 노드 반환."""
        root = OutlineNode(
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

    def _lenient_parse(
        self,
        raw_json: Dict[str, Any],
        filename: str,
        total_pages: int,
        telemetry: Dict[str, Any],
    ) -> OutlineDocument:
        """구조가 일부 어긋나더라도 유연하게 아웃라인을 복구합니다."""
        outlines_data = raw_json.get("outlines") or []
        nodes: List[OutlineNode] = []
        for idx, item in enumerate(outlines_data):
            if isinstance(item, dict):
                nodes.append(
                    OutlineNode(
                        id=item.get("id") or f"out-{idx+1}",
                        level=item.get("level", 1),
                        title=item.get("title") or f"섹션 {idx+1}",
                        page=item.get("page", 1),
                        box_2d=item.get("box_2d"),
                        purpose=item.get("purpose"),
                        elements=[],
                        children=[],
                    )
                )
        if not nodes:
            return self._fallback_outline(Path(filename), total_pages, telemetry)

        output = OutlineOutput(
            document_title=raw_json.get("document_title") or filename,
            total_pages=raw_json.get("total_pages") or total_pages,
            outlines=nodes,
        )
        return OutlineDocument.from_outline_output(output, telemetry=telemetry)
