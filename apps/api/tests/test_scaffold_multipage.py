"""Wireframe 다중 페이지 추출 검증 테스트."""
from __future__ import annotations

from pathlib import Path

import pymupdf
from agent_core.llm.base import LlmExecutionResult
from scaffold_engine.wireframe import ScaffoldPipeline


class _MockMultiPageHarness:
    """테스트용 가상 하네스."""

    name = "mock-harness"
    model = "gemini-3.8-flash"
    primary_provider = "google_api"

    def __init__(self) -> None:
        self.call_count = 0
        self.prompts = []

    def run_structured(self, prompt: str, **kwargs) -> LlmExecutionResult:
        self.call_count += 1
        self.prompts.append(prompt)
        page_idx = self.call_count
        return LlmExecutionResult(
            status="SUCCESS",
            structured_output={
                "doc_title": "다중 페이지 문서",
                "blocks": [
                    {
                        "id": "L1",
                        "role": "label",
                        "value_text": "",
                        "slot_label": "",
                    },
                    {
                        "id": "L2",
                        "role": "value",
                        "value_text": f"값_{page_idx}",
                        "slot_label": f"항목_{page_idx}",
                    },
                ],
            },
            input_tokens=100,
            output_tokens=50,
            total_tokens=150,
            model=self.model,
            telemetry_metadata={"provider": self.primary_provider},
        )


def _make_multipage_pdf(path: Path, pages: int = 2) -> None:
    doc = pymupdf.open()
    for pno in range(1, pages + 1):
        page = doc.new_page(width=595, height=842)
        page.insert_text((72, 100), f"Page {pno} Header", fontsize=16)
        page.insert_text((72, 140), f"라벨 {pno}:", fontsize=11)
        page.insert_text((150, 140), f"값_{pno}", fontsize=11)
    doc.save(path)
    doc.close()


def test_scaffold_pipeline_processes_all_pages(tmp_path: Path) -> None:
    """2페이지 PDF를 처리할 때 모든 페이지가 추출되고 슬롯이 누적되는지 검증."""
    pdf_path = tmp_path / "two_pages.pdf"
    _make_multipage_pdf(pdf_path, pages=2)

    harness = _MockMultiPageHarness()
    pipeline = ScaffoldPipeline(harness=harness)

    # page_number를 지정하지 않으면 전체 페이지 처리!
    result = pipeline.run(pdf_path, display_name="전체_문서.pdf")

    # 1. 하네스가 2번 호출되었는지 검증 (페이지당 1회)
    assert harness.call_count == 2, f"Expected 2 LLM calls for 2 pages, got {harness.call_count}"

    # 2. 결과 HTML에 2개의 scaffold-page가 포함되어 있는지 검증
    assert 'data-page="1"' in result.html_content
    assert 'data-page="2"' in result.html_content
    assert 'class="scaffold-page"' in result.html_content

    # 3. 슬롯이 2페이지에 걸쳐 고유하게 생성되었는지 검증
    assert len(result.slots) == 2
    assert result.slots[0].id == "s1"
    assert result.slots[0].number == 1
    assert result.slots[0].page_number == 1

    assert result.slots[1].id == "s2"
    assert result.slots[1].number == 2
    assert result.slots[1].page_number == 2

    # 4. 메타데이터 검증
    assert "2페이지" in result.meta.description
    assert result.meta.title == "다중 페이지 문서"
