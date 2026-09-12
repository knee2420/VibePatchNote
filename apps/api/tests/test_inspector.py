"""Inspector 엔드포인트 및 서비스 단위 테스트."""
import json
import shutil
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

    # run 의 상태는 생애주기 어휘(RunStatus)다. 스팬의 'success' 와 다르며,
    # 둘은 서로 다른 개념이라 통합하지 않는다 (observability.md §3-1).
    assert target["status"] == "completed"
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


def test_provider_is_recorded_not_guessed(tmp_path: Path):
    """공급자는 기록된 것만 쓴다. 모델명으로 추측하지 않는다.

    예전에는 `"low" in model_name` 이면 agy_cli 라고 단정했다. 조회 계층이
    도메인 지식을 갖기 시작하면 새 모델이 늘 때마다 elif 가 늘어나고,
    틀려도 아무도 모른다 (observability.md §4).
    """
    runs_dir = settings.storage.runs
    run_id = "test-run-no-provider"
    run_dir = runs_dir / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    try:
        (run_dir / "meta.json").write_text(
            json.dumps(
                {
                    "run_id": run_id,
                    "status": "success",
                    "start_time": "2026-09-11T00:00:00+00:00",
                    "primary_provider": None,
                    "primary_model": "gemini-3.8-flash-low",
                }
            ),
            encoding="utf-8",
        )

        found = next(
            r for r in client.get("/api/v1/inspector/runs").json() if r["run_id"] == run_id
        )
        # 모델은 기록돼 있으니 그대로 나온다.
        assert found["primary_model"] == "gemini-3.8-flash-low"
        # 공급자는 기록되지 않았다. 지어내지 않는다.
        assert found["primary_provider"] is None
    finally:
        shutil.rmtree(run_dir, ignore_errors=True)


def test_run_list_covers_uninstrumented_runs(observability_runs: list[str]):
    """`meta.json` 이 없는 run 도 목록에 뜬다.

    목록의 정본은 `events.jsonl` 이다 (observability.md §2-1). 예전에는
    `meta.json` 있는 디렉터리만 올려서 54건 중 37건이 화면에서 사라졌고,
    그중에 TIMEOUT 과 FAILED 가 있었다.
    """
    run_dir = settings.storage.runs / FIXTURE_RUN_EVENTS_ONLY
    assert (run_dir / "events.jsonl").exists()
    assert not (run_dir / "meta.json").exists(), "이 픽스처는 meta 가 없어야 합니다"

    runs = client.get("/api/v1/inspector/runs").json()
    found = next((r for r in runs if r["run_id"] == FIXTURE_RUN_EVENTS_ONLY), None)

    assert found is not None, "계측되지 않은 run 이 목록에서 빠졌습니다"
    assert found["status"] == "completed"
    assert found["created_at"], "생애주기에서 시작 시각을 얻어야 합니다"


def test_run_list_uses_one_status_vocabulary(observability_runs: list[str]):
    """목록 안에 두 어휘가 섞이지 않는다.

    `events.jsonl` 이 있는 run 은 `completed`, 텔레메트리만 있는 run 은
    `success` 로 나오던 시기가 있었다. 소비자가 양쪽을 모두 비교해야 하고,
    한쪽만 맞추면 나머지가 전부 실패로 그려진다 (observability.md §3-1).
    """
    run_statuses = {"queued", "running", "completed", "failed",
                    "waiting_for_configuration", "waiting_for_approval", "unknown"}
    for row in client.get("/api/v1/inspector/runs").json():
        assert row["status"] in run_statuses, (
            f"{row['run_id']} 의 상태 {row['status']!r} 가 run 어휘가 아닙니다"
        )


def test_telemetry_only_run_is_translated_to_run_vocabulary(observability_runs: list[str]):
    """`events.jsonl` 없이 텔레메트리만 있는 run 도 run 어휘로 나온다."""
    run_dir = settings.storage.runs / FIXTURE_RUN_WITH_ATTEMPTS
    assert not (run_dir / "events.jsonl").exists()
    assert json.loads((run_dir / "meta.json").read_text(encoding="utf-8"))["status"] == "success"

    row = next(
        r for r in client.get("/api/v1/inspector/runs").json()
        if r["run_id"] == FIXTURE_RUN_WITH_ATTEMPTS
    )
    assert row["status"] == "completed"


