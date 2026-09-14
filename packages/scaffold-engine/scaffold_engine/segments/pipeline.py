"""LLM-backed extraction of page-relative visual document segments."""
from __future__ import annotations

from pathlib import Path
from typing import Any

from agent_telemetry import SpanPhase, SpanType, StepCollector, current_collector, model_source, source_of

from ..utils.json_runner import JsonPromptRunner
from .models import SegmentDocument


class SegmentPipeline:
    """Small, host-independent LLM pipeline.

    Relation mapping is intentionally not part of this pipeline. It is a
    deterministic host use case over independently produced artifacts.
    """

    def __init__(self, runner: JsonPromptRunner) -> None:
        self._runner = runner

    def extract(
        self,
        file_path: Path,
        *,
        display_name: str | None = None,
        profile: str = "reference_authoring",
    ) -> SegmentDocument:
        target_name = display_name or file_path.name
        collector = current_collector() or StepCollector(
            pipeline_name="SegmentPipeline",
            domain="segments",
            workflow_name="segments.extract",
            workflow_label="문서 세그먼트 추출",
            target_name=target_name,
        )

        with collector.step(
            "SegmentPrompt",
            span_type=SpanType.CHAIN,
            phase=SpanPhase.PRE_LLM,
            display_label="세그먼트 추출 프롬프트 조립",
            data_in=target_name,
            data_out="Segment extraction prompt",
            sources=[source_of(self._prompt)],
        ) as scope:
            prompt = self._prompt(target_name, profile)
            scope.set_inputs({"display_name": target_name, "profile": profile})
            scope.set_outputs({"prompt_chars": len(prompt)})

        model_name = self._runner.model
        with collector.step(
            "SegmentLlmInference",
            span_type=SpanType.LLM,
            phase=SpanPhase.LLM,
            display_label="시각 세그먼트 구조 추론",
            data_in="Segment extraction prompt",
            data_out="Raw segment JSON",
            sources=[source_of(JsonPromptRunner.run), model_source(model_name)],
        ) as scope:
            # **문서를 함께 넘긴다.** 예전에는 프롬프트에 파일 경로 문자열만 있었고,
            # 모델은 그 경로를 열 수 없으니 스키마 예시(`seg-1 / "Document Title"`)를
            # 그대로 되돌려줬다. outline 은 PDF 를, wireframe 은 페이지 이미지를
            # `file_path` 로 넘긴다. 세그먼트만 아무것도 넘기지 않고 있었다.
            raw = self._runner.run(prompt, list_key="segments", file_path=file_path)
            scope.set_outputs({"response_kind": type(raw).__name__})

        with collector.step(
            "SegmentValidation",
            span_type=SpanType.PARSER,
            phase=SpanPhase.POST_LLM,
            display_label="세그먼트 좌표 및 스키마 검증",
            data_in="Raw segment JSON",
            data_out="SegmentDocument",
            sources=[source_of(self._normalise), source_of(SegmentDocument)],
        ) as scope:
            payload = self._normalise(raw, target_name)
            document = SegmentDocument.model_validate(payload)
            scope.set_outputs({"total_pages": document.total_pages, "segment_count": len(document.segments)})
            return document

    @staticmethod
    def _normalise(raw: Any, display_name: str) -> dict[str, Any]:
        if isinstance(raw, dict):
            segments = raw.get("segments") or raw.get("blocks") or raw.get("__engine_payload__")
            return {
                "document_title": raw.get("document_title") or raw.get("documentTitle") or display_name,
                "total_pages": raw.get("total_pages") or raw.get("totalPages") or 1,
                "segments": segments or [],
            }
        if isinstance(raw, list):
            return {"document_title": display_name, "total_pages": 1, "segments": raw}
        return {"document_title": display_name, "total_pages": 1, "segments": []}

    @staticmethod
    def _prompt(display_name: str, profile: str) -> str:
        return f"""You are a visual document segmentation engine. The source document is attached to this request — read it directly. Its file name is "{display_name}", which is a hint only: never infer content from the name.

Extraction profile: {profile}.
Split EVERY page into practical visual regions that a person could inspect or edit independently.
Cover all pages of the attached document, and set total_pages to the document's real page count.
Derive every label, summary and box from what you actually see on the page.

Labels must quote the text actually printed in that region, in the document's own language.
Never translate it and never substitute a generic category name — a region reading "회의비 사용 내역"
is labelled "회의비 사용 내역", not "Document Title" or "Meeting Details Table".
Segment at the granularity a person would edit: a form's rows, a table's distinct row groups and
a page's separable blocks are separate segments, not one region covering the whole table.
Do not infer outline-to-segment, wireframe-to-segment, or cross-artifact relationships.

The block below is a FORMAT EXAMPLE, not content. Never echo its placeholder values
("seg-1", "Document Title", "short summary") — they are shape, not data.

Return JSON only:
{{
  \"document_title\": \"source file name\",
  \"total_pages\": 1,
  \"segments\": [
    {{
      \"id\": \"seg-1\",
      \"page\": 1,
      \"type\": \"heading|paragraph|table|list|media|form|unknown\",
      \"label\": \"human-readable label\",
      \"box_2d\": [ymin, xmin, ymax, xmax],
      \"content_summary\": \"short summary\",
      \"panelId\": \"optional logical panel within a spread\",
      \"semanticRole\": \"optional authoring-oriented role\",
      \"authoringUnitHint\": \"block|element\"
    }}
  ]
}}

box_2d is page-relative [ymin, xmin, ymax, xmax], each integer 0..1000. Every box must have positive area."""
