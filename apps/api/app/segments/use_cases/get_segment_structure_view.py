"""Build the segment-centred view from independent artifact readers."""
from __future__ import annotations

import hashlib
import json

from ..errors import SegmentNotFoundError
from ..models import (
    SegmentMappingItem,
    SegmentRelationshipOverride,
    SegmentStructureView,
    StructureTarget,
)
from ..ports import (
    SegmentAgreementRepository,
    SegmentDocumentSource,
    SegmentMappingCache,
    SegmentOutlineReader,
    SegmentRepository,
    SegmentWireframeReader,
)


class GetSegmentStructureViewUseCase:
    """Deterministic mapping; this is deliberately not an Agent workflow."""

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

    def execute(self, doc_id: str) -> SegmentStructureView:
        if self._source.get_title(doc_id) is None:
            raise SegmentNotFoundError(f"Document not found: {doc_id}")
        segment_artifact = self._segments.load_head(doc_id)
        outline_id, elements = self._outlines.load_elements(doc_id)
        # **매핑 대상은 아웃라인 element 뿐이다.** 예전에는 와이어프레임 슬롯도
        # 대상이었는데, 리더가 문서의 *모든* 아카이브 스캐폴드를 훑는다. 스캐폴드가
        # 19개 쌓인 문서에서는 같은 슬롯이 19번 반복되어 147개가 올라왔고, 세그먼트
        # 하나에 140개가 붙어 패널을 쓸 수 없게 만들었다.
        # 포트(`self._wireframes`)와 `wireframe_block` 타입은 남겨 둔다 — 되돌릴 때
        # 이 한 곳만 다시 부르면 된다.
        agreements = self._agreements.list_for_document(doc_id)
        segment_id = segment_artifact.provenance.artifact_id if segment_artifact else None
        fingerprint = self._fingerprint(segment_id, outline_id, agreements)
        cached = self._cache.load(doc_id, fingerprint)
        if cached:
            return SegmentStructureView.model_validate(cached)

        mappings, stale_ids = self._map(
            segment_artifact.segments if segment_artifact else [],
            elements,
            agreements,
            segment_id,
            outline_id,
        )
        view = SegmentStructureView(
            docId=doc_id,
            segmentArtifactId=segment_id,
            outlineArtifactId=outline_id,
            segments=segment_artifact.segments if segment_artifact else [],
            outlineElements=elements,
            # 계약은 유지하고 내용만 비운다. 프론트의 와이어프레임 렌더 경로가
            # 살아 있어야 되돌리기가 한 줄로 끝난다.
            wireframeBlocks=[],
            mappings=mappings,
            staleOverrideIds=stale_ids,
        )
        self._cache.save(doc_id, fingerprint, view.model_dump(mode="json", by_alias=True))
        return view

    @staticmethod
    def _fingerprint(
        segment_id: str | None,
        outline_id: str | None,
        agreements: list[SegmentRelationshipOverride],
    ) -> str:
        raw = {
            "segment": segment_id,
            "outline": outline_id,
            "agreements": [item.agreement_id for item in agreements],
            # 매핑 규칙이 바뀌면 버전을 올린다. 올리지 않으면 이전 규칙으로 만든
            # 캐시(와이어프레임 147개가 들어 있는 뷰)를 그대로 다시 내보낸다.
            "engine": "2",
        }
        return hashlib.sha256(json.dumps(raw, sort_keys=True).encode()).hexdigest()[:20]

    def _map(
        self,
        segments: list,
        elements: list[StructureTarget],
        agreements: list[SegmentRelationshipOverride],
        segment_artifact_id: str | None,
        outline_artifact_id: str | None,
    ) -> tuple[list[SegmentMappingItem], list[str]]:
        latest: dict[tuple[str, str], SegmentRelationshipOverride] = {}
        stale: list[str] = []
        for agreement in agreements:
            valid_segment = agreement.segment_artifact_id == segment_artifact_id
            valid_outline = (
                agreement.target_kind != "outline_element"
                or agreement.outline_artifact_id == outline_artifact_id
            )
            if not valid_segment or not valid_outline:
                stale.append(agreement.agreement_id)
                continue
            latest[(agreement.target_kind, agreement.target_id)] = agreement

        mappings: list[SegmentMappingItem] = []
        for kind, targets in (("outline_element", elements),):
            for target in targets:
                override = latest.get((kind, target.id))
                if override is not None:
                    mappings.append(
                        SegmentMappingItem(
                            targetKind=kind,
                            targetId=target.id,
                            primarySegmentId=override.primary_segment_id,
                            confidence=1.0,
                            source="override",
                            reason="human relationship override",
                        )
                    )
                    continue
                segment_id, confidence, reason = self._best_segment(target, segments)
                mappings.append(
                    SegmentMappingItem(
                        targetKind=kind,
                        targetId=target.id,
                        primarySegmentId=segment_id,
                        confidence=confidence,
                        source="algorithm" if segment_id else "unassigned",
                        reason=reason,
                    )
                )
        return mappings, stale

    @staticmethod
    def _best_segment(target: StructureTarget, segments: list) -> tuple[str | None, float, str]:
        if not target.box_2d:
            return None, 0.0, "target has no bounding box"
        best_id: str | None = None
        best_score = 0.0
        for segment in segments:
            if segment.page != target.page:
                continue
            score = _coverage_score(target.box_2d, segment.box_2d)
            if score > best_score:
                best_id, best_score = segment.id, score
        if best_id is None or best_score < 0.25:
            return None, best_score, "no sufficient geometric overlap"
        return best_id, round(best_score, 4), "page-relative overlap"


def _coverage_score(target: list[int], segment: list[int]) -> float:
    ty1, tx1, ty2, tx2 = target
    sy1, sx1, sy2, sx2 = segment
    inter_h = max(0, min(ty2, sy2) - max(ty1, sy1))
    inter_w = max(0, min(tx2, sx2) - max(tx1, sx1))
    if not inter_h or not inter_w:
        return 0.0
    intersection = inter_h * inter_w
    target_area = (ty2 - ty1) * (tx2 - tx1)
    segment_area = (sy2 - sy1) * (sx2 - sx1)
    coverage = intersection / target_area
    iou = intersection / (target_area + segment_area - intersection)
    return max(coverage * 0.9, iou)
