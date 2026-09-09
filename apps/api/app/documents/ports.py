"""documents 유스케이스가 외부 세계에 요구하는 계약.

여기에는 로컬 디렉터리, JSON 파일, SQLAlchemy 같은 구현 세부 사항을 두지 않는다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Protocol

from scaffold_engine import OutlineDocument, ScaffoldExtractResult


class DocumentSourceRepository(Protocol):
    """원본 문서의 저장과 조회 계약."""

    def save(self, filename: str, content: bytes) -> Path: ...

    def resolve(self, filename: str) -> Path: ...


class SegmentScanPort(Protocol):
    """문서 세그먼트 분석 실행 계약."""

    async def scan(self, prompt: str) -> dict[str, Any] | None: ...


class DocumentAnalysisRepository(Protocol):
    """문서 분석 결과(아웃라인·세그먼트)의 영속화 계약."""

    def outline_exists(self, filename: str) -> bool: ...

    def load_outline(self, filename: str) -> dict[str, Any] | None: ...

    def save_outline(self, filename: str, document: OutlineDocument) -> None: ...

    def load_segment_scan(self, filename: str) -> dict[str, Any] | None: ...

    def save_segment_scan(self, filename: str, payload: dict[str, Any]) -> None: ...


class ScaffoldArchivePort(Protocol):
    """documents가 scaffold 산출물을 보관하기 위해 요구하는 계약."""

    def archive_scaffold(self, pdf_path: Path, result: ScaffoldExtractResult) -> Any: ...