def test_run_without_ledger_still_lists(observability_runs: list[str]):
    """단계 상세의 부재는 오류가 아니라 정상 상태다 (observability.md §2-3)."""
    runs = {r["run_id"]: r for r in client.get("/api/v1/inspector/runs").json()}

    uninstrumented = runs[FIXTURE_RUN_EVENTS_ONLY]
    assert uninstrumented["has_span_detail"] is False

    instrumented = runs[FIXTURE_RUN_FULL]
    assert instrumented["has_span_detail"] is True


def test_snapshots_keep_their_contract_shape(observability_runs: list[str]):
    """스냅샷은 계약 그대로 온다. 납작한 딕셔너리로 만들면 잃는 것이 있다.

    예전에는 `{stage_name: data}` 로 접으면서 `stage_id` 와 순서를 잃었고,
    계약에 없는 `data` 키를 읽어서 **값이 전부 None** 이었다. 프론트가 이것을
    렌더한 적이 없어 아무도 몰랐다.
    """
    detail = client.get(f"/api/v1/inspector/runs/{FIXTURE_RUN_FULL}").json()
    snapshots = detail["snapshots"]

    assert isinstance(snapshots, list) and snapshots, "스냅샷이 리스트로 와야 합니다"
    for snapshot in snapshots:
        assert snapshot["stage_id"]
        assert snapshot["stage_name"]
        assert isinstance(snapshot["payload"], dict)
        assert snapshot["payload"], "payload 가 비어 있습니다 (예전엔 전부 None 이었습니다)"

    # 목록의 개수 배지와 상세가 어긋나지 않는다.
    summary = next(
        r for r in client.get("/api/v1/inspector/runs").json()
        if r["run_id"] == FIXTURE_RUN_FULL
    )
    assert summary["snapshots_count"] == len(snapshots)


def test_source_resolves_by_module_exactly():
    """모듈 이름은 파일 하나로 정확히 해석된다. 탐색하지 않는다."""
    resp = client.get(
        "/api/v1/inspector/source",
        params={"module": "agent_telemetry.contracts.usage", "symbol": "SpanUsage"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["file_path"] == "packages/agent-telemetry/agent_telemetry/contracts/usage.py"
    assert data["content"].startswith("class SpanUsage(BaseModel):")
    assert data["language"] == "python"
    assert data["start_line"] > 0 and data["end_line"] >= data["start_line"]


def test_source_extracts_method_by_qualname():
    resp = client.get(
        "/api/v1/inspector/source",
        params={"module": "app.inspector.service", "symbol": "InspectorService.list_runs"},
    )
    assert resp.status_code == 200
    content = resp.json()["content"]
    assert content.lstrip().startswith("def list_runs")


def test_source_refuses_dependencies_and_traversal():
    """저장소 밖과 venv 는 우리 코드가 아니다.

    예전에는 파일명으로 apps/** packages/** 를 전수 glob 한 뒤 **크기 내림차순**
    으로 골랐다. 그래서 `schema.py` 요청이 venv 의 `pydantic/v1/schema.py` 를
    돌려줬고, 그 노드는 모든 run 의 검증 스팬에 있었다.
    """
    refused = [
        {"module": "pydantic.v1.schema"},
        {"file_path": "../../../Windows/win.ini"},
        {"file_path": "apps/api/venv/Lib/site-packages/requests/models.py"},
        # 파일명만 주는 탐색은 더 이상 지원하지 않는다.
        {"file_path": "schema.py"},
        {"module": "nope.not_real"},
    ]
    for params in refused:
        resp = client.get("/api/v1/inspector/source", params=params)
        assert resp.status_code == 404, f"{params} 가 통과했습니다: {resp.text[:200]}"


def test_source_requires_a_locator():
    assert client.get("/api/v1/inspector/source").status_code == 422


def test_source_lookup_is_fast():
    """탐색을 없앴으므로 요청은 즉시 끝나야 한다 (예전 실측 1.4초)."""
    import time

    t0 = time.perf_counter()
    resp = client.get(
        "/api/v1/inspector/source",
        params={"module": "scaffold_engine.outline.pipeline"},
    )
    elapsed = time.perf_counter() - t0
    assert resp.status_code == 200
    assert elapsed < 0.5, f"소스 조회가 {elapsed:.2f}초 걸렸습니다. 탐색이 되살아났는지 확인하십시오."
