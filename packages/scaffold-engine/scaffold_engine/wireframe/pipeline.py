"""파이프라인 오케스트레이터 (Wireframe 트랙).

부품을 조립하기만 한다. 각 단계의 구현은 주입 가능하므로, 새 하네스나 새 조립
전략을 붙일 때 이 파일을 고칠 필요가 없다.

    A 측정(결정적)  ->  B 판정(에이전트)  ->  C 조립(결정적)  ->  D 채점
    extract/           classify/            assemble/          score/

핵심 불변식: **좌표는 A 에서만 만들어진다.** B 의 출력 스키마에는 좌표 필드가
없고, C 는 A 의 실측치만 사용한다. 그래서 문서가 바뀌어도 매핑이 어긋나지 않는다.
"""
from __future__ import annotations

import logging
import re
import time
from pathlib import Path
from typing import Any, Optional, Union

from agent_telemetry import (
    SpanPhase,
    SpanType,
    StepCollector,
    current_collector,
    model_source,
    source_of,
)

from scaffold_engine.core.interfaces import LlmHarness

from .assemble.html import HtmlAssembler
from .classify.agent import SlotClassifier
from .extract.geometry import PdfGeometryExtractor
from .schemas.models import ScaffoldExtractResult, ScaffoldMeta
from .score.fidelity import score_page

logger = logging.getLogger(__name__)

DEFAULT_MODEL_NAME = "default"


class ScannedDocumentError(RuntimeError):
    """텍스트 레이어가 없는 스캔 PDF — 이 파이프라인으로는 처리할 수 없다."""


