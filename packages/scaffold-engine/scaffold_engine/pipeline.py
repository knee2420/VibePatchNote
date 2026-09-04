"""Scaffold Engine Pipeline.

전체 추출 파이프라인 오케스트레이터:
PDF 입력 -> Vision 렌더링 -> Prompt 빌드 -> agy-cli LLM 실행 -> Tiptap DOM 검증/치유
"""
import logging
from pathlib import Path
from typing import Optional, Union

from scaffold_engine.types import ScaffoldExtractResult
from scaffold_engine.vision.pdf_renderer import PdfVisionRenderer
from scaffold_engine.harness.client import AntigravityClient, DEFAULT_MODEL
from scaffold_engine.dsl.prompt_builder import ScaffoldPromptBuilder
from scaffold_engine.validator.tiptap_validator import TiptapValidator

logger = logging.getLogger(__name__)


class ScaffoldPipeline:
    """PDF -> Tiptap 스캐폴딩 완전 자동화 파이프라인."""

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        dpi: int = 150,
        timeout_seconds: int = 180,
    ) -> None:
        self.renderer = PdfVisionRenderer(dpi=dpi)
        self.prompt_builder = ScaffoldPromptBuilder()
        self.client = AntigravityClient(model=model, timeout_seconds=timeout_seconds)

    def run(self, pdf_path: Union[str, Path]) -> ScaffoldExtractResult:
        """동기식 파이프라인 실행."""
        pdf_path = Path(pdf_path).resolve()
        logger.info("[ScaffoldPipeline] Starting extraction for %s", pdf_path.name)

        # 1. Vision Rendering (PDF -> 고해상도 이미지 및 2D 텍스트 블록)
        page_layouts = self.renderer.render_pages(pdf_path)
        logger.info("[ScaffoldPipeline] Rendered %d pages for %s", len(page_layouts), pdf_path.name)

        # 2. Prompt Assembly (DSL, Slot Policy, Few-shot 결합)
        prompt = self.prompt_builder.build_scaffold_prompt(pdf_path, page_layouts)
        logger.info("[ScaffoldPipeline] Built prompt (len=%d chars)", len(prompt))

        # 3. LLM Execution via agy-cli
        raw_json = self.client.run_json(prompt)
        if not raw_json:
            raise RuntimeError(f"agy-cli invocation failed or returned empty JSON for {pdf_path.name}")

        logger.info("[ScaffoldPipeline] Received raw response from agy-cli")

        # 4. Validation & Auto-healing
        result = TiptapValidator.validate_and_heal(raw_json)
        logger.info("[ScaffoldPipeline] Successfully validated and created scaffold: %s", result.meta.title)

        return result
