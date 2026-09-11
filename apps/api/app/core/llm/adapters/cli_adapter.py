"""호스트 LLM 어댑터 — Antigravity CLI(agy).

정본 구현체는 `scaffold_engine.harness.agy_client.AgyCliHarness` 입니다.
호스트 계층의 일관된 어댑터 디렉터리 접근 및 하위 호환성을 위해 re-export 합니다.
"""
from __future__ import annotations

from scaffold_engine.harness import AgyCliHarness, AgyHarness

__all__ = ["AgyCliHarness", "AgyHarness"]
