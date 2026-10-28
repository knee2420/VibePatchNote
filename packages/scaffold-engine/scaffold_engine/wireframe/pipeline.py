"""파이프라인 오케스트레이터 (Wireframe 트랙).

부품을 조립하기만 한다. 각 단계의 구현은 주입 가능하므로, 새 하네스나 새 조립
전략을 붙일 때 이 파일을 고칠 필요가 없다.

    1. 전처리·실측  ->  2. LLM 역할판정  ->  3. 후처리·조립  ->  4. 품질측정·채점
    preprocess/        inference/          postprocess/        evaluate/
    (extract/)         (classify/)         (assemble/)         (score/)

핵심 불변식: **좌표는 1단계(전처리)에서만 만들어진다.** 2단계 출력 스키마에는 좌표 필드가
없고, 3단계는 1단계의 실측치만 사용한다. 그래서 문서가 바뀌어도 매핑이 어긋나지 않는다.
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

from scaffold_engine.contracts import LlmHarness
from scaffold_engine.tools import PdfRasterizer

from .preprocess.extract.geometry import PdfGeometryExtractor
from .preprocess.extract.hint_builder import HintBuilder
from .inference.classify.agent import SlotClassifier
from .postprocess.assemble.html import HtmlAssembler
from .evaluate.score.fidelity import score_page
from .schemas.models import ScaffoldExtractResult, ScaffoldMeta


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
        self.rasterizer = PdfRasterizer(dpi=150)
        self.classifier = SlotClassifier(self.harness)
        self.assembler = HtmlAssembler()
        # 마지막 실행의 계측 결과. 호스트가 원장에 넣을지는 호스트가 정한다.
        self.last_telemetry: Optional[Any] = None

    def run(
        self,
        pdf_path: Union[str, Path],
        page_number: Optional[int] = None,
        display_name: Optional[str] = None,
        context_dir: Optional[Path] = None,
        page_numbers: Optional[List[int]] = None,
    ) -> ScaffoldExtractResult:
        """PDF 페이지(단일 또는 전체)를 스캐폴딩으로 만든다.

        page_number: 특정 단일 페이지만 처리하고 싶을 때 전달 (1-based).
        page_numbers: 특정 여러 페이지를 처리하고 싶을 때 전달.
        둘 다 None이면 문서의 전체 페이지를 순회 처리한다.
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
                return self._run_traced(collector, pdf_path, page_number, display_name, context_dir, page_numbers)
            with collector.activate():
                return self._run_traced(collector, pdf_path, page_number, display_name, context_dir, page_numbers)
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
        page_number: Optional[int],
        display_name: Optional[str],
        context_dir: Optional[Path] = None,
        page_numbers: Optional[List[int]] = None,
    ) -> ScaffoldExtractResult:
        started = time.time()
        pdf_path = Path(pdf_path).resolve()
        target_display_name = display_name or pdf_path.name
        display_stem = Path(target_display_name).stem

        # A. 측정
        with collector.step(
            "GeometryExtraction",
            span_type=SpanType.TOOL,
            phase=SpanPhase.PRE_LLM,
            display_label="PDF 기하 실측 & 비전 렌더링",
            description="원본 PDF에서 블록·표의 좌표와 폰트 크기를 결정적으로 측정하고, 150 DPI 고해상도 이미지를 렌더링합니다.",
            data_in=target_display_name,
            sources=[source_of(PdfGeometryExtractor.extract), source_of(PdfRasterizer.render_page)],
        ) as s_extract:
            all_pages = self.extractor.extract(pdf_path)
            if not all_pages:
                raise ValueError(f"페이지를 읽을 수 없습니다: {target_display_name}")

            # 대상 페이지 선정
            if page_number is not None:
                selected_pages = [all_pages[min(max(page_number, 1), len(all_pages)) - 1]]
            elif page_numbers is not None and len(page_numbers) > 0:
                selected_pages = [p for p in all_pages if p.page in page_numbers]
                if not selected_pages:
                    selected_pages = all_pages
            else:
                selected_pages = all_pages

            logger.info(
                "[pipeline] 시작: %s (대상 페이지: %s / 총 %d페이지)",
                target_display_name,
                [p.page for p in selected_pages],
                len(all_pages),
            )

            # 고해상도 비전 렌더링 (150 DPI) 및 정밀 기하 힌트 매트릭스 생성
            page_images = {}
            page_hints = {}
            c_dir = Path(context_dir) if context_dir else None
            if c_dir:
                c_dir.mkdir(parents=True, exist_ok=True)

            for p in selected_pages:
                img_out = c_dir / f"page_{p.page}.png" if c_dir else None
                img_info = self.rasterizer.render_page(
                    pdf_path, page_number=p.page, output_path=img_out
                )
                page_images[p.page] = img_info
                page_hints[p.page] = HintBuilder.build_hint_text(p)

            first_p = selected_pages[0]
            first_img = page_images[first_p.page]
            total_classifiable_blocks = sum(len(p.classifiable()) for p in selected_pages)

            page_image_paths = [str(page_images[p.page].image_path) for p in selected_pages if page_images.get(p.page)]

            s_extract.set_inputs({
                "filename": target_display_name,
                "page_number": first_p.page if len(selected_pages) == 1 else None,
                "target_pages": [p.page for p in selected_pages],
                "resolved_path": str(Path(pdf_path).resolve()),
            })
            s_extract.set_outputs({
                "total_pages": len(all_pages),
                "selected_pages_count": len(selected_pages),
                "target_pages": [p.page for p in selected_pages],
                "doc_type": first_p.doc_type,
                "blocks": total_classifiable_blocks,
                "tables": sum(len(p.tables) for p in selected_pages),
                "has_text_layer": all(p.has_text_layer for p in selected_pages),
                "image_paths": page_image_paths,
                "image_dpi": first_img.dpi,
                "hint_chars": sum(len(h) for h in page_hints.values()),
                "blocks_summary": [
                    {
                        "id": getattr(b, "id", None) or (b.get("id") if isinstance(b, dict) else str(idx)),
                        "bbox": [round(float(c), 2) for c in (getattr(b, "bbox", None) or (b.get("bbox") if isinstance(b, dict) else []))],
                        "text": getattr(b, "text", None) or (b.get("text") if isinstance(b, dict) else ""),
                    }
                    for idx, b in enumerate(first_p.classifiable())
                ],
            })
            s_extract.set_label(
                summary_pill=f"{len(selected_pages)}페이지 · 블록 {total_classifiable_blocks}개 · 비전 150DPI",
                data_out=f"PageGeometry ({total_classifiable_blocks} blocks) + PageImages",
            )
            s_extract.snapshot(
                stage_id="geometry_extraction",
                stage_name="PDF 기하 실측 & 비전 렌더링",
                payload={
                    "filename": target_display_name,
                    "total_pages": len(all_pages),
                    "selected_pages": [p.page for p in selected_pages],
                    "blocks_count": total_classifiable_blocks,
                    "tables_count": sum(len(p.tables) for p in selected_pages),
                    "doc_type": first_p.doc_type,
                    "image_paths": page_image_paths,
                    "image_dpi": first_img.dpi,
                    "hint_chars": sum(len(h) for h in page_hints.values()),
                },
            )

        for p in selected_pages:
            if not p.has_text_layer:
                raise ScannedDocumentError(
                    f"'{target_display_name}' (p{p.page}) 에는 텍스트 레이어가 없습니다(스캔 이미지 PDF). "
                    "이 파이프라인은 텍스트 기반 추출만 지원합니다."
                )

        # B. 판정 (비전 멀티모달 추론 단계)
        with collector.step(
            "LlmInference",
            span_type=SpanType.LLM,
            phase=SpanPhase.LLM,
            display_label=f"{self.harness.name} 블록 역할 판정 (Vision)",
            description="페이지 이미지와 정밀 기하 힌트를 멀티모달 모델이 대조하여 각 블록의 역할과 슬롯 라벨을 판정합니다.",
            data_in=f"PageGeometry ({total_classifiable_blocks} blocks) + PageImages",
            sources=[
                source_of(SlotClassifier.classify),
                model_source(self.harness.name),
            ],
        ) as s_classify:
            decisions_by_page = {}
            total_classified = 0
            last_exec_res = None
            total_input_tokens = 0
            total_output_tokens = 0
            total_thinking_tokens = 0
            total_tokens = 0
            combined_raw_response = []
            doc_title = None

            for p in selected_pages:
                p_img = page_images[p.page]
                p_hint = page_hints[p.page]
                dec = self.classifier.classify(
                    target_display_name,
                    p,
                    image_path=p_img.image_path,
                    hint_text=p_hint,
                )
                decisions_by_page[p.page] = dec
                total_classified += len(dec.get("blocks", []))
                if not doc_title and dec.get("doc_title"):
                    doc_title = dec.get("doc_title")

                exec_res = getattr(self.classifier, "last_result", None) or getattr(self.harness, "last_result", None)
                if exec_res is not None:
                    last_exec_res = exec_res
                    total_input_tokens += getattr(exec_res, "input_tokens", 0) or 0
                    total_output_tokens += getattr(exec_res, "output_tokens", 0) or 0
                    total_thinking_tokens += getattr(exec_res, "thinking_tokens", 0) or 0
                    total_tokens += getattr(exec_res, "total_tokens", 0) or 0
                    if getattr(exec_res, "raw_response", None):
                        combined_raw_response.append(f"--- Page {p.page} ---\n{exec_res.raw_response}")

            actual_model = getattr(last_exec_res, "model", None) or getattr(self.harness, "model", self.harness.name)
            actual_provider = (
                getattr(last_exec_res, "telemetry_metadata", {}).get("provider")
                or getattr(self.harness, "primary_provider", None)
                or getattr(self.harness, "_primary_provider", None)
                or "google_api"
            )
            prompt = getattr(self.classifier, "last_prompt", "")

            # CLI 또는 Direct API 실행 명령어 추출
            tel_meta = getattr(last_exec_res, "telemetry_metadata", {}) if last_exec_res else {}
            raw_command = tel_meta.get("raw_command")
            if not raw_command and "command" in tel_meta:
                c_list = tel_meta["command"]
                raw_command = " ".join(f'"{c}"' if " " in str(c) else str(c) for c in c_list) if isinstance(c_list, list) else str(c_list)
            if not raw_command:
                clean_m = re.sub(r"-(low|medium|high)$", "", actual_model)
                if "api" in str(actual_provider).lower() or "google" in str(actual_provider).lower():
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

            if last_exec_res is not None:
                if len(selected_pages) == 1:
                    s_classify.attach_harness_result(last_exec_res)
                else:
                    from agent_core.llm.base import LlmExecutionResult
                    merged_exec_res = LlmExecutionResult(
                        status="SUCCESS",
                        raw_response="\n\n".join(combined_raw_response),
                        structured_output={
                            "doc_title": doc_title or display_stem,
                            "pages": {p_no: d for p_no, d in decisions_by_page.items()},
                        },
                        input_tokens=total_input_tokens,
                        output_tokens=total_output_tokens,
                        total_tokens=total_tokens,
                        model=actual_model,
                        telemetry_metadata={"provider": actual_provider},
                    )
                    s_classify.attach_harness_result(merged_exec_res)

                s_classify.set_sources(
                    source_of(SlotClassifier.classify),
                    model_source(actual_model),
                    replace=True,
                )
                in_tok = total_input_tokens or getattr(last_exec_res, "input_tokens", 0) or 0
                out_tok = total_output_tokens or getattr(last_exec_res, "output_tokens", 0) or 0
                s_classify.set_label(
                    display_label=f"{actual_model} 블록 역할 판정 ({len(selected_pages)}p)",
                    summary_pill=f"입력 {in_tok:,}tok ➔ 출력 {out_tok:,}tok",
                    data_out="BlockDecisions",
                )
            else:
                s_classify.set_label(
                    summary_pill=f"{total_classified}개 블록 분류",
                    data_out="BlockDecisions",
                )

            s_classify.set_inputs({
                "execution_command": raw_command,
                "source_name": target_display_name,
                "candidate_blocks": total_classifiable_blocks,
                "candidate_blocks_by_page": {p.page: len(p.classifiable()) for p in selected_pages},
                "target_model": actual_model,
                "provider": actual_provider,
                "prompt_chars": len(prompt),
                "image_paths": page_image_paths,
                "pages": [p.page for p in selected_pages],
                "image_dpi": first_img.dpi,
                "hint_chars": sum(len(h) for h in page_hints.values()),
                "prompt": prompt,
            })
            first_dec = decisions_by_page.get(first_p.page, {})
            s_classify.set_outputs({
                "classified_blocks": total_classified,
                "doc_title": doc_title or first_dec.get("doc_title"),
                "has_structured_output": True if decisions_by_page else False,
                "tokens": {
                    "input": total_input_tokens,
                    "output": total_output_tokens,
                    "thinking": total_thinking_tokens,
                    "total": total_tokens,
                },
                "duration_seconds": getattr(last_exec_res, "duration_seconds", 0.0) if last_exec_res else 0.0,
                "raw_response": "\n\n".join(combined_raw_response) if combined_raw_response else getattr(last_exec_res, "raw_response", ""),
                "structured_output": first_dec if len(selected_pages) == 1 else decisions_by_page,
            })
            s_classify.snapshot(
                stage_id="slot_classification",
                stage_name="블록 역할 판정 (Vision)",
                payload={
                    "doc_title": doc_title or first_dec.get("doc_title"),
                    "candidate_blocks": total_classifiable_blocks,
                    "candidate_blocks_by_page": {p.page: len(p.classifiable()) for p in selected_pages},
                    "classified_blocks": total_classified,
                    "model": actual_model,
                    "provider": actual_provider,
                    "image_paths": page_image_paths,
                    "pages": [p.page for p in selected_pages],
                    "image_dpi": first_img.dpi,
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
            all_html_parts = []
            all_md_parts = []
            all_slots = []
            next_slot_num = 1

            for p in selected_pages:
                p_dec = decisions_by_page[p.page]
                p_html, p_md, p_slots = self.assembler.assemble(
                    pdf_path, p, p_dec, start_slot_number=next_slot_num
                )
                all_html_parts.append(p_html)
                all_md_parts.append(p_md)
                all_slots.extend(p_slots)
                next_slot_num = len(all_slots) + 1

            final_html = "\n\n".join(all_html_parts)
            final_md = "\n\n---\n\n".join(all_md_parts)

            s_assemble.set_inputs({
                "pdf_path": str(pdf_path),
                "selected_pages": [p.page for p in selected_pages],
                "candidate_blocks": total_classifiable_blocks,
                "classified_blocks": total_classified,
            })
            s_assemble.set_outputs({
                "slots_count": len(all_slots),
                "html_chars": len(final_html),
                "markdown_chars": len(final_md),
                "markdown": final_md,
                "html": final_html,
                "slots": [s.model_dump() if hasattr(s, "model_dump") else s for s in all_slots],
            })
            s_assemble.set_label(
                summary_pill=f"{len(selected_pages)}페이지 · 슬롯 {len(all_slots)}개 · HTML {len(final_html):,}자",
                data_out=f"ScaffoldExtractResult (slots: {len(all_slots)})",
            )
            s_assemble.snapshot(
                stage_id="scaffold_assembly",
                stage_name="와이어프레임 조립",
                payload={
                    "slots_count": len(all_slots),
                    "html_chars": len(final_html),
                    "markdown_chars": len(final_md),
                },
            )

        # D. 채점
        with collector.step(
            "FidelityScoring",
            span_type=SpanType.PARSER,
            phase=SpanPhase.POST_LLM,
            display_label="원본 대비 충실도 채점",
            description="조립 결과가 원본의 내용을 빠뜨리지 않았는지 검사합니다.",
            data_in=f"ScaffoldExtractResult (slots: {len(all_slots)})",
            sources=[source_of(score_page)],
        ) as s_score:
            reports = []
            for idx, p in enumerate(selected_pages):
                rep = score_page(p, all_html_parts[idx])
                reports.append(rep)

            all_ok = all(r.ok for r in reports)
            summary_text = " · ".join(f"p{p.page}: {r.summary()}" for p, r in zip(selected_pages, reports))

            s_score.set_inputs({
                "candidate_blocks": total_classifiable_blocks,
                "html_chars": len(final_html),
                "slots_count": len(all_slots),
            })
            s_score.set_outputs({
                "ok": all_ok,
                "summary": summary_text,
                "details": [getattr(r, "details", {}) for r in reports],
            })
            s_score.set_label(
                summary_pill=reports[0].summary() if len(reports) == 1 else summary_text,
                data_out="FidelityReport",
            )
        if not all_ok:
            logger.warning("[pipeline] D 채점 미달 — %s", summary_text)

        resolved_title = doc_title or first_dec.get("doc_title") or f"{display_stem} 서식 틀"
        page_label = f"{len(selected_pages)}페이지" if len(selected_pages) > 1 else first_p.doc_type
        meta = ScaffoldMeta(
            id=f"scaffold-{display_stem.lower().replace(' ', '-')}",
            title=resolved_title,
            targetDoc=display_stem,
            sourcePdfFileName=target_display_name,
            description=(
                f"원본 실측 기하 기반 와이어프레임 · {page_label} · 슬롯 {len(all_slots)}개"
            ),
            difficulty="easy" if len(all_slots) <= 10 else ("medium" if len(all_slots) <= 25 else "hard"),
        )
        logger.info("[pipeline] 완료 %.2fs — %s", time.time() - started, meta.title)

        return ScaffoldExtractResult(
            meta=meta, htmlContent=final_html, markdownContent=final_md, slots=all_slots
        )
