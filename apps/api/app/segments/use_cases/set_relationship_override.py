from __future__ import annotations

from app.core.storage import AGREEMENT_PREFIX, new_id

from ..errors import SegmentNotFoundError, SegmentRelationshipTargetError
from ..models import SegmentRelationshipOverride
from ..ports import (
    SegmentAgreementRepository,
    SegmentDocumentSource,
    SegmentMappingCache,
    SegmentOutlineReader,
    SegmentRepository,
    SegmentWireframeReader,
)


class SetRelationshipOverrideUseCase:
    def __init__(
        self,
        source: SegmentDocumentSource,
        segments: SegmentRepository,
        agreements: SegmentAgreementRepository,
        cache: SegmentMappingCache,
        outlines: SegmentOutlineReader,
        wireframes: SegmentWireframeReader,
    ) -> None:
        self._source = source
        self._segments = segments
        self._agreements = agreements
        self._cache = cache
        self._outlines = outlines
        self._wireframes = wireframes

    def execute(
        self,
        doc_id: str,
        *,
        target_kind: str,
        target_id: str,
        primary_segment_id: str | None,
    ) -> SegmentRelationshipOverride:
        if self._source.get_title(doc_id) is None:
            raise SegmentNotFoundError(f"Document not found: {doc_id}")
        artifact = self._segments.load_head(doc_id)
        if artifact is None:
            raise SegmentRelationshipTargetError("Segments must be extracted before mapping.")
        outline_id, elements = self._outlines.load_elements(doc_id)
        blocks = self._wireframes.load_blocks(doc_id)
        targets = elements if target_kind == "outline_element" else blocks if target_kind == "wireframe_block" else []
        target = next((item for item in targets if item.id == target_id), None)
        if target is None:
            raise SegmentRelationshipTargetError("The relationship target does not exist in its adopted artifact.")
        if primary_segment_id is not None:
            segment = next((item for item in artifact.segments if item.id == primary_segment_id), None)
            if segment is None:
                raise SegmentRelationshipTargetError("The selected segment is not in the adopted revision.")
            if segment.page != target.page:
                raise SegmentRelationshipTargetError("A target can only belong to a segment on the same page.")

        override = SegmentRelationshipOverride(
            agreementId=new_id(AGREEMENT_PREFIX),
            docId=doc_id,
            targetKind=target_kind,
            targetId=target_id,
            primarySegmentId=primary_segment_id,
            segmentArtifactId=artifact.provenance.artifact_id,
            outlineArtifactId=outline_id if target_kind == "outline_element" else None,
        )
        self._agreements.append(override)
        self._cache.clear(doc_id)
        return override
