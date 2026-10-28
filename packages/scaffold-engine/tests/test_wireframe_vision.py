"""Scaffold Engine — Wireframe 비전 멀티모달 & 힌트 매트릭스 단위 테스트."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

import pytest

from scaffold_engine.tools.pdf_geometry import Block, PageGeometry, TableGeometry
from scaffold_engine.wireframe.preprocess.extract.hint_builder import HintBuilder
from scaffold_engine.wireframe.inference.classify.agent import SlotClassifier
from scaffold_engine.wireframe.inference.classify.schema import BLOCK_CLASSIFICATION_SCHEMA
from scaffold_engine.wireframe.pipeline import ScaffoldPipeline
from scaffold_engine.contracts import LlmHarness
from agent_core.llm.base import LlmExecutionResult


class DummyVisionHarness:
    """테스트용 가상 비전 하네스."""

    name = "DummyVisionHarness"
    model = "gemini-3.8-flash"
    primary_provider = "google_api"

    def __init__(self) -> None:
        self.last_prompt = ""
        self.last_file_path = None
        self.last_result = None

    def run_structured(
        self,
        prompt: str,
        json_schema: Optional[Dict[str, Any]] = None,
        schema_path: Optional[Path] = None,
        file_path: Optional[Any] = None,
        **kwargs: Any,
    ) -> LlmExecutionResult:
        self.last_prompt = prompt
        self.last_file_path = file_path
        res = LlmExecutionResult(
            status="SUCCESS",
            raw_response='{"doc_title": "테스트 문서", "blocks": [{"id": "t0-r0c0", "role": "label", "value_text": "", "slot_label": ""}, {"id": "t0-r0c1", "role": "value", "value_text": "010-1234-5678", "slot_label": "연락처"}]}',
            structured_output={
                "doc_title": "테스트 문서",
                "blocks": [
                    {"id": "t0-r0c0", "role": "label", "value_text": "", "slot_label": ""},
                    {"id": "t0-r0c1", "role": "value", "value_text": "010-1234-5678", "slot_label": "연락처"},
                ],
            },
            input_tokens=150,
            output_tokens=60,
            model=self.model,
            telemetry_metadata={"provider": self.primary_provider},
        )
        self.last_result = res
        return res


def test_hint_builder_generates_matrix_with_recommendation_tags():
    """HintBuilder가 표 구조 및 추천 태그를 정밀하게 생성하는지 검증."""
    page = PageGeometry(
        page=1,
        width=595.0,
        height=842.0,
        tables=[
            TableGeometry(
                id="t0",
                page=1,
                bbox=[50.0, 100.0, 545.0, 200.0],
                norm=[118, 84, 237, 915],
                rows=2,
                cols=2,
                col_pct=[30.0, 70.0],
                row_pct=[50.0, 50.0],
                row_h_pt=[50.0, 50.0],
            )
        ],
        blocks=[
            Block(
                id="t0-r0c0",
                kind="cell",
                page=1,
                bbox=[50.0, 100.0, 198.5, 150.0],
                norm=[118, 84, 178, 333],
                text="연락처",
                size=11.0,
                row=0,
                col=0,
            ),
            Block(
                id="t0-r0c1",
                kind="cell",
                page=1,
                bbox=[198.5, 100.0, 545.0, 150.0],
                norm=[118, 333, 178, 915],
                text="010-1234-5678",
                size=11.0,
                row=0,
                col=1,
            ),
            Block(
                id="b0",
                kind="line",
                page=1,
                bbox=[50.0, 50.0, 545.0, 80.0],
                norm=[59, 84, 95, 915],
                text="프로젝트 최종 보고서",
                size=18.0,
            ),
        ],
    )

    hint = HintBuilder.build_hint_text(page)

    assert "595.0pt x 842.0pt" in hint
    assert "표 [t0]" in hint
    assert "열 너비 비율(%): [30.0, 70.0]" in hint
    assert "첫 번째 열(주로 항목 라벨)" in hint
    assert "인스턴스 기입값/슬롯 후보" in hint
    assert "문서 최상단 헤더/제목 영역" in hint


def test_slot_classifier_passes_image_path_to_harness(tmp_path):
    """SlotClassifier가 image_path를 하네스의 file_path로 정상 전달하는지 검증."""
    harness = DummyVisionHarness()
    classifier = SlotClassifier(harness=harness)

    dummy_img = tmp_path / "page_1.png"
    dummy_img.write_bytes(b"\x89PNG\r\n\x1a\n")

    page = PageGeometry(
        page=1,
        width=595.0,
        height=842.0,
        blocks=[
            Block(id="t0-r0c0", kind="cell", page=1, bbox=[0, 0, 10, 10], norm=[0, 0, 10, 10], text="라벨", row=0, col=0),
            Block(id="t0-r0c1", kind="cell", page=1, bbox=[10, 0, 20, 10], norm=[0, 10, 10, 20], text="010-1234-5678", row=0, col=1),
        ],
    )

    decisions = classifier.classify("test.pdf", page, image_path=dummy_img)

    assert harness.last_file_path == dummy_img
    assert "참조" in harness.last_prompt or "이미지" in harness.last_prompt
    assert len(decisions["blocks"]) == 2
    assert decisions["blocks"][1]["slot_label"] == "연락처"
