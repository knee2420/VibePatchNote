"""Cleanup adapter exposed to the documents aggregate through its port."""
from __future__ import annotations

from ..ports import SegmentAgreementRepository, SegmentMappingCache, SegmentRepository


class SegmentCleanupAdapter:
    def __init__(
        self,
        repository: SegmentRepository,
        agreements: SegmentAgreementRepository,
        cache: SegmentMappingCache,
    ) -> None:
        self._repository = repository
        self._agreements = agreements
        self._cache = cache

    def delete_for_document(self, doc_id: str) -> None:
        self._repository.delete_for_document(doc_id)
        self._agreements.delete_for_document(doc_id)
        self._cache.clear(doc_id)
