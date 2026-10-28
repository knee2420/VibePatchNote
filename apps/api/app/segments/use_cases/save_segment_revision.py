from __future__ import annotations

from app.core.storage import ARTIFACT_PREFIX, new_id

from ..errors import SegmentNotFoundError, SegmentRevisionConflictError
from ..models import DocumentSegment, SegmentArtifact, SegmentArtifactProvenance
from ..ports import SegmentDocumentSource, SegmentMappingCache, SegmentRepository


class SaveSegmentRevisionUseCase:
    def __init__(
        self,
        source: SegmentDocumentSource,
        repository: SegmentRepository,
        cache: SegmentMappingCache,
    ) -> None:
        self._source = source
        self._repository = repository
        self._cache = cache

    def execute(
        self,
        doc_id: str,
        *,
        base_artifact_id: str | None,
        segments: list[DocumentSegment],
    ) -> SegmentArtifact:
        title = self._source.get_title(doc_id)
        if title is None:
            raise SegmentNotFoundError(f"Document not found: {doc_id}")
        current = self._repository.load_head(doc_id)
        current_id = current.provenance.artifact_id if current else None
        if current_id != base_artifact_id:
            raise SegmentRevisionConflictError(current_id)

        artifact = SegmentArtifact(
            provenance=SegmentArtifactProvenance(
                artifactId=new_id(ARTIFACT_PREFIX),
                docId=doc_id,
                status="USER_EDITED",
                summary={"totalSegments": len(segments), "baseArtifactId": base_artifact_id},
            ),
            documentTitle=current.document_title if current else title,
            totalPages=current.total_pages if current else 1,
            segments=segments,
        )
        self._repository.commit(artifact)
        self._cache.clear(doc_id)
        return artifact
