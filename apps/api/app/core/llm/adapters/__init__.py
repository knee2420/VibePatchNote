"""호스트 전용 LLM 어댑터.

agy CLI 어댑터는 여기 없다 — 엔진(`scaffold_engine.harness.agy_client`)이 정본이고,
호스트는 `LlmManager` 에서 설정만 주입해 재사용한다. 같은 어댑터를 두 벌 두지 않는다.
"""
from app.core.llm.adapters.gemini_skeleton import GoogleGenAiHarness
from app.core.llm.adapters.gemma_skeleton import LocalGemmaHarness

__all__ = ["GoogleGenAiHarness", "LocalGemmaHarness"]
