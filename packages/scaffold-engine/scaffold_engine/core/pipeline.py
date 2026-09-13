"""Scaffold Pipeline (하위 호환성 래퍼).

정본은 `scaffold_engine.wireframe.pipeline` 에 있습니다.
"""
from scaffold_engine.wireframe.pipeline import (
    DEFAULT_MODEL_NAME,
    ScaffoldPipeline,
    ScannedDocumentError,
)

__all__ = [
    "ScaffoldPipeline",
    "ScannedDocumentError",
    "DEFAULT_MODEL_NAME",
]
