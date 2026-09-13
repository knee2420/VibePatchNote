"""아웃라인 파이프라인의 엔드-투-엔드 관측(Telemetry) 스팬 수집 검증 테스트."""
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from agent_telemetry import current_collector
from scaffold_engine import OutlineDocument

from app.documents.adapters import (
    DocumentOutlineArchiveAdapter,
    DocumentTelemetryAdapter,
    EngineOutlineExtractAdapter,
)
from app.documents.agents import ExtractOutlineUseCase
from app.documents.models import ArtifactProvenance, DocumentMeta


@pytest.mark.anyio
async def test_extract_outline_collects_full_lifecycle_spans(tmp_path: Path):
    """캐시 검사 -> 하네스 라우팅 -> 엔진 실행 -> 아티팩트 커밋까지 7단계 스팬이 단일 수집기에 기록되는지 검증."""
    doc_id = "doc-test-obs-123"
    meta = DocumentMeta(
        doc_id=doc_id,
        original_name="sample_test.pdf",
        stored_name="source.pdf",
        stored_path="sample_test.pdf",
        mime="application/pdf",
        size_bytes=1024,
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    )


    # 1. 목(Mock) 소스 저장소
    source_repo = MagicMock()
    source_repo.get.return_value = meta
    source_repo.resolve_file.return_value = tmp_path / "sample.pdf"

    # 2. 목 아티팩트 저장소 (첫 호출 시 캐시 미스 -> 커밋)
    artifact_repo = MagicMock()
    artifact_repo.load_head.return_value = None
    artifact_repo.commit.return_value = ArtifactProvenance(
        artifact_id="art-test-999",
        kind="outline",
        doc_id=doc_id,
        status="SUCCESS",
        run_id="run-test-123",
        trace_id="run-test-123",
        model="gemini-3.5-flash-lite",
    )

    archive_adapter = DocumentOutlineArchiveAdapter(artifacts=artifact_repo)

    # 3. 목 하네스 및 캐시 저장소
    mock_harness = MagicMock()
    mock_harness.model = "gemini-3.5-flash-lite"
    mock_harness.primary_provider = "google_api"
    cache_repo = MagicMock()
    cache_repo.context_dir.return_value = tmp_path / "cache"

    engine_adapter = EngineOutlineExtractAdapter(harness=mock_harness, cache=cache_repo)

    # 엔진 extract 모킹: 실행 중 current_collector()에 엔진 4단계 스팬을 시뮬레이션 기록
    async def mock_extract(*args, **kwargs):
        collector = current_collector()
        assert collector is not None, "상위 워크플로우 수집기가 활성화되어 있어야 합니다"
        engine_adapter._resolve_routing(doc_id=doc_id)
        with collector.step("DocumentContextBuilder"):
            pass
        with collector.step("PromptAssembly"):
            pass
        with collector.step("LlmInference"):
            pass
        with collector.step("OutlineSchemaValidation"):
            pass

        return OutlineDocument(
            document_title=meta.original_name,
            total_pages=1,
            outlines=[],
            flat_elements=[],
            markdown_outline="# Title",
            telemetry={"status": "SUCCESS"},
        )

    engine_adapter.extract = mock_extract

    captured_telemetries = []

    class TestTelemetryAdapter(DocumentTelemetryAdapter):
        def workflow_session(self, **kwargs):
            from contextlib import contextmanager

            @contextmanager
            def _intercepted_session():
                with super(TestTelemetryAdapter, self).workflow_session(**kwargs) as col:
                    yield col
                    captured_telemetries.append(col.export_telemetry())

            return _intercepted_session()

    test_telemetry = TestTelemetryAdapter()

    use_case = ExtractOutlineUseCase(
        source=source_repo,
        engine=engine_adapter,
        archive=archive_adapter,
        telemetry=test_telemetry,
    )

    # 5. 실행
    res = await use_case.execute(doc_id, force_refresh=True)
    assert res["status"] == "completed"

    # 6. 스팬 검증
    assert len(captured_telemetries) == 1, "텔레메트리가 1건 캡처되어야 합니다"
    telemetry = captured_telemetries[0]
    span_names = [s.name for s in telemetry.spans]

    assert "CacheAndHeadInspection" in span_names, f"CacheAndHeadInspection 누락: {span_names}"
    assert "HarnessPolicyAndRouting" in span_names, f"HarnessPolicyAndRouting 누락: {span_names}"
    assert "DocumentContextBuilder" in span_names
    assert "PromptAssembly" in span_names
    assert "LlmInference" in span_names
    assert "OutlineSchemaValidation" in span_names
    assert "OutlineArtifactCommit" in span_names, f"OutlineArtifactCommit 누락: {span_names}"

    assert len(telemetry.spans) == 7


@pytest.mark.anyio
async def test_extract_outline_cache_hit_emits_single_inspection_span(tmp_path: Path):
    """채택본이 이미 존재할 때 force_refresh=False 이면 CacheAndHeadInspection 1건만 기록되고 즉시 반환되는지 검증."""
    doc_id = "doc-test-cache-hit"
    meta = DocumentMeta(
        doc_id=doc_id,
        original_name="sample_cached.pdf",
        stored_name="source.pdf",
        stored_path="sample_cached.pdf",
        mime="application/pdf",
        size_bytes=2048,
        sha256="abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    )

    source_repo = MagicMock()
    source_repo.get.return_value = meta

    from app.documents.models import OUTLINE_TREE_FILE

    # 채택본 반환 모킹
    artifact_repo = MagicMock()
    artifact_repo.load_head.return_value = {
        OUTLINE_TREE_FILE: {
            "document_title": meta.original_name,
            "total_pages": 1,
            "outlines": [{"id": "out-1", "level": 1, "title": "Heading 1", "elements": []}],
        },
        "provenance": {
            "artifact_id": "art-cached-111",
            "summary": {"totalPages": 1, "totalOutlines": 1, "totalElements": 0},
        },
    }


    archive_adapter = DocumentOutlineArchiveAdapter(artifacts=artifact_repo)
    engine_adapter = MagicMock()

    captured_telemetries = []

    class TestTelemetryAdapter(DocumentTelemetryAdapter):
        def workflow_session(self, **kwargs):
            from contextlib import contextmanager

            @contextmanager
            def _intercepted_session():
                with super(TestTelemetryAdapter, self).workflow_session(**kwargs) as col:
                    yield col
                    captured_telemetries.append(col.export_telemetry())

            return _intercepted_session()

    test_telemetry = TestTelemetryAdapter()

    use_case = ExtractOutlineUseCase(
        source=source_repo,
        engine=engine_adapter,
        archive=archive_adapter,
        telemetry=test_telemetry,
    )

    res = await use_case.execute(doc_id, force_refresh=False)

    assert res["status"] == "completed"
    assert engine_adapter.extract.called is False, "캐시 히트 시 엔진이 호출되지 않아야 합니다"

    assert len(captured_telemetries) == 1
    telemetry = captured_telemetries[0]
    assert len(telemetry.spans) == 1
    assert telemetry.spans[0].name == "CacheAndHeadInspection"
    assert "채택본(HEAD) 재사용" in (telemetry.spans[0].summary_pill or "")


