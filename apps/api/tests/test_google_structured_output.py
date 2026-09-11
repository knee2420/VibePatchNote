from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from scaffold_engine.harness import LlmExecutionResult
from scaffold_engine.outline.pipeline import OutlinePipeline

from app.core.llm.adapters import GoogleGenAiHarness


class _Response:
    ok = True

    def json(self) -> dict[str, Any]:
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": json.dumps(
                                    {
                                        "document_title": "demo.pdf",
                                        "outlines": [
                                            {"id": "out-1", "title": "본문"}
                                        ],
                                    },
                                    ensure_ascii=False,
                                )
                            }
                        ]
                    }
                }
            ],
            "usageMetadata": {},
        }


def test_google_adapter_loads_schema_path_into_request(tmp_path: Path, monkeypatch) -> None:
    schema = {
        "type": "object",
        "properties": {"document_title": {"type": "string", "default": ""}},
        "required": ["document_title"],
    }
    schema_path = tmp_path / "output.schema.json"
    schema_path.write_text(json.dumps(schema), encoding="utf-8")
    captured: dict[str, Any] = {}

    def post(*args, **kwargs):
        captured.update(kwargs["json"])
        return _Response()

    monkeypatch.setattr("app.core.llm.adapters.gemini_adapter.requests.post", post)
    result = GoogleGenAiHarness(model="gemini-test", api_key="test-key").run_structured(
        "extract", schema_path=schema_path
    )

    assert result.ok
    sent_schema = captured["generationConfig"]["responseJsonSchema"]
    assert sent_schema["properties"]["document_title"] == {"type": "string"}
    assert sent_schema["required"] == ["document_title"]


class _EmptyOutlineHarness:
    model = "gemini-test"

    def run_structured(self, *args, **kwargs) -> LlmExecutionResult:
        return LlmExecutionResult(
            status="SUCCESS",
            model="gemini-test",
            structured_output={
                "document_title": "demo.pdf",
                "outlines": [{"id": "out-1", "title": "demo.pdf"}],
            },
        )


class _ContextBuilder:
    def build_context(self, pdf_path: Path, output_dir=None, display_name=None) -> dict[str, Any]:
        return {
            "filename": display_name or pdf_path.name,
            "total_pages": 1,
            "context_file_path": None,
            "context_text": "제목과 본문이 있는 문서",
        }


def test_outline_pipeline_rejects_semantically_empty_success(tmp_path: Path) -> None:
    source = tmp_path / "demo.pdf"
    source.write_bytes(b"placeholder")
    pipeline = OutlinePipeline(
        harness=_EmptyOutlineHarness(),  # type: ignore[arg-type]
        system_instructions_path=tmp_path / "missing-instructions.md",
    )
    pipeline.context_builder = _ContextBuilder()  # type: ignore[assignment]

    result = pipeline.execute(source)

    assert result["success"] is False
    assert result["status"] == "ERROR"
    assert result["telemetry"]["error"].startswith("OUTLINE_CONTENT_EMPTY")
    assert result["telemetry"]["telemetry_metadata"]["failure_code"] == "INVALID_MODEL_OUTPUT"


def test_google_adapter_attaches_file_as_inlinedata(tmp_path: Path, monkeypatch) -> None:
    pdf_file = tmp_path / "sample.pdf"
    sample_content = b"%PDF-1.4 sample content for multimodal vision test"
    pdf_file.write_bytes(sample_content)

    captured: dict[str, Any] = {}

    def post(*args, **kwargs):
        captured.update(kwargs["json"])
        return _Response()

    monkeypatch.setattr("app.core.llm.adapters.gemini_adapter.requests.post", post)

    # 1. file_path 인자로 직접 넘겼을 때
    harness = GoogleGenAiHarness(model="gemini-3.5-flash", api_key="test-key")
    res1 = harness.run_structured("분석해주세요", file_path=pdf_file)
    assert res1.ok
    parts1 = captured["contents"][0]["parts"]
    assert len(parts1) == 2
    assert "inlineData" in parts1[0]
    assert parts1[0]["inlineData"]["mimeType"] == "application/pdf"
    import base64
    assert base64.b64decode(parts1[0]["inlineData"]["data"]) == sample_content
    assert parts1[1]["text"] == "분석해주세요"

    # 2. 프롬프트 본문에서 - 원본 파일 경로: 로 감지할 때
    captured.clear()
    prompt_with_path = f"문서 분석\n- 원본 파일 경로: {pdf_file}\n진행하세요"
    res2 = harness.run_structured(prompt_with_path)
    assert res2.ok
    parts2 = captured["contents"][0]["parts"]
    assert len(parts2) == 2
    assert parts2[0]["inlineData"]["mimeType"] == "application/pdf"
    assert parts2[1]["text"] == prompt_with_path
