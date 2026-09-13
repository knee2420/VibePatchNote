"""Scaffold Engine Data Types (하위 호환성 래퍼).

정본은 `scaffold_engine.wireframe.schemas.models` 에 있습니다.
"""
from .wireframe.schemas.models import (
    ScaffoldExtractResult,
    ScaffoldMeta,
    SlotMappingItem,
)

__all__ = [
    "ScaffoldExtractResult",
    "ScaffoldMeta",
    "SlotMappingItem",
]
