"""A3 검증 — 두 번째 워크플로우가 Inspector 코드 수정 없이 보이는가.

이것이 추상화 성공의 유일한 증거다. `ScaffoldPipeline` 은 계측이 0이었고,
Inspector 는 outline 파이프라인만 알고 있었다. 아래가 통과한다면 Inspector 는
더 이상 특정 워크플로우를 알지 못한다.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from scaffold_engine.wireframe import ScaffoldPipeline

from app.core.config import settings
from main import app

client = TestClient(app)


def _ingest(telemetry, **kwargs):
    """관측 자료 저장은 주입받은 store 가 한다. 테스트도 같은 경로를 쓴다."""
    from app.core.observation import RunObservationStore

    return RunObservationStore(settings.storage.runs).ingest(telemetry, **kwargs)

SAMPLE_PDF = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "sample.pdf"


class _StubHarness:
    """AI 호출 없이 판정 단계를 대신한다. 계측 배선만 검증한다."""

    name = "stub-harness"

    def run_json(self, prompt, schema=None, retries=2, retry_hint=""):
        return {"doc_title": "테스트 문서", "blocks": []}


def _make_pdf(path: Path) -> None:
    """텍스트 레이어가 있는 최소 PDF 한 장."""
    import pymupdf

    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 100), "Test Heading", fontsize=18)
    page.insert_text((72, 140), "body text line", fontsize=11)
    doc.save(path)
    doc.close()


@pytest.fixture
def scaffold_run(tmp_path: Path):
    """ScaffoldPipeline 을 한 번 돌리고 그 계측을 저장소에 넣는다."""
    pdf = tmp_path / "sample.pdf"
    _make_pdf(pdf)

    pipeline = ScaffoldPipeline(harness=_StubHarness())
    try:
        pipeline.run(pdf, display_name="와이어프레임_대상.pdf")
    except Exception:
        # 판정이 비어 조립이 실패할 수 있다. 계측은 finally 에서 남으므로
        # 그 자체가 이 테스트의 관심사다 — 실패한 run 도 관측되어야 한다.
        pass

    telemetry = pipeline.last_telemetry
    assert telemetry is not None, "실패해도 계측은 남아야 합니다"

    run_id = "test-scaffold-observability"
    run_dir = settings.storage.runs / run_id
    _ingest(
        telemetry, run_id=run_id, doc_id=None, target_name="와이어프레임_대상.pdf"
    )
    try:
        yield run_id
    finally:
        import shutil

        shutil.rmtree(run_dir, ignore_errors=True)


def test_scaffold_pipeline_emits_telemetry(scaffold_run: str) -> None:
    """계측 0이던 파이프라인이 이제 단계를 남긴다."""
    meta = json.loads(
        (settings.storage.runs / scaffold_run / "meta.json").read_text(encoding="utf-8")
    )
    assert meta["pipeline_name"] == "ScaffoldPipeline"
    assert meta["workflow_name"] == "documents.generate_scaffold"
    # 라벨은 파이프라인이 기록 시점에 정한다. 조회 계층이 지어내지 않는다.
    assert meta["workflow_label"] == "와이어프레임 생성"
    assert meta["spans_count"] > 0


def test_scaffold_run_appears_without_inspector_changes(scaffold_run: str) -> None:
    """Inspector 는 이 워크플로우의 이름을 모른다. 그래도 목록에 뜬다."""
    runs = client.get("/api/v1/inspector/runs").json()
    found = next((r for r in runs if r["run_id"] == scaffold_run), None)

    assert found is not None, "새 워크플로우가 목록에 뜨지 않습니다"
    assert found["workflow_label"] == "와이어프레임 생성"
    assert found["target_name"] == "와이어프레임_대상.pdf"
    assert found["has_span_detail"] is True


def test_scaffold_spans_are_domain_neutral(scaffold_run: str) -> None:
    """스팬은 계약 어휘만 쓴다. Inspector 가 특별 취급할 것이 없다."""
    detail = client.get(f"/api/v1/inspector/runs/{scaffold_run}").json()
    spans = detail["spans"]
    assert spans, "스팬이 없습니다"

    known_types = {"pipeline", "chain", "llm", "tool", "parser"}
    known_statuses = {"pending", "running", "success", "failed", "skipped"}
    for span in spans:
        assert span["span_type"] in known_types
        assert span["status"] in known_statuses
        # 사람이 읽을 라벨은 기록 시점에 붙어 있다.
        assert span["display_label"], f"{span['name']} 에 라벨이 없습니다"


def test_scaffold_sources_resolve(scaffold_run: str) -> None:
    """새 워크플로우의 코드 지점도 그대로 열린다. 하드코딩 표가 없다."""
    detail = client.get(f"/api/v1/inspector/runs/{scaffold_run}").json()

    checked = 0
    for span in detail["spans"]:
        for source in span.get("sources", []):
            if source["kind"] == "model" or not source["module"]:
                continue
            resp = client.get(
                "/api/v1/inspector/source",
                params={"module": source["module"], "symbol": source["qualname"]},
            )
            assert resp.status_code == 200, (
                f"{source['module']}::{source['qualname']} 를 열지 못했습니다"
            )
            assert "node_modules" not in resp.json()["file_path"]
            checked += 1

    assert checked > 0, "확인할 코드 지점이 없습니다"


@pytest.mark.anyio
async def test_generate_scaffold_collects_full_lifecycle_spans(tmp_path: Path):
    """GenerateScaffoldUseCase 실행 시 하네스 라우팅 -> 기하 실측 -> 슬롯 분류 -> HTML 조립 -> 아티팩트 커밋 5단계 스팬 검증."""
    from unittest.mock import MagicMock

    from agent_telemetry import current_collector
    from scaffold_engine import ScaffoldMeta

    from app.documents.models import DocumentMeta
    from app.wireframe.adapters import (
        EngineWireframeExtractAdapter as EngineScaffoldExtractAdapter,
    )
    from app.wireframe.adapters import (
        WireframeTelemetryAdapter,
    )
    from app.wireframe.agents import GenerateWireframeUseCase as GenerateScaffoldUseCase

    doc_id = "doc-test-scaffold-123"
    pdf = tmp_path / "sample.pdf"
    _make_pdf(pdf)

    meta = DocumentMeta(
        doc_id=doc_id,
        original_name="sample.pdf",
        stored_name="sample.pdf",
        stored_path=str(pdf),
        mime="application/pdf",
        size_bytes=1024,
        sha256="abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    )

    source_repo = MagicMock()
    source_repo.get.return_value = meta
    source_repo.resolve_file.return_value = pdf

    mock_harness = MagicMock()
    mock_harness.model = "gemini-3.5-flash-lite"
    mock_harness.primary_provider = "google_api"

    engine_adapter = EngineScaffoldExtractAdapter(harness=mock_harness)

    async def mock_extract(*args, **kwargs):
        collector = current_collector()
        assert collector is not None, "상위 워크플로우 수집기가 활성화되어 있어야 합니다"
        engine_adapter._resolve_routing()
        with collector.step("GeometryExtraction"):
            pass
        with collector.step("SlotClassification"):
            pass
        with collector.step("HtmlAssembly"):
            pass
        from app.wireframe.ports import WireframeExtractOutput

        return WireframeExtractOutput(
            meta=ScaffoldMeta(
                id="scaffold-test",
                title="테스트 서식 틀",
                target_doc="sample.pdf",
                source_pdf_file_name="sample.pdf",
            ),
            html_content="<div>Scaffold</div>",
            markdown_content="# Scaffold",
            slots=[],
            telemetry={"status": "SUCCESS"},
        )


    engine_adapter.extract = mock_extract

    archive_service = MagicMock()
    archive_meta_mock = MagicMock()
    archive_meta_mock.model_dump.return_value = {"scaffold_id": "scaffold-123"}

    # archive_scaffold 호출 시 스팬 기록 시뮬레이션
    def mock_archive(*args, **kwargs):
        col = current_collector()
        if col:
            with col.step("ScaffoldArtifactCommit"):
                pass
        return archive_meta_mock

    archive_service.archive_scaffold = mock_archive

    captured_telemetries = []

    class TestTelemetryAdapter(WireframeTelemetryAdapter):
        def workflow_session(self, **kwargs):
            from contextlib import contextmanager

            @contextmanager
            def _intercepted_session():
                with super(TestTelemetryAdapter, self).workflow_session(**kwargs) as col:
                    yield col
                    captured_telemetries.append(col.export_telemetry())

            return _intercepted_session()

    from app.core.observation import RunObservationStore

    test_telemetry = TestTelemetryAdapter(store=RunObservationStore(tmp_path / "runs"))

    from agent_runtime import AgentRuntime, LocalAgentRunRepository, LocalLedger

    use_case = GenerateScaffoldUseCase(
        source=source_repo,
        engine=engine_adapter,
        archive=archive_service,
        # 런타임은 대역이 아니라 본 물건을 쓴다. 협력자가 필수가 된 뒤로
        # "런타임 없는 유스케이스"는 프로덕션에 없는 조합이다.
        agent_runtime=AgentRuntime(
            runs=LocalAgentRunRepository(tmp_path / "runs"),
            ledger=LocalLedger(tmp_path / "ledger"),
        ),
        telemetry=test_telemetry,
    )


    res = await use_case.execute(doc_id)
    assert res["status"] == "completed"

    assert len(captured_telemetries) == 1
    telemetry = captured_telemetries[0]
    span_names = [s.name for s in telemetry.spans]

    assert "HarnessPolicyAndRouting" in span_names
    assert "GeometryExtraction" in span_names
    assert "SlotClassification" in span_names
    assert "HtmlAssembly" in span_names
    assert "ScaffoldArtifactCommit" in span_names
    assert len(telemetry.spans) == 5


def test_scaffold_pipeline_records_usage_and_provider(tmp_path: Path) -> None:
    """ScaffoldPipeline이 하네스 실행 결과의 토큰과 공급자/모델명을 텔레메트리에 온전히 기록한다."""
    from llm_driver.base import BaseLlmHarness, LlmExecutionResult

    class _MockHarness(BaseLlmHarness):
        name = "mock_google_api"

        def __init__(self) -> None:
            super().__init__(model="gemini-3.5-flash-lite")

        @property
        def primary_provider(self) -> str:
            return "google_api"

        def run_structured(self, prompt: str, **kwargs) -> LlmExecutionResult:
            return LlmExecutionResult(
                status="SUCCESS",
                model="gemini-3.5-flash-lite",
                structured_output={"doc_title": "테스트 문서", "blocks": []},
                input_tokens=2500,
                output_tokens=800,
                total_tokens=3300,
                telemetry_metadata={"provider": "google_api"},
            )

    pdf = tmp_path / "test_usage.pdf"
    _make_pdf(pdf)

    harness = _MockHarness()
    pipeline = ScaffoldPipeline(harness=harness)
    pipeline.run(pdf, display_name="테스트_와이어프레임.pdf")

    telemetry = pipeline.last_telemetry
    assert telemetry is not None
    assert telemetry.provenance.get("model") == "gemini-3.5-flash-lite"
    assert telemetry.provenance.get("provider") == "google_api"
    assert telemetry.total_usage.prompt_tokens == 2500
    assert telemetry.total_usage.completion_tokens == 800

    llm_span = next((s for s in telemetry.spans if s.name == "LlmInference"), None)
    assert llm_span is not None
    assert "execution_command" in llm_span.inputs
    assert "curl" in llm_span.inputs["execution_command"]
    assert "prompt" in llm_span.inputs
    assert "structured_output" in llm_span.outputs

    run_id = "test-scaffold-usage-run"
    run_dir = settings.storage.runs / run_id
    try:
        _ingest(
            telemetry,
            run_id=run_id,
            doc_id=None,
            target_name="테스트_와이어프레임.pdf",
        )
        runs = client.get("/api/v1/inspector/runs").json()
        found = next((r for r in runs if r["run_id"] == run_id), None)
        assert found is not None
        assert found["primary_provider"] == "google_api"
        assert found["primary_model"] == "gemini-3.5-flash-lite"
        assert found["input_tokens"] == 2500
        assert found["output_tokens"] == 800
    finally:
        import shutil
        shutil.rmtree(run_dir, ignore_errors=True)


