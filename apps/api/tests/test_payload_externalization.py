"""A4-2 — 대용량 페이로드가 원장 밖에 저장되는가.

원장 한 줄이 본문 사본을 들고 있으면 원장이 본문만큼 커진다. 실측으로
`ledger.jsonl` 이 7.1MB 였고 그중 93%가 다섯 개 키였으며, 그중 둘은 같은
데이터의 사본이었다 (`.agents/rules/60-data/rule.md` §4-1).
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.storage.payloads import (
    EXTERNALIZE_OVER_BYTES,
    externalize,
    is_payload_ref,
    read_payload,
)
from main import app

client = TestClient(app)

BIG = "가나다라" * 3000  # 넉넉히 임계값 초과
SMALL = "짧은 값"


def test_small_values_stay_inline(tmp_path: Path) -> None:
    """짧은 값은 밖으로 빼지 않는다. 포인터가 본문보다 크다."""
    result = externalize({"a": SMALL, "n": 42, "flag": True}, tmp_path)
    assert result == {"a": SMALL, "n": 42, "flag": True}
    assert not (tmp_path / "payloads").exists()


def test_large_strings_become_refs(tmp_path: Path) -> None:
    result = externalize({"prompt": BIG, "chars": len(BIG)}, tmp_path)

    # 숫자는 그대로. 구조도 그대로.
    assert result["chars"] == len(BIG)

    ref = result["prompt"]
    assert is_payload_ref(ref)
    assert ref["bytes"] == len(BIG.encode("utf-8"))
    assert ref["preview"] and BIG.startswith(ref["preview"])
    assert len(ref["preview"]) < len(BIG)

    # 본문은 밖에 있고, 포인터로 되찾을 수 있다.
    assert read_payload(tmp_path, ref["__payload_ref__"]) == BIG


def test_identical_content_is_stored_once(tmp_path: Path) -> None:
    """같은 내용은 해시가 같으므로 한 번만 저장된다.

    `structured_output`(LLM 출력)과 `raw_output`(검증 입력)은 같은 데이터인데
    두 스팬에 각각 실려 있었다. 평균 173KB · 157KB 짜리였다.
    """
    externalize({"outputs": {"structured_output": BIG}}, tmp_path)
    externalize({"inputs": {"raw_output": BIG}}, tmp_path)

    files = list((tmp_path / "payloads").glob("*.txt"))
    assert len(files) == 1, f"같은 내용이 {len(files)}번 저장됐습니다"


def test_nested_structures_are_preserved(tmp_path: Path) -> None:
    payload = {"a": [{"b": BIG, "c": 1}], "d": {"e": [SMALL]}}
    result = externalize(payload, tmp_path)

    assert is_payload_ref(result["a"][0]["b"])
    assert result["a"][0]["c"] == 1
    assert result["d"] == {"e": [SMALL]}


def test_ledger_shrinks_measurably(tmp_path: Path) -> None:
    """외부화가 실제로 원장을 줄인다."""
    span = {
        "span_id": "s1",
        "inputs": {"prompt": BIG, "prompt_chars": len(BIG)},
        "outputs": {"raw_response": BIG},
    }
    inline_bytes = len(json.dumps(span, ensure_ascii=False).encode("utf-8"))

    from app.core.storage.payloads import externalize_span_dict

    externalized = externalize_span_dict(dict(span), tmp_path)
    ref_bytes = len(json.dumps(externalized, ensure_ascii=False).encode("utf-8"))

    assert ref_bytes < inline_bytes / 4, (
        f"원장 줄이 충분히 줄지 않았습니다: {inline_bytes} → {ref_bytes}"
    )


def test_payload_endpoint_serves_the_body(observability_runs: list[str], tmp_path: Path) -> None:
    """포인터는 API 로 되찾을 수 있다."""
    from app.core.config import settings

    run_id = "test-payload-run"
    run_dir = settings.storage.runs / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    try:
        ref = externalize(BIG, run_dir)
        digest = ref["__payload_ref__"]

        resp = client.get(f"/api/v1/inspector/runs/{run_id}/payloads/{digest}")
        assert resp.status_code == 200
        assert resp.json()["content"] == BIG

        # 없는 해시, 그리고 해시 형식이 아닌 값은 거부한다.
        assert client.get(
            f"/api/v1/inspector/runs/{run_id}/payloads/{'0' * 64}"
        ).status_code == 404
        assert client.get(
            f"/api/v1/inspector/runs/{run_id}/payloads/not-a-digest"
        ).status_code == 404
    finally:
        import shutil

        shutil.rmtree(run_dir, ignore_errors=True)


def test_threshold_is_documented() -> None:
    """임계값이 바뀌면 저장 형태가 바뀐다. 눈에 띄게 둔다."""
    assert EXTERNALIZE_OVER_BYTES == 2048