class ScaffoldPipeline:
    """PDF -> Tiptap 스캐폴딩. 캐싱 없이 항상 실시간 분석."""

    def __init__(
        self,
        harness: Optional[LlmHarness] = None,
        model: str = DEFAULT_MODEL_NAME,
        timeout_seconds: int = 75,
    ) -> None:
        if harness is None:
            raise ValueError("ScaffoldPipeline에 LlmHarness 인스턴스를 반드시 주입해야 합니다.")
        self.harness = harness
        self.extractor = PdfGeometryExtractor()
        self.classifier = SlotClassifier(self.harness)
        self.assembler = HtmlAssembler()
        # 마지막 실행의 계측 결과. 호스트가 원장에 넣을지는 호스트가 정한다.
        self.last_telemetry: Optional[Any] = None

    def run(
        self,
        pdf_path: Union[str, Path],
        page_number: int = 1,
        display_name: Optional[str] = None,
    ) -> ScaffoldExtractResult:
        """PDF 한 페이지를 스캐폴딩으로 만든다.

        계측 결과는 `self.last_telemetry` 에 남는다. 호스트가 그것을 원장에
        넣을지는 호스트가 정한다 — 엔진은 저장 위치를 모른다.
        """
        active_col = current_collector()
        collector = active_col or StepCollector(
            pipeline_name="ScaffoldPipeline",
            domain="documents",
            workflow_name="documents.generate_scaffold",
            workflow_label="와이어프레임 생성",
            target_name=display_name or Path(pdf_path).name,
        )
        try:
            if active_col is not None:
                return self._run_traced(collector, pdf_path, page_number, display_name)
            with collector.activate():
                return self._run_traced(collector, pdf_path, page_number, display_name)
        finally:
            # 실패해도 거기까지의 단계는 남는다. 관측 도구가 가장 봐야 할 기록이다.
            exec_res = getattr(self.classifier, "last_result", None) or getattr(self.harness, "last_result", None)
            actual_model = (
                getattr(exec_res, "model", None)
                or getattr(self.harness, "model", None)
                or getattr(self.harness, "name", "unknown")
            )
            actual_provider = (
                getattr(exec_res, "telemetry_metadata", {}).get("provider")
                or getattr(self.harness, "primary_provider", None)
                or getattr(self.harness, "_primary_provider", None)
                or "google_api"
            )
            self.last_telemetry = collector.export_telemetry(
                provenance={
                    "engine": "scaffold",
                    "harness": self.harness.name,
                    "model": actual_model,
                    "provider": actual_provider,
                }
            )

    def _run_traced(
        self,
        collector: StepCollector,
        pdf_path: Union[str, Path],
        page_number: int,
        display_name: Optional[str],
    ) -> ScaffoldExtractResult:
        started = time.time()
        pdf_path = Path(pdf_path).resolve()
        target_display_name = display_name or pdf_path.name
        display_stem = Path(target_display_name).stem
        logger.info("[pipeline] 시작: %s (p%d)", target_display_name, page_number)

        # A. 측정
        with collector.step(
            "GeometryExtraction",
            span_type=SpanType.TOOL,
            phase=SpanPhase.PRE_LLM,
            display_label="PDF 기하 실측",
            description="원본 PDF에서 블록·표의 좌표와 폰트 크기를 결정적으로 측정합니다. AI를 쓰지 않습니다.",
            data_in=target_display_name,
            sources=[source_of(PdfGeometryExtractor.extract)],
        ) as s_extract:
            pages = self.extractor.extract(pdf_path)
            if not pages:
                raise ValueError(f"페이지를 읽을 수 없습니다: {target_display_name}")
            page = pages[min(max(page_number, 1), len(pages)) - 1]
            s_extract.set_inputs({
                "filename": target_display_name,
                "page_number": page_number,
                "resolved_path": str(pdf_path),
            })
            s_extract.set_outputs({
                "total_pages": len(pages),
                "doc_type": page.doc_type,
                "blocks": len(page.classifiable()),
                "tables": len(page.tables),
                "has_text_layer": page.has_text_layer,
                "blocks_summary": [
                    {
                        "id": getattr(b, "id", None) or (b.get("id") if isinstance(b, dict) else str(idx)),
                        "bbox": [round(float(c), 2) for c in (getattr(b, "bbox", None) or (b.get("bbox") if isinstance(b, dict) else []))],
                        "text": getattr(b, "text", None) or (b.get("text") if isinstance(b, dict) else ""),
                    }
                    for idx, b in enumerate(page.classifiable())
                ],
            })
            s_extract.set_label(
                summary_pill=f"{page.doc_type} · 블록 {len(page.classifiable())}개 · 표 {len(page.tables)}개",
                data_out=f"PageGeometry ({len(page.classifiable())} blocks)",
            )
            s_extract.snapshot(
                stage_id="geometry_extraction",
                stage_name="PDF 기하 실측",
                payload={
                    "filename": target_display_name,
                    "total_pages": len(pages),
                    "page_number": page_number,
                    "blocks_count": len(page.classifiable()),
                    "tables_count": len(page.tables),
                    "doc_type": page.doc_type,
                },
            )

        if not page.has_text_layer:
            raise ScannedDocumentError(
                f"'{target_display_name}' 에는 텍스트 레이어가 없습니다(스캔 이미지 PDF). "
                "이 파이프라인은 텍스트 기반 추출만 지원합니다."
            )

        # B. 판정 (유일하게 AI 가 개입하는 단계)
        with collector.step(
            "LlmInference",
            span_type=SpanType.LLM,
            phase=SpanPhase.LLM,
            display_label=f"{self.harness.name} 블록 역할 판정",
            description="실측된 블록이 제목·본문·표·입력란 중 무엇인지 모델이 판정합니다. 좌표는 만들지 않습니다.",
            data_in=f"PageGeometry ({len(page.classifiable())} blocks)",
            sources=[
                source_of(SlotClassifier.classify),
                model_source(self.harness.name),
            ],
        ) as s_classify:
            decisions = self.classifier.classify(target_display_name, page)
            classified = len(decisions.get("blocks", []))
            exec_res = getattr(self.classifier, "last_result", None) or getattr(self.harness, "last_result", None)
            actual_model = getattr(exec_res, "model", None) or getattr(self.harness, "model", self.harness.name)
            actual_provider = (
                getattr(exec_res, "telemetry_metadata", {}).get("provider")
                or getattr(self.harness, "primary_provider", None)
                or getattr(self.harness, "_primary_provider", None)
                or "google_api"
            )

            prompt = getattr(self.classifier, "last_prompt", "")

            # CLI 또는 Direct API 체계에 따른 실제 실행 명령어 추출 및 조립
            tel_meta = getattr(exec_res, "telemetry_metadata", {}) if exec_res else {}
            raw_command = tel_meta.get("raw_command")
            if not raw_command and "command" in tel_meta:
                c_list = tel_meta["command"]
                raw_command = " ".join(f'"{c}"' if " " in str(c) else str(c) for c in c_list) if isinstance(c_list, list) else str(c_list)
            if not raw_command:
                prov = actual_provider
                clean_m = re.sub(r"-(low|medium|high)$", "", actual_model)
                if "api" in str(prov).lower() or "google" in str(prov).lower():
                    raw_command = (
                        f'curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/{clean_m}:generateContent?key=$GOOGLE_API_KEY" \\\n'
                        f'  -H "Content-Type: application/json" \\\n'
                        f'  -d \'{{"generationConfig": {{"responseMimeType": "application/json", "responseSchema": "<BLOCK_CLASSIFICATION_SCHEMA>"}}, "contents": [{{"role": "user", "parts": [{{"text": "<PROMPT_STRING ({len(prompt)} chars)>"}}]}}]}}\''
                    )
                else:
                    raw_command = (
                        f'agy --model {actual_model} --input-format stream-json --output-format stream-json '
                        f'--dangerously-skip-permissions --disable-slash-commands'
                    )

            if exec_res is not None:
                s_classify.attach_harness_result(exec_res)
                s_classify.set_sources(
                    source_of(SlotClassifier.classify),
                    model_source(actual_model),
                    replace=True,
                )
                in_tok = getattr(exec_res, "input_tokens", 0) or 0
                out_tok = getattr(exec_res, "output_tokens", 0) or 0
                s_classify.set_label(
                    display_label=f"{actual_model} 블록 역할 판정",
                    summary_pill=f"입력 {in_tok:,}tok ➔ 출력 {out_tok:,}tok",
                    data_out="BlockDecisions",
                )
            else:
                s_classify.set_label(
                    summary_pill=f"{classified}개 블록 분류",
                    data_out="BlockDecisions",
                )

            s_classify.set_inputs({
                "execution_command": raw_command,
                "source_name": target_display_name,
                "candidate_blocks": len(page.classifiable()),
                "target_model": actual_model,
                "provider": actual_provider,
                "prompt_chars": len(prompt),
                "prompt": prompt,
            })
            s_classify.set_outputs({
                "classified_blocks": classified,
                "doc_title": decisions.get("doc_title"),
                "has_structured_output": bool(getattr(exec_res, "structured_output", None)) if exec_res else bool(decisions),
                "tokens": {
                    "input": getattr(exec_res, "input_tokens", 0) if exec_res else 0,
                    "output": getattr(exec_res, "output_tokens", 0) if exec_res else 0,
                    "thinking": getattr(exec_res, "thinking_tokens", 0) if exec_res else 0,
                    "total": getattr(exec_res, "total_tokens", 0) if exec_res else 0,
                },
                "duration_seconds": getattr(exec_res, "duration_seconds", 0.0) if exec_res else 0.0,
                "raw_response": getattr(exec_res, "raw_response", "") if exec_res else "",
                "structured_output": decisions,
            })
            s_classify.snapshot(
                stage_id="slot_classification",
                stage_name="블록 역할 판정",
                payload={
                    "doc_title": decisions.get("doc_title"),
                    "candidate_blocks": len(page.classifiable()),
                    "classified_blocks": classified,
                    "model": actual_model,
                    "provider": actual_provider,
                },
            )

        # C. 조립
        with collector.step(
            "ScaffoldAssembly",
            span_type=SpanType.TOOL,
            phase=SpanPhase.POST_LLM,
            display_label="와이어프레임 조립",
            description="A의 실측 좌표와 B의 판정을 합쳐 HTML·Markdown·슬롯을 만듭니다. 좌표는 A의 것만 씁니다.",
            data_in="PageGeometry + BlockDecisions",
            sources=[source_of(HtmlAssembler.assemble)],
        ) as s_assemble:
            html, markdown, slots = self.assembler.assemble(pdf_path, page, decisions)
            s_assemble.set_inputs({
                "pdf_path": str(pdf_path),
                "page_number": page_number,
                "candidate_blocks": len(page.classifiable()),
                "classified_blocks": classified,
            })
            s_assemble.set_outputs({
                "slots_count": len(slots),
                "html_chars": len(html),
                "markdown_chars": len(markdown),
                "markdown": markdown,
                "html": html,
                "slots": [s.model_dump() if hasattr(s, "model_dump") else s for s in slots],
            })
            s_assemble.set_label(
                summary_pill=f"슬롯 {len(slots)}개 · HTML {len(html):,}자",
                data_out=f"ScaffoldExtractResult (slots: {len(slots)})",
            )
            s_assemble.snapshot(
                stage_id="scaffold_assembly",
                stage_name="와이어프레임 조립",
                payload={
                    "slots_count": len(slots),
                    "html_chars": len(html),
                    "markdown_chars": len(markdown),
                },
            )

        # D. 채점
        with collector.step(
            "FidelityScoring",
            span_type=SpanType.PARSER,
            phase=SpanPhase.POST_LLM,
            display_label="원본 대비 충실도 채점",
            description="조립 결과가 원본의 내용을 빠뜨리지 않았는지 검사합니다.",
            data_in=f"ScaffoldExtractResult (slots: {len(slots)})",
            sources=[source_of(score_page)],
        ) as s_score:
            report = score_page(page, html)
            s_score.set_inputs({
                "candidate_blocks": len(page.classifiable()),
                "html_chars": len(html),
                "slots_count": len(slots),
            })
            s_score.set_outputs({
                "ok": report.ok,
                "summary": report.summary(),
                "details": getattr(report, "details", {}),
            })
            s_score.set_label(
                summary_pill=report.summary(),
                data_out="FidelityReport",
            )
        if not report.ok:
            logger.warning("[pipeline] D 채점 미달 — %s", report.summary())

        meta = ScaffoldMeta(
            id=f"scaffold-{display_stem.lower().replace(' ', '-')}",
            title=decisions.get("doc_title") or f"{display_stem} 서식 틀",
            targetDoc=display_stem,
            sourcePdfFileName=target_display_name,
            description=(
                f"원본 실측 기하 기반 와이어프레임 · {page.doc_type} · 슬롯 {len(slots)}개"
            ),
            difficulty="easy" if len(slots) <= 10 else "medium",
        )
        logger.info("[pipeline] 완료 %.2fs — %s", time.time() - started, meta.title)

        return ScaffoldExtractResult(
            meta=meta, htmlContent=html, markdownContent=markdown, slots=slots
        )
