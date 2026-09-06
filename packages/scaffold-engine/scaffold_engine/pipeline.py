"""Scaffold Engine Pipeline.

전체 추출 파이프라인 오케스트레이터:
PDF 입력 -> Vision 렌더링 -> Prompt 빌드 -> agy-cli LLM 실행 -> Tiptap DOM 검증/치유
"""
import json
import logging
from pathlib import Path
from typing import Optional, Union, Dict, Any

from scaffold_engine.types import ScaffoldExtractResult
from scaffold_engine.vision.pdf_renderer import PdfVisionRenderer
from scaffold_engine.harness.client import AntigravityClient, DEFAULT_MODEL
from scaffold_engine.dsl.prompt_builder import ScaffoldPromptBuilder
from scaffold_engine.validator.tiptap_validator import TiptapValidator

logger = logging.getLogger(__name__)

FEW_SHOTS_DIR = Path(__file__).parent / "dsl" / "few_shots"


class ScaffoldPipeline:
    """PDF -> Tiptap 스캐폴딩 완전 자동화 순수 분석 파이프라인 (캐싱 없이 항상 실시간 신규 분석)."""

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        dpi: int = 150,
        timeout_seconds: int = 120,
    ) -> None:

        self.renderer = PdfVisionRenderer(dpi=dpi)
        self.prompt_builder = ScaffoldPromptBuilder()
        self.client = AntigravityClient(model=model, timeout_seconds=timeout_seconds)

    def run(self, pdf_path: Union[str, Path]) -> ScaffoldExtractResult:
        """동기식 파이프라인 실행: 캐싱 없이 항상 실시간 신규 분석을 수행합니다."""
        import time
        total_t0 = time.time()
        pdf_path = Path(pdf_path).resolve()
        logger.info("[ScaffoldPipeline] >>> Starting fresh analysis for: %s (path=%s)", pdf_path.name, pdf_path)

        # 1. Vision Rendering (PDF -> 고해상도 이미지 및 2D 텍스트/표 기하 정보 실시간 추출)
        t0 = time.time()
        page_layouts = self.renderer.render_pages(pdf_path)
        logger.info("[ScaffoldPipeline] [Step 1] Rendered %d pages in %ss for %s", len(page_layouts), round(time.time() - t0, 2), pdf_path.name)

        # 2. Prompt Assembly (DSL, Slot Policy, 기하 제약 동적 결합)
        t0 = time.time()
        prompt = self.prompt_builder.build_scaffold_prompt(pdf_path, page_layouts)
        logger.info("[ScaffoldPipeline] [Step 2] Built fresh prompt (len=%d chars) in %ss", len(prompt), round(time.time() - t0, 2))

        # 3. LLM Execution via agy-cli (Gemini 3.1 Pro 실시간 추론)
        t0 = time.time()
        logger.info("[ScaffoldPipeline] [Step 3] Dispatching to agy-cli LLM...")
        raw_json = self.client.run_json(prompt)
        logger.info("[ScaffoldPipeline] [Step 3] agy-cli returned in %ss (success=%s)", round(time.time() - t0, 2), bool(raw_json))

        # 4. LLM 실패 또는 타임아웃 시 실시간 추출된 2D 기하 기반 동적 레이아웃 합성
        if not raw_json:
            logger.warning("[ScaffoldPipeline] [Step 4] agy-cli failed or empty, generating layout from fresh 2D geometry: %s", pdf_path.name)
            raw_json = self._build_heuristic_fallback(pdf_path, page_layouts)

        # 5. Validation & Auto-healing
        t0 = time.time()
        result = TiptapValidator.validate_and_heal(raw_json)
        logger.info("[ScaffoldPipeline] [Step 5] Validated and created scaffold in %ss: %s (slots=%d)", round(time.time() - t0, 2), result.meta.title, len(result.slots))
        logger.info("[ScaffoldPipeline] >>> TOTAL PIPELINE TIME: %ss for %s", round(time.time() - total_t0, 2), pdf_path.name)

        return result



    def _build_heuristic_fallback(self, pdf_path: Path, page_layouts: list) -> Dict[str, Any]:
        """LLM 호출이 타임아웃되거나 실패했을 때 2D 레이아웃으로부터 서식을 안전하게 자동 생성."""
        doc_title = pdf_path.stem
        html_parts = [f"<h2 style=\"text-align: center; margin-bottom: 1.5rem;\">{doc_title} 서식 틀</h2>"]
        slots = []
        slot_idx = 1

        for page in page_layouts:
            # 테이블이 감지된 경우
            for table in getattr(page, "tables", []):
                ncols = getattr(table, "col_count", 2)
                nrows = getattr(table, "row_count", 3)
                col_widths = getattr(table, "col_widths_pct", [])

                html_parts.append('<table class="scaffold-table" style="width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #cbd5e1; font-size: 13px;">')
                if col_widths and len(col_widths) == ncols:
                    html_parts.append('  <colgroup>')
                    for w in col_widths:
                        html_parts.append(f'    <col style="width: {w}%;" />')
                    html_parts.append('  </colgroup>')
                html_parts.append('  <tbody>')

                for row_idx in range(min(nrows, 12)):
                    html_parts.append('    <tr style="border-bottom: 1px solid #e2e8f0;">')
                    for col_idx in range(ncols):
                        if col_idx == 0:
                            html_parts.append(f'      <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: 700; text-align: center; border-right: 1px solid #e2e8f0;">항목 {row_idx + 1}</th>')
                        else:
                            slot_id = f"slot-{slot_idx}"
                            html_parts.append(f'      <td style="padding: 10px 14px;"><span data-type="scaffold-slot" data-mapping-num="{slot_idx}" data-placeholder="내용을 입력하세요"></span></td>')
                            slots.append({
                                "id": slot_id,
                                "number": slot_idx,
                                "label": f"입력 슬롯 {slot_idx}",
                                "box_2d": [100 + slot_idx * 50, 250, 140 + slot_idx * 50, 850],
                                "pageNumber": getattr(page, "page_number", 1),
                            })
                            slot_idx += 1
                    html_parts.append('    </tr>')
                html_parts.append('  </tbody></table>')

        if len(html_parts) == 1:
            html_parts.append('<p><span data-type="scaffold-slot" data-mapping-num="1" data-placeholder="기본 내용을 입력하세요"></span></p>')
            slots.append({
                "id": "slot-1",
                "number": 1,
                "label": "기본 입력 슬롯",
                "box_2d": [100, 100, 200, 900],
                "pageNumber": 1,
            })


        return {
            "document_title": pdf_path.name,
            "meta": {
                "id": f"scaffold-{doc_title}",
                "title": f"{doc_title} 서식 틀",
                "targetDoc": doc_title,
                "sourcePdfFileName": pdf_path.name,
                "description": "자동 추출된 서식 와이어프레임",
                "difficulty": "medium",
            },
            "slots": slots,
            "htmlContent": "\n".join(html_parts),
            "markdownContent": f"# {doc_title}\n\n[ 자동 생성된 서식 ]",
        }

