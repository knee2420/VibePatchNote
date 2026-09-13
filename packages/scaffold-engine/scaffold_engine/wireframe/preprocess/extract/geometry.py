"""Stage A — 결정적 기하 측정 (Wireframe 트랙).

정본 엔진 공용 도구는 `scaffold_engine.tools.pdf_geometry` 에 있습니다.
하위 호환성을 위해 동일 인터페이스를 re-export합니다.
"""
from scaffold_engine.tools.pdf_geometry import (
    Block,
    PageGeometry,
    PdfGeometryExtractor,
    TableGeometry,
    _align_of,
)

__all__ = [
    "Block",
    "PageGeometry",
    "PdfGeometryExtractor",
    "TableGeometry",
    "_align_of",
]
