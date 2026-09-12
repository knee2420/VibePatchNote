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
from scaffold_engine.core.pipeline import ScaffoldPipeline

from app.core.config import settings
from app.core.llm.tracer import ingest_pipeline_telemetry
from main import app

client = TestClient(app)

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
    ingest_pipeline_telemetry(
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
