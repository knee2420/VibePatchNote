"""documents 도메인의 외부 시스템 어댑터."""

from .local_document_analysis_repository import LocalDocumentAnalysisRepository
from .local_document_source_repository import LocalDocumentSourceRepository
from .local_outline_storage import OutlineStorageRepository
from .native_segment_scan_adapter import EngineSegmentScanAdapter

__all__ = [
    "LocalDocumentAnalysisRepository",
    "LocalDocumentSourceRepository",
    "OutlineStorageRepository",
    "EngineSegmentScanAdapter",
]
