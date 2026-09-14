"""Independent segments aggregate: storage lifetime and mapping policy."""
from __future__ import annotations

from pathlib import Path

import pytest
from agent_core.runtime.events import AgentRunEvent
from agent_runtime import RunCost

from app.segments.adapters import (
    LocalSegmentAgreementRepository,
    LocalSegmentMappingCache,
    LocalSegmentRepository,
    SegmentCleanupAdapter,
)
from app.segments.errors import SegmentNotFoundError
from app.segments.models import (
    DocumentSegment,
    SegmentArtifact,
    SegmentArtifactProvenance,
    StructureTarget,
)
from app.segments.schemas import to_run_result
from app.segments.use_cases import (
    GetAdoptedSegmentsUseCase,
    GetSegmentStructureViewUseCase,
    SaveSegmentRevisionUseCase,
    SetRelationshipOverrideUseCase,
)

DOC_ID = "doc-segments-test"


class Source:
    def get_title(self, doc_id: str) -> str | None:
        return "reference.pdf" if doc_id == DOC_ID else None


class Outlines:
    def load_elements(self, _doc_id: str):
        return "outline-a1", [
            StructureTarget(
                id="element-1", page=1, label="적용 범위", type="paragraph",
                box_2d=[100, 100, 350, 900], artifactId="outline-a1",
            )
        ]


class Wireframes:
    def load_blocks(self, _doc_id: str):
        return [
            StructureTarget(
                id="scaffold-r1:slot-1", page=1, label="본문 블록", type="wireframe_slot",
                box_2d=[400, 100, 700, 900], scaffoldId="scaffold-r1",
            )
        ]


def _artifact(artifact_id: str, segments: list[DocumentSegment]) -> SegmentArtifact:
    return SegmentArtifact(
        provenance=SegmentArtifactProvenance(
            artifactId=artifact_id,
            docId=DOC_ID,
            runId="run-test",
            traceId="run-test",
            cost=RunCost(),
        ),
        documentTitle="reference.pdf",
        totalPages=1,
        segments=segments,
    )


def test_segments_have_independent_storage_and_human_override_lifecycle(tmp_path: Path) -> None:
    knowledge_root = tmp_path / "data" / "knowledge" / "segments"
    agreements_root = tmp_path / "data" / "agreements"
    cache_root = tmp_path / "cache" / "segments"
    repository = LocalSegmentRepository(knowledge_root)
    agreements = LocalSegmentAgreementRepository(agreements_root)
    cache = LocalSegmentMappingCache(cache_root)
    source, outlines, wireframes = Source(), Outlines(), Wireframes()

    first_segments = [
        DocumentSegment(id="seg-top", page=1, type="paragraph", label="상단", box_2d=[0, 0, 400, 1000]),
        DocumentSegment(id="seg-bottom", page=1, type="table", label="하단", box_2d=[400, 0, 1000, 1000]),
    ]
    repository.commit(_artifact("segment-a1", first_segments))

    view = GetSegmentStructureViewUseCase(source, repository, agreements, cache, outlines, wireframes).execute(DOC_ID)
    by_target = {item.target_id: item for item in view.mappings}
    assert by_target["element-1"].primary_segment_id == "seg-top"
    assert by_target["element-1"].source == "algorithm"

    # **매핑 대상은 아웃라인 element 뿐이다.** 와이어프레임 슬롯을 대상으로 삼으면
    # 리더가 문서의 *모든* 아카이브 스캐폴드를 훑기 때문에 같은 슬롯이 리비전 수만큼
    # 반복된다. 실제로 스캐폴드 19개가 쌓인 문서에서 147개가 올라와 세그먼트 하나에
    # 140개가 붙었다.
    assert "scaffold-r1:slot-1" not in by_target
    assert view.wireframe_blocks == []

    override = SetRelationshipOverrideUseCase(
        source, repository, agreements, cache, outlines, wireframes,
    ).execute(
        DOC_ID,
        target_kind="outline_element",
        target_id="element-1",
        primary_segment_id="seg-bottom",
    )
    overridden = GetSegmentStructureViewUseCase(source, repository, agreements, cache, outlines, wireframes).execute(DOC_ID)
    relation = next(item for item in overridden.mappings if item.target_id == "element-1")
    assert relation.primary_segment_id == "seg-bottom"
    assert relation.source == "override"

    revised = SaveSegmentRevisionUseCase(source, repository, cache).execute(
        DOC_ID,
        base_artifact_id="segment-a1",
        segments=first_segments,
    )
    assert revised.provenance.artifact_id != "segment-a1"
    after_revision = GetSegmentStructureViewUseCase(source, repository, agreements, cache, outlines, wireframes).execute(DOC_ID)
    assert override.agreement_id in after_revision.stale_override_ids
    relation = next(item for item in after_revision.mappings if item.target_id == "element-1")
    assert relation.primary_segment_id == "seg-top"
    assert relation.source == "algorithm"

    assert (knowledge_root / DOC_ID / "artifacts" / "segment-a1" / "segments.json").is_file()
    assert (agreements_root / "segment-relations" / DOC_ID / f"{override.agreement_id}.json").is_file()
    assert any((cache_root / DOC_ID).glob("effective-mapping-*.json"))
    assert not (tmp_path / "data" / "knowledge" / "documents" / DOC_ID / "artifacts" / "segments").exists()

    SegmentCleanupAdapter(repository, agreements, cache).delete_for_document(DOC_ID)
    assert not (knowledge_root / DOC_ID).exists()
    assert not (agreements_root / "segment-relations" / DOC_ID).exists()
    assert not (cache_root / DOC_ID).exists()


def test_unscanned_document_reads_as_empty_not_missing(tmp_path: Path) -> None:
    """아직 스캔하지 않은 문서는 빈 상태다. 없는 문서와 구분되어야 한다.

    카드가 마운트될 때마다 채택본을 한 번 읽는데, 여기서 "아직 없음"을 404 로
    돌려주면 정상 흐름이 오류가 되고 진짜 404 를 가린다.
    """
    repository = LocalSegmentRepository(tmp_path / "data" / "knowledge" / "segments")
    use_case = GetAdoptedSegmentsUseCase(Source(), repository)

    title, artifact = use_case.execute(DOC_ID)
    assert title == "reference.pdf"
    assert artifact is None

    repository.commit(_artifact("segment-a1", [
        DocumentSegment(id="seg-top", page=1, type="paragraph", label="상단", box_2d=[0, 0, 400, 1000]),
    ]))
    title, artifact = use_case.execute(DOC_ID)
    assert artifact is not None
    assert artifact.provenance.artifact_id == "segment-a1"

    with pytest.raises(SegmentNotFoundError):
        use_case.execute("doc-does-not-exist")


def test_run_result_is_recordable_by_the_agent_runtime() -> None:
    """추출 결과는 런타임 이력에 그대로 들어갈 수 있어야 한다.

    런타임의 `AgentRunEvent.result` 는 dict 만 받는다. 도메인 객체를 그대로
    넘기면 종결 이벤트를 만들다 터지고, 그 예외는 실행 태스크와 함께 조용히
    사라져 run 이 영원히 running 으로 남는다.
    """
    artifact = _artifact("segment-a1", [
        DocumentSegment(id="seg-top", page=1, type="paragraph", label="상단", box_2d=[0, 0, 400, 1000]),
    ])

    payload = to_run_result(artifact)
    event = AgentRunEvent(type="succeeded", result=payload)

    assert event.result is not None
    assert event.result["artifactId"] == "segment-a1"
    assert event.result["docId"] == DOC_ID
    assert len(event.result["segments"]) == 1
