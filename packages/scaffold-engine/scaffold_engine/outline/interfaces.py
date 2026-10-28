"""Scaffold Engine — Outline Pipeline Interfaces (추상 포트 정의)."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, Protocol, Union

from scaffold_engine.outline.schemas.models import OutlineDocument


class ContextBuilder(Protocol):
    """Stage 1-A: PDF로부터 실측 기하 및 텍스트 컨텍스트를 추출하는 계약."""

    def build_context(
        self,
        pdf_path: Path,
        output_dir: Optional[Path] = None,
        display_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        ...


class PromptAssembler(Protocol):
    """Stage 1-B: 시스템 지침과 실측 컨텍스트를 결합하여 프롬프트를 조립하는 계약."""

    def assemble(
        self,
        instructions: str,
        doc_ctx: Dict[str, Any],
        target_display_name: str,
        resolved_file_path: str,
    ) -> str:
        ...


class OutlineInferencer(Protocol):
    """Stage 2: LLM 하네스를 통해 구조화된 목차 JSON을 추론하는 계약."""

    def infer(
        self,
        prompt: str,
        pdf_path: Path,
        model: str,
        effort: Optional[str],
    ) -> Any:
        ...


class OutlineParser(Protocol):
    """Stage 3: 모델의 구조화 출력을 OutlineDocument로 파싱 및 표준화하는 계약."""

    def parse(
        self,
        raw_output: Any,
        target_display_name: str,
        pdf_path: Path,
        total_pages: int,
        telemetry: Dict[str, Any],
    ) -> Optional[OutlineDocument]:
        ...


class OutlineValidator(Protocol):
    """Stage 4: 추출된 OutlineDocument의 완성도와 충실도를 검증하는 계약."""

    def validate(self, document: OutlineDocument) -> Dict[str, Any]:
        ...
