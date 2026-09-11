"""Google Gemini Direct API 정규 어댑터 (Official Adapter).

정본 구현체는 호스트 비의존 공통 패키지인 `scaffold_engine.harness.gemini_client.GoogleGenAiHarness` 입니다.
호스트 계층의 일관된 어댑터 디렉터리 접근 및 하위 호환성을 위해 re-export 합니다.
"""
from __future__ import annotations

import scaffold_engine.harness.gemini_client as _gemini_client
from scaffold_engine.harness import (
    GeminiAdapter,
    GeminiApiHarness,
    GoogleGenAiHarness,
)

# 하위 호환 및 테스트 모킹 지원을 위한 requests 참조 노출
requests = _gemini_client.requests

__all__ = ["GoogleGenAiHarness", "GeminiAdapter", "GeminiApiHarness", "requests"]
