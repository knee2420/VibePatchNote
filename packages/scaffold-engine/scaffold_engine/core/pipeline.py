"""파이프라인 오케스트레이터.

부품을 조립하기만 한다. 각 단계의 구현은 주입 가능하므로, 새 하네스나 새 조립
전략을 붙일 때 이 파일을 고칠 필요가 없다.

    A 측정(결정적)  ->  B 판정(에이전트)  ->  C 조립(결정적)  ->  D 채점
    extract/           classify/            assemble/          score/

핵심 불변식: **좌표는 A 에서만 만들어진다.** B 의 출력 스키마에는 좌표 필드가
없고, C 는 A 의 실측치만 사용한다. 그래서 문서가 바뀌어도 매핑이 어긋나지 않는다.
"""
from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import Any, Optional, Union

from agent_telemetry import (
    SpanPhase,
    SpanType,
    StepCollector,
    model_source,
    source_of,
)

from scaffold_engine.assemble.html import HtmlAssembler
from scaffold_engine.classify.agent import SlotClassifier
from scaffold_engine.core.interfaces import LlmHarness
from scaffold_engine.extract.geometry import PdfGeometryExtractor
from scaffold_engine.harness import DEFAULT_MODEL_NAME, HarnessFactory
from scaffold_engine.score.fidelity import score_page
from scaffold_engine.types import ScaffoldExtractResult, ScaffoldMeta

logger = logging.getLogger(__name__)


class ScannedDocumentError(RuntimeError):
    """텍스트 레이어가 없는 스캔 PDF — 이 파이프라인으로는 처리할 수 없다."""


class ScaffoldPipeline:
    """PDF -> Tiptap 스캐폴딩. 캐싱 없이 항상 실시간 분석."""

    def __init__(
        self,
        model: str = DEFAULT_MODEL_NAME,
        harness: Optional[LlmHarness] = None,
        timeout_seconds: int = 75,
    ) -> None:
        self.harness = harness or HarnessFactory.create(
            model=model, timeout_seconds=timeout_seconds
        )
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
        collector = StepCollector(
            pipeline_name="ScaffoldPipeline",
            domain="documents",
            workflow_name="documents.generate_scaffold",
            workflow_label="와이어프레임 생성",
            target_name=display_name or Path(pdf_path).name,
        )
        try:
            with collector.activate():
                return self._run_traced(collector, pdf_path, page_number, display_name)
        finally:
            # 실패해도 거기까지의 단계는 남는다. 관측 도구가 가장 봐야 할 기록이다.
            self.last_telemetry = collector.export_telemetry(
                provenance={"engine": "scaffold", "harness": self.harness.name}
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
            s_extract.set_inputs({"filename": target_display_name, "page_number": page_number})
            s_extract.set_outputs({
                "total_pages": len(pages),
                "doc_type": page.doc_type,
                "blocks": len(page.classifiable()),
                "tables": len(page.tables),
                "has_text_layer": page.has_text_layer,
            })
            s_extract.set_label(
                summary_pill=f"{page.doc_type} · 블록 {len(page.classifiable())}개 · 표 {len(page.tables)}개",
                data_out=f"PageGeometry ({len(page.classifiable())} blocks)",
            )

        if not page.has_text_layer:
            raise ScannedDocumentError(
                f"'{target_display_name}' 에는 텍스트 레이어가 없습니다(스캔 이미지 PDF). "
                "이 파이프라인은 텍스트 기반 추출만 지원합니다."
            )

        # B. 판정 (유일하게 AI 가 개입하는 단계)
        with collector.step(
            f"LLM:{self.harness.name}",
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
            s_classify.set_inputs({
                "source_name": target_display_name,
                "candidate_blocks": len(page.classifiable()),
            })
            s_classify.set_outputs({
                "classified_blocks": classified,
                "doc_title": decisions.get("doc_title"),
            })
            s_classify.set_label(
                summary_pill=f"{classified}개 블록 분류",
                data_out="BlockDecisions",
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
            s_assemble.set_outputs({
                "slots": len(slots),
                "html_chars": len(html),
                "markdown_chars": len(markdown),
            })
            s_assemble.set_label(
                summary_pill=f"슬롯 {len(slots)}개 · HTML {len(html):,}자",
                data_out=f"ScaffoldExtractResult (slots: {len(slots)})",
            )

        # D. 채점 (출력 누락 검사. 렌더 좌표를 주면 IoU 까지 본다)
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
            s_score.set_outputs({"ok": report.ok, "summary": report.summary()})
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
