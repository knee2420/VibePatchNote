"""Slot Classifier (하위 호환성 래퍼).

정본은 `scaffold_engine.wireframe.classify.agent` 에 있습니다.
"""
from scaffold_engine.wireframe.classify.agent import (
    FALLBACK_ROLE,
    SlotClassifier,
)

__all__ = ["SlotClassifier", "FALLBACK_ROLE"]
