"""documents 도메인의 외부 시스템 어댑터.

수명주기가 다른 저장소는 어댑터도 따로 둔다. 하나로 합치면 "지워도 되는가"가
다시 흐려진다.
"""

from .local_document_artifact_repository import LocalDocumentArtifactRepository
from .local_document_cache_repository import LocalDocumentCacheRepository
from .local_document_source_repository import LocalDocumentSourceRepository
from .native_segment_scan_adapter import EngineSegmentScanAdapter

__all__ = [
    "LocalDocumentSourceRepository",
    "LocalDocumentArtifactRepository",
    "LocalDocumentCacheRepository",
    "EngineSegmentScanAdapter",
]
