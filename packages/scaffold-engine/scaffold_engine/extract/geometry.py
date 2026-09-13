"""Geometry Extractor (하위 호환성 래퍼).

정본은 `scaffold_engine.wireframe.extract.geometry` 에 있습니다.
"""
from scaffold_engine.wireframe.extract.geometry import (
    Block,
    PageGeometry,
    PdfGeometryExtractor,
    TableGeometry,
    _align_of,
    _norm,
)

__all__ = [
    "Block",
    "PageGeometry",
    "PdfGeometryExtractor",
    "TableGeometry",
    "_align_of",
    "_norm",
]
