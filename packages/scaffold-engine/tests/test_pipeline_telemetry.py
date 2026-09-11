from pathlib import Path
from unittest.mock import MagicMock
from scaffold_engine.outline.pipeline import OutlinePipeline
from scaffold_engine.harness.base import BaseLlmHarness, LlmExecutionResult
from agent_telemetry.contracts import PipelineTelemetry

class MockSuccessHarness(BaseLlmHarness):
    def run_structured(self, prompt, **kwargs):
        return LlmExecutionResult(
            status="SUCCESS",
            model="gemini-3.5-flash",
            structured_output={
                "document_title": "test_doc.pdf",
                "total_pages": 1,
                "outlines": [
                    {
                        "id": "out-1",
                        "level": 1,
                        "title": "제1조 (목적)",
                        "type": "header",
                        "page": 1,
                        "elements": [
                            {
                                "id": "elem-1",
                                "type": "paragraph",
                                "label": "목적 본문",
                                "value": "본 규정은...",
                                "page": 1,
                            }
                        ],
                    }
                ],
            },
            raw_response="{\"document_title\": \"test_doc.pdf\"}",
            input_tokens=100,
            output_tokens=50,
            total_tokens=150,
            duration_seconds=1.2,
        )

def test_pipeline_emits_valid_agent_telemetry(tmp_path: Path):
    dummy_pdf = tmp_path / "sample.pdf"
    dummy_pdf.write_bytes(b"%PDF-1.4 dummy")

    pipeline = OutlinePipeline(harness=MockSuccessHarness())
    # Mock context builder
    pipeline.context_builder = MagicMock()
    pipeline.context_builder.build_context.return_value = {
        "filename": "sample.pdf",
        "total_pages": 1,
        "context_text": "제1조 (목적) 본 규정은...",
        "elements": [],
    }

    res = pipeline.execute(dummy_pdf)
    assert res["success"] is True
    assert "telemetry" in res
    telemetry_dict = res["telemetry"]
    
    # 1. PipelineTelemetry 검증
    assert "pipeline_telemetry" in telemetry_dict
    pipe_telemetry = PipelineTelemetry.model_validate(telemetry_dict["pipeline_telemetry"])
    assert pipe_telemetry.pipeline_name == "OutlinePipeline"
    assert pipe_telemetry.status.value == "success"
    assert len(pipe_telemetry.spans) >= 4  # ContextBuilder, PromptAssembly, LLM, OutlineSchemaValidation
    assert len(pipe_telemetry.snapshots) >= 3  # context_build, prompt_assembly, structured_parsing

    # 2. Dotted Order 및 트리 순서 검증
    span_names = [s.name for s in pipe_telemetry.spans]
    assert "DocumentContextBuilder" in span_names
    assert "PromptAssembly" in span_names
    assert any(s.startswith("LLM:") for s in span_names)
    assert "OutlineSchemaValidation" in span_names

    for sp in pipe_telemetry.spans:
        assert sp.dotted_order is not None
        assert sp.usage.latency_ms >= 0.0

    print("PipelineTelemetry verification passed perfectly!")


def test_pipeline_uses_display_name_when_provided(tmp_path: Path):
    dummy_pdf = tmp_path / "source.pdf"
    dummy_pdf.write_bytes(b"%PDF-1.4 dummy")

    pipeline = OutlinePipeline(harness=MockSuccessHarness())
    pipeline.context_builder = MagicMock()
    pipeline.context_builder.build_context.return_value = {
        "filename": "원래_기획서.pdf",
        "total_pages": 1,
        "context_text": "제1조 (목적) 본 규정은...",
        "elements": [],
    }

    res = pipeline.execute(dummy_pdf, display_name="원래_기획서.pdf")
    assert res["success"] is True
    assert res["document_title"] == "원래_기획서.pdf"

    telemetry_dict = res["telemetry"]
    pipe_telemetry = PipelineTelemetry.model_validate(telemetry_dict["pipeline_telemetry"])
    assert pipe_telemetry.target_name == "원래_기획서.pdf"
    assert res["document"].document_title in ("test_doc.pdf", "원래_기획서.pdf")
