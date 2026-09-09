"""documents 유스케이스가 외부 세계에 요구하는 계약.

여기에는 로컬 디렉터리, JSON 파일, SQLAlchemy 같은 구현 세부 사항을 두지 않는다.
"""
from __future__ import annotations

from typing import Any, Protocol

from scaffold_engine import OutlineDocument


class DocumentAnalysisRepository(Protocol):
    """문서 분석 결과(아웃라인·세그먼트)의 영속화 계약."""

    def outline_exists(self, filename: str) -> bool: ...

    def load_outline(self, filename: str) -> dict[str, Any] | None: ...

    def save_outline(self, filename: str, document: OutlineDocument) -> None: ...

    def load_segment_scan(self, filename: str) -> dict[str, Any] | None: ...

    def save_segment_scan(self, filename: str, payload: dict[str, Any]) -> None: ...
