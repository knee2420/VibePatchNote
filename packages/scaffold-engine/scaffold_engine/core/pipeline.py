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
from typing import Optional, Union

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

    def run(self, pdf_path: Union[str, Path], page_number: int = 1) -> ScaffoldExtractResult:
        started = time.time()
        pdf_path = Path(pdf_path).resolve()
        logger.info("[pipeline] 시작: %s (p%d)", pdf_path.name, page_number)

        # A. 측정
        step = time.time()
        pages = self.extractor.extract(pdf_path)
        if not pages:
            raise ValueError(f"페이지를 읽을 수 없습니다: {pdf_path.name}")
        page = pages[min(max(page_number, 1), len(pages)) - 1]
        logger.info("[pipeline] A 측정 %.2fs — %s, 블록 %d, 표 %d",
                    time.time() - step, page.doc_type, len(page.classifiable()), len(page.tables))

        if not page.has_text_layer:
            raise ScannedDocumentError(
                f"'{pdf_path.name}' 에는 텍스트 레이어가 없습니다(스캔 이미지 PDF). "
                "이 파이프라인은 텍스트 기반 추출만 지원합니다."
            )

        # B. 판정
        step = time.time()
        decisions = self.classifier.classify(pdf_path.name, page)
        logger.info("[pipeline] B 판정 %.2fs — %d개 분류",
                    time.time() - step, len(decisions.get("blocks", [])))

        # C. 조립
        step = time.time()
        html, markdown, slots = self.assembler.assemble(pdf_path, page, decisions)
        logger.info("[pipeline] C 조립 %.2fs — 슬롯 %d", time.time() - step, len(slots))

        # D. 채점 (출력 누락 검사. 렌더 좌표를 주면 IoU 까지 본다)
        report = score_page(page, html)
        if not report.ok:
            logger.warning("[pipeline] D 채점 미달 — %s", report.summary())
        else:
            logger.info("[pipeline] D 채점 — %s", report.summary())

        meta = ScaffoldMeta(
            id=f"scaffold-{pdf_path.stem.lower().replace(' ', '-')}",
            title=decisions.get("doc_title") or f"{pdf_path.stem} 서식 틀",
            targetDoc=pdf_path.stem,
            sourcePdfFileName=pdf_path.name,
            description=(
                f"원본 실측 기하 기반 와이어프레임 · {page.doc_type} · 슬롯 {len(slots)}개"
            ),
            difficulty="easy" if len(slots) <= 10 else "medium",
        )
        logger.info("[pipeline] 완료 %.2fs — %s", time.time() - started, meta.title)

        return ScaffoldExtractResult(
            meta=meta, htmlContent=html, markdownContent=markdown, slots=slots
        )
