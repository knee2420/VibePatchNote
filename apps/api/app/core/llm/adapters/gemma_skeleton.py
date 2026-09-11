"""Gemma4 31B 로컬 서빙(vLLM / Ollama 호환 REST) 어댑터 — **미연결 스켈레톤**.

정본 구현체는 호스트 비의존 공통 패키지인 `scaffold_engine.harness.gemma_client.LocalGemmaHarness` 입니다.
호스트 계층의 일관된 어댑터 디렉터리 접근 및 하위 호환성을 위해 re-export 합니다.
"""
from __future__ import annotations

from scaffold_engine.harness import LocalGemmaHarness

__all__ = ["LocalGemmaHarness"]
