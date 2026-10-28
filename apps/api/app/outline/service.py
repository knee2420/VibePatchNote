"""outline 도메인의 비즈니스 오케스트레이션 서비스."""
from __future__ import annotations

from typing import Any

from .agents import ExtractOutlineUseCase


class OutlineService:
    """outline 도메인 유스케이스를 조율하는 파사드 서비스."""

    def __init__(self, extract_outline: ExtractOutlineUseCase) -> None:
        self._extract_outline = extract_outline

    async def extract_outline(self, doc_id: str, force_refresh: bool = False) -> dict[str, Any]:
        """문서 목차 추출 Agent 실행."""
        return await self._extract_outline.execute(doc_id, force_refresh=force_refresh)

    def load_adopted(self, doc_id: str) -> dict[str, Any] | None:
        """현재 채택본(HEAD) 조회 (LLM 미호출)."""
        return self._extract_outline.load_adopted(doc_id)
