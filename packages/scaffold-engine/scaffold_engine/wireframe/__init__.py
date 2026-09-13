"""Scaffold Engine — Wireframe Extraction & Assembly Package.

임의의 PDF 에서 실측 기하 기반으로 서식 뼈대와 입력 슬롯(Tiptap HTML & Markdown)을 생성하는 고정밀 엔진입니다.
"""
from .assemble.html import HtmlAssembler
from .classify.agent import SlotClassifier
from .extract.geometry import (
    Block,
    PageGeometry,
    PdfGeometryExtractor,
    TableGeometry,
)
from .pipeline import ScaffoldPipeline, ScannedDocumentError
from .schemas.models import (
    ScaffoldExtractResult,
    ScaffoldMeta,
    SlotMappingItem,
)
from .score.fidelity import FidelityReport, score_page

__all__ = [
    "ScaffoldPipeline",
    "ScannedDocumentError",
    "ScaffoldExtractResult",
    "ScaffoldMeta",
    "SlotMappingItem",
    "PdfGeometryExtractor",
    "PageGeometry",
    "Block",
    "TableGeometry",
    "SlotClassifier",
    "HtmlAssembler",
    "score_page",
    "FidelityReport",
]
