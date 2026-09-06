"""Scaffold Engine — 호스트 비의존 문서 스캐폴딩 엔진.

파이프라인: 측정(결정적) -> 판정(에이전트) -> 조립(결정적) -> 채점
좌표는 측정 단계에서만 생성된다. 상세는 `core/pipeline.py` 참조.
"""
from .core.pipeline import ScaffoldPipeline, ScannedDocumentError
from .types import ScaffoldExtractResult, ScaffoldMeta, SlotMappingItem

__all__ = [
    "ScaffoldPipeline",
    "ScannedDocumentError",
    "ScaffoldExtractResult",
    "ScaffoldMeta",
    "SlotMappingItem",
]
