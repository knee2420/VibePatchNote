"""Inspector 엔드포인트 및 서비스 단위 테스트."""
import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import settings
from main import app

client = TestClient(app)


def test_inspector_matrix():
    response = client.get("/api/v1/inspector/matrix")
    assert response.status_code == 200
    data = response.json()
    assert "primary_provider" in data
    assert "fallback_provider" in data
    assert "models" in data
    assert len(data["models"]) > 0
    names = [m["name"] for m in data["models"]]
    assert any("gemini" in n.lower() or "gemma" in n.lower() for n in names)


def test_inspector_runs_and_detail(tmp_path: Path):
    runs_dir = settings.storage.runs
    runs_dir.mkdir(parents=True, exist_ok=True)

    test_run_id = "test-run-telemetry-001"
    run_path = runs_dir / test_run_id
    run_path.mkdir(parents=True, exist_ok=True)

    try:
        # meta.json 작성
        meta_data = {
            "run_id": test_run_id,
            "task_name": "outline_extraction",
            "doc_id": "doc_test_abc",
            "status": "SUCCESS",
            "duration_ms": 1250.5,
            "start_time": "2026-09-11T12:00:00Z",
            "primary_provider": "google_api",
            "primary_model": "gemini-3.5-flash-lite",
            "usage": {
                "total_tokens": 1500,
                "input_tokens": 1000,
                "output_tokens": 500,
                "cost_usd": 0.002,
            },
            "spans": [],
        }
        (run_path / "meta.json").write_text(json.dumps(meta_data), encoding="utf-8")

        # ledger.jsonl 작성
        span_1 = {
            "span_id": "sp-1",
            "dotted_order": "1",
            "name": "context_build",
            "span_type": "tool",
            "duration_ms": 200.0,
            "inputs": {"doc_id": "doc_test_abc"},
            "outputs": {"context_length": 500},
        }
        span_2 = {
            "span_id": "sp-2",
            "dotted_order": "2",
            "name": "llm_generate",
            "span_type": "llm",
            "duration_ms": 1050.5,
            "inputs": {"prompt_preview": "Extract outline..."},
            "outputs": {"title": "Test Chapter 1"},
        }
        ledger_content = f"{json.dumps(span_1)}\n{json.dumps(span_2)}\n"
        (run_path / "ledger.jsonl").write_text(ledger_content, encoding="utf-8")

        # snapshots.json 작성
        snapshots_data = {
            "context_build": {"markdown": "# Heading 1\nContent"},
            "prompt_assembly": {"system": "You are outline extractor."},
        }
        (run_path / "snapshots.json").write_text(json.dumps(snapshots_data), encoding="utf-8")

        # 1. 목록 조회
        list_resp = client.get("/api/v1/inspector/runs")
        assert list_resp.status_code == 200
        runs = list_resp.json()
        target = next((r for r in runs if r["run_id"] == test_run_id), None)
        assert target is not None
        assert target["task_name"] == "outline_extraction"
        assert target["doc_id"] == "doc_test_abc"
        assert target["total_tokens"] == 1500
        assert target["snapshots_count"] == 2

        # 2. 상세 조회
        detail_resp = client.get(f"/api/v1/inspector/runs/{test_run_id}")
        assert detail_resp.status_code == 200
        detail = detail_resp.json()
        assert detail["meta"]["run_id"] == test_run_id
        assert len(detail["spans"]) == 2
        assert detail["spans"][0]["name"] == "context_build"
        assert "context_build" in detail["snapshots"]

        # 3. 없는 ID 조회시 404
        not_found_resp = client.get("/api/v1/inspector/runs/non-existent-run-id")
        assert not_found_resp.status_code == 404

        # 4. Run 삭제 검증
        del_resp = client.delete(f"/api/v1/inspector/runs/{test_run_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["status"] == "DELETED"
        assert not run_path.exists()

        # 5. 삭제된 후 재삭제시 404
        del_again = client.delete(f"/api/v1/inspector/runs/{test_run_id}")
        assert del_again.status_code == 404

    finally:
        # 테스트 후 정리
        if run_path.exists():
            import shutil
            shutil.rmtree(run_path, ignore_errors=True)


def test_ingest_pipeline_telemetry_resolves_target_name(tmp_path: Path):
    from agent_telemetry.collector import StepCollector

    from app.core.llm.tracer import ingest_pipeline_telemetry

    runs_dir = settings.storage.runs
    test_run_id = "test-run-display-name-002"
    run_dir = runs_dir / test_run_id

    try:
        collector = StepCollector(
            pipeline_name="OutlinePipeline",
            domain="documents",
            workflow_name="documents.extract_outline",
            workflow_label="문서 목차 추출",
            target_name="source.pdf",
        )
        tel = collector.export_telemetry()
        ingest_pipeline_telemetry(
            tel,
            run_id=test_run_id,
            doc_id="doc-123",
            target_name="진짜_원본_기획서.pdf",
        )

        assert run_dir.exists()
        meta_json = json.loads((run_dir / "meta.json").read_text(encoding="utf-8"))
        assert meta_json["target_name"] == "진짜_원본_기획서.pdf"
        assert meta_json["workflow_label"] == "문서 목차 추출"

        # Inspector runs API 검증
        resp = client.get("/api/v1/inspector/runs")
        assert resp.status_code == 200
        found = next((r for r in resp.json() if r.get("run_id") == test_run_id), None)
        assert found is not None
        assert found["target_name"] == "진짜_원본_기획서.pdf"

    finally:
        if run_dir.exists():
            import shutil
            shutil.rmtree(run_dir, ignore_errors=True)


def test_inspector_provider_resolution_for_cli_model(tmp_path: Path):
    """primary_provider가 비어 있어도 3.8-flash-low 같은 CLI 모델은 agy_cli로 매핑되는지 검증."""
    runs_dir = settings.storage.runs
    test_run_id = "test-run-cli-model-003"
    run_dir = runs_dir / test_run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    try:
        meta_data = {
            "run_id": test_run_id,
            "task_name": "outline_extraction",
            "doc_id": "doc_test_cli",
            "status": "SUCCESS",
            "duration_ms": 1000.0,
            "primary_provider": None,
            "primary_model": "gemini-3.8-flash-low",
            "total_tokens": 500,
        }
        (run_dir / "meta.json").write_text(json.dumps(meta_data), encoding="utf-8")

        resp = client.get("/api/v1/inspector/runs")
        assert resp.status_code == 200
        found = next((r for r in resp.json() if r.get("run_id") == test_run_id), None)
        assert found is not None
        assert found["primary_provider"] == "agy_cli"

    finally:
        if run_dir.exists():
            import shutil
            shutil.rmtree(run_dir, ignore_errors=True)


def test_inspector_source_code_resolution():
    """Inspector 소스 코드 조회 및 레거시 별칭 경로 자동 매핑 검증."""
    # 1. 실제 파일명으로 조회
    resp = client.get("/api/v1/inspector/source?file_path=local_document_artifact_repository.py")
    assert resp.status_code == 200
    data = resp.json()
    assert "class LocalDocumentArtifactRepository" in data["content"]
    assert data["language"] == "python"

    # 2. 레거시(오타) 경로로 조회 시에도 alias 매핑되어 성공하는지 검증
    legacy_resp = client.get("/api/v1/inspector/source?file_path=apps/api/app/scaffolds/adapters/local_artifact_repository.py")
    assert legacy_resp.status_code == 200
    legacy_data = legacy_resp.json()
    assert "class LocalDocumentArtifactRepository" in legacy_data["content"]

    # 3. 레거시 심볼 이름으로 조회 시에도 성공하는지 검증
    symbol_resp = client.get(
        "/api/v1/inspector/source?file_path=local_artifact_repository.py&symbol=LocalArtifactRepository"
    )
    assert symbol_resp.status_code == 200
    symbol_data = symbol_resp.json()
    assert "class LocalDocumentArtifactRepository" in symbol_data["content"]

