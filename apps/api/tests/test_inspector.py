"""Inspector 엔드포인트 및 서비스 단위 테스트."""
import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.config import settings
from main import app

# 픽스처 run 이름. 각각이 대표하는 상황은 fixtures/observability/README.md 참조.
FIXTURE_RUN_FULL = "run-1a094630557-4e4f96ee"
FIXTURE_RUN_WITH_ATTEMPTS = "run-contract-20260911-191719"
FIXTURE_RUN_EVENTS_ONLY = "agent-5a0846d55d53"

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


def test_inspector_runs_and_detail(observability_runs: list[str]):
    """실제 생산자 출력(픽스처)으로 목록·상세·삭제를 검증한다.

    예전 이 테스트는 손으로 지은 `{"status": "SUCCESS", "duration_ms": ...}` 를
    썼다. 생산자는 그 키를 쓰지 않는다(`"status": "success"`, `"total_latency_ms"`).
    그래서 테스트가 초록불인 채로 대소문자 불일치 버그가 살아남았다.
    """
    run_id = FIXTURE_RUN_FULL

    # 1. 목록 조회
    list_resp = client.get("/api/v1/inspector/runs")
    assert list_resp.status_code == 200
    runs = list_resp.json()
    target = next((r for r in runs if r["run_id"] == run_id), None)
    assert target is not None, f"{run_id} 가 목록에 없습니다"

    # 생산자가 실제로 쓰는 값이다. 대문자로 오지 않는다.
    assert target["status"] == "success"
    assert target["total_duration_ms"] > 0
    assert target["total_tokens"] > 0

    # 모르는 값을 0 으로 내보내지 않는다 (observability.md §4).
    assert target["cost_usd"] is None

    # 2. 상세 조회 — 스팬이 계약대로 검증되어야 한다.
    detail_resp = client.get(f"/api/v1/inspector/runs/{run_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["meta"]["run_id"] == run_id
    assert len(detail["spans"]) > 0

    for span in detail["spans"]:
        assert span["status"] in {"pending", "running", "success", "failed", "skipped"}
        assert span["span_type"] in {"pipeline", "chain", "llm", "tool", "parser"}
        # 계약 필드가 실제로 실려 온다.
        assert "duration_ms" in span
        assert "usage" in span

    # 3. 없는 ID 조회시 404
    assert client.get("/api/v1/inspector/runs/non-existent-run-id").status_code == 404

    # 4. 삭제
    del_resp = client.delete(f"/api/v1/inspector/runs/{run_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "DELETED"
    assert not (settings.storage.runs / run_id).exists()

    # 5. 재삭제시 404
    assert client.delete(f"/api/v1/inspector/runs/{run_id}").status_code == 404


def test_attempt_records_follow_the_contract(observability_runs: list[str]):
    """시도 기록은 계약(`ModelAttemptRecord`)의 필드명으로 온다.

    프론트가 `model` · `duration_ms` · `input_tokens` · `cost_usd` 를 읽다가
    TypeError 로 앱 전체를 백화면으로 만들었다. 계약에 있는 이름은 아래뿐이다.
    """
    detail = client.get(f"/api/v1/inspector/runs/{FIXTURE_RUN_WITH_ATTEMPTS}").json()
    attempts = [att for span in detail["spans"] for att in span.get("attempts", [])]
    assert attempts, "이 픽스처에는 attempt 기록이 있어야 합니다"

    for att in attempts:
        assert "model_name" in att and "model" not in att
        assert "latency_ms" in att and "duration_ms" not in att
        assert "usage" in att
        assert "input_tokens" not in att
        assert "cost_usd" not in att
        assert att["status"] in {"pending", "running", "success", "failed", "skipped"}


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

