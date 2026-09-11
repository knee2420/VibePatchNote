"""호스트 전용 LLM 어댑터.

- `agy_cli`: `scaffold_engine.harness.agy_client`가 정본이며 `LlmManager`가 설정 주입
- `google_api`: `gemini_adapter.py` (Google Gemini Direct API 정규 어댑터)
- `local_serving`: `gemma_skeleton.py` (로컬 Gemma 서빙 어댑터)
"""
from app.core.llm.adapters.gemini_adapter import (
    GeminiAdapter,
    GeminiApiHarness,
    GoogleGenAiHarness,
)
from app.core.llm.adapters.gemma_skeleton import LocalGemmaHarness

__all__ = ["GoogleGenAiHarness", "GeminiAdapter", "GeminiApiHarness", "LocalGemmaHarness"]
