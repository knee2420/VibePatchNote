from __future__ import annotations

from app.core.storage import AGREEMENT_PREFIX, new_id

from ..errors import SegmentNotFoundError
from ..models import SegmentRelationshipOverride
from ..ports import (
    SegmentAgreementRepository,
    SegmentDocumentSource,
    SegmentMappingCache,
    SegmentRepository,
)


class ResetRelationshipOverrideUseCase:
    """사람이 정한 포함 관계를 물러 자동 분석 결과로 되돌린다.

    **이력은 지우지 않는다.** 관계 합의는 append-only 이고 사람이 만든 결과물이다.
    그래서 파일을 없애는 대신 철회 기록을 덧붙이고, 매핑이 그것을 "결정 없음"으로
    읽는다. 되돌린 적이 있다는 사실 자체도 남아야 나중에 설명할 수 있다.
    """

    def __init__(
        self,
        source: SegmentDocumentSource,
        segments: SegmentRepository,
        agreements: SegmentAgreementRepository,
        cache: SegmentMappingCache,
    ) -> None:
        self._source = source
        self._segments = segments
        self._agreements = agreements
        self._cache = cache

    def execute(
        self,
        doc_id: str,
        *,
        target_kind: str,
        target_id: str,
    ) -> SegmentRelationshipOverride | None:
        if self._source.get_title(doc_id) is None:
            raise SegmentNotFoundError(f"Document not found: {doc_id}")

        effective = self._effective(doc_id, target_kind, target_id)
        if effective is None:
            # 되돌릴 결정이 없다. 철회 기록만 쌓는 대신 조용히 끝낸다.
            return None

        revocation = SegmentRelationshipOverride(
            agreementId=new_id(AGREEMENT_PREFIX),
            docId=doc_id,
            targetKind=target_kind,
            targetId=target_id,
            primarySegmentId=None,
            segmentArtifactId=effective.segment_artifact_id,
            outlineArtifactId=effective.outline_artifact_id,
            revoked=True,
        )
        self._agreements.append(revocation)
        self._cache.clear(doc_id)
        return revocation

    def _effective(
        self, doc_id: str, target_kind: str, target_id: str
    ) -> SegmentRelationshipOverride | None:
        """이 대상에 대해 현재 살아 있는 사람의 결정."""
        latest: SegmentRelationshipOverride | None = None
        for agreement in self._agreements.list_for_document(doc_id):
            if agreement.target_kind != target_kind or agreement.target_id != target_id:
                continue
            latest = agreement
        if latest is None or latest.revoked:
            return None
        return latest
