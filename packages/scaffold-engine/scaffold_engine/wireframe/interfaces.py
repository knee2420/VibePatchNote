"""Wireframe 파이프라인 전용 단계별 부품 계약 (SSOT)."""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol, runtime_checkable


@runtime_checkable
class GeometryExtractor(Protocol):
    """문서 -> 결정적 기하 측정. AI를 쓰지 않는다."""

    def extract(self, path: Path) -> List[Any]:
        ...


@runtime_checkable
class BlockClassifier(Protocol):
    """측정된 블록 -> 역할 판정. 좌표를 생성해서는 안 된다."""

    def classify(self, source_name: str, page: Any) -> Optional[Dict[str, Any]]:
        ...


@runtime_checkable
class Assembler(Protocol):
    """측정 기하 + 판정 -> 산출물(HTML/Markdown/슬롯)."""

    def assemble(self, page: Any, classification: Any) -> Any:
        ...
