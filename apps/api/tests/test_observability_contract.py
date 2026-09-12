"""관측 계약 강제 수단.

`.agents/rules/60-data/observability.md` 가 선언한 규칙을 여기서 고정한다.
문서만 있고 강제 수단이 없는 규칙은 지켜지지 않는다
(`.agents/rules/README.md`).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest
from agent_telemetry.contracts import (
    SpanStatus,
    SpanUsage,
    usage_from_product_dict,
    usage_to_product_dict,
)
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

API_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = API_ROOT.parents[1]
FIXTURES = Path(__file__).resolve().parent / "fixtures" / "observability"

FIXTURE_RUN_FULL = "run-1a094630557-4e4f96ee"


# ── §3-1 상태 어휘 ───────────────────────────────────────────────


def test_status_vocabulary_is_lowercase() -> None:
    """열거형이 정의하는 상태는 전부 소문자다.

    프론트가 `'SUCCESS'` 와 비교하다가 성공한 스팬을 전부 실패 색으로 칠했다.
    대문자 표기를 하나라도 허용하면 그 비교가 다시 살아난다.
    """
    for member in SpanStatus:
        assert member.value == member.value.lower(), f"{member} 가 대문자를 쓴다"


def test_stored_span_status_is_lowercase() -> None:
    """실제로 저장된 원장의 스팬 상태도 소문자다."""
    ledger = FIXTURES / "runs" / FIXTURE_RUN_FULL / "ledger.jsonl"
    seen = set()
    for line in ledger.read_text(encoding="utf-8").splitlines():
        entry = json.loads(line)
        if entry.get("event_type") == "span":
            seen.add(entry["data"]["status"])

    assert seen, "픽스처에 스팬이 없습니다"
    for status in seen:
        assert status == status.lower(), f"저장된 상태가 대문자다: {status!r}"
        assert status in {m.value for m in SpanStatus}


def test_fallback_is_not_a_status() -> None:
    """폴백은 상태가 아니라 '시도가 2회 이상'이라는 사실이다."""
    values = {m.value for m in SpanStatus}
    assert "fallback_triggered" not in values
    assert "FALLBACK_TRIGGERED" not in values


# ── §3-2 토큰 어휘 ───────────────────────────────────────────────


def test_usage_conversion_is_lossless() -> None:
    """공급자 어휘 ↔ 제품 어휘 왕복이 무손실이다.

    `cache_read_tokens` 가 `SpanUsage` 에 없던 시절, 변환할 때마다 캐시 토큰이
    조용히 사라졌다.
    """
    original = SpanUsage(
        prompt_tokens=4798,
        completion_tokens=1692,
        reasoning_tokens=120,
        cache_read_tokens=16288,
        total_tokens=6610,
    )

    product = usage_to_product_dict(original)
    assert product == {
        "input_tokens": 4798,
        "output_tokens": 1692,
        "thinking_tokens": 120,
        "cache_read_tokens": 16288,
        "total_tokens": 6610,
    }

    restored = usage_from_product_dict(product)
    assert restored.prompt_tokens == original.prompt_tokens
    assert restored.completion_tokens == original.completion_tokens
    assert restored.reasoning_tokens == original.reasoning_tokens
    assert restored.cache_read_tokens == original.cache_read_tokens
    assert restored.total_tokens == original.total_tokens


def test_total_tokens_is_derived_when_provider_omits_it() -> None:
    """공급자가 합계를 안 주면 구성요소에서 만든다.

    실제 저장된 run 에 `total_tokens: 0` 인데 `prompt_tokens: 4798` 인 것이 있었고,
    화면에는 "토큰 0"이 떴다.
    """
    usage = SpanUsage(prompt_tokens=4798, completion_tokens=1692, total_tokens=0)
    assert usage.total_tokens == 6490

    # 공급자가 합계를 줬다면 그 값을 존중한다.
    explicit = SpanUsage(prompt_tokens=10, completion_tokens=10, total_tokens=999)
    assert explicit.total_tokens == 999


# ── §4 모르는 값 ─────────────────────────────────────────────────


def test_unknown_cost_is_null_not_zero(observability_runs: list[str]) -> None:
    """USD 비용은 계산된 적이 없다. 0.0 은 '무료'라는 거짓말이다."""
    runs = client.get("/api/v1/inspector/runs").json()
    target = next(r for r in runs if r["run_id"] == FIXTURE_RUN_FULL)
    assert target["cost_usd"] is None


def test_model_registry_has_no_price_axis() -> None:
    """단가 축이 생기면 이 테스트가 깨진다 — 그때 비용 계산을 붙이라는 신호다."""
    from scaffold_engine.harness import MODEL_REGISTRY

    spec = next(iter(MODEL_REGISTRY.values()))
    has_price = any("price" in f or "cost" in f for f in spec.__dataclass_fields__)
    assert not has_price, (
        "ModelSpec 에 단가 축이 생겼습니다. "
        "이제 기록 시점에 cost_usd 를 계산하고 이 테스트를 갱신하십시오."
    )


# ── §5 강제 수단 ─────────────────────────────────────────────────


def test_generated_types_match_contracts() -> None:
    """TS 타입은 생성물이다. 손으로 고치면 계약과 갈라진다."""
    script = API_ROOT / "scripts" / "generate_inspector_types.py"
    result = subprocess.run(
        [sys.executable, str(script), "--check"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    assert result.returncode == 0, (
        f"{result.stdout}\n{result.stderr}\n"
        "apps/inspector/src/types/generated.ts 가 백엔드 계약과 다릅니다."
    )


def test_generated_types_file_is_marked_as_generated() -> None:
    generated = REPO_ROOT / "apps" / "inspector" / "src" / "types" / "generated.ts"
    head = generated.read_text(encoding="utf-8")[:400]
    assert "생성물입니다" in head
    assert "직접 수정하지 마십시오" in head


# ── 원장 단일 스키마 (v4 마이그레이션) ──────────────────────────


def test_ledger_migration_unifies_schema(tmp_path: Path) -> None:
    """camelCase 행이 snake_case 로 통일되고 상태가 소문자가 된다.

    구형 행은 `LedgerEntry.model_validate` 를 **통과하되 전 필드가 기본값으로
    덮여** 조용히 유실됐다. 실패하지 않고 지워지는 쪽이 더 나쁘다.
    """
    from migrations import v0004_ledger_single_schema

    ledger_dir = tmp_path / "data" / "ledger"
    ledger_dir.mkdir(parents=True)
    target = ledger_dir / "2026-09.jsonl"
    target.write_text(
        (FIXTURES / "ledger" / "2026-09.jsonl").read_text(encoding="utf-8"),
        encoding="utf-8",
    )

    before = [json.loads(x) for x in target.read_text(encoding="utf-8").splitlines() if x.strip()]
    assert any("recordedAt" in row for row in before), "픽스처에 구형 행이 있어야 합니다"

    v0004_ledger_single_schema.run(tmp_path)

    after = [json.loads(x) for x in target.read_text(encoding="utf-8").splitlines() if x.strip()]
    assert len(after) == len(before), "마이그레이션이 행을 잃었습니다"

    for row in after:
        assert "recordedAt" not in row and "recorded_at" in row
        assert "runId" not in row
        if isinstance(row.get("cost"), dict):
            assert "inputTokens" not in row["cost"]
        status = row.get("status")
        if isinstance(status, str):
            assert status == status.lower(), f"상태가 대문자다: {status!r}"


def test_ledger_migration_is_idempotent(tmp_path: Path) -> None:
    from migrations import v0004_ledger_single_schema

    ledger_dir = tmp_path / "data" / "ledger"
    ledger_dir.mkdir(parents=True)
    target = ledger_dir / "2026-09.jsonl"
    target.write_text(
        (FIXTURES / "ledger" / "2026-09.jsonl").read_text(encoding="utf-8"),
        encoding="utf-8",
    )

    v0004_ledger_single_schema.run(tmp_path)
    once = target.read_text(encoding="utf-8")
    v0004_ledger_single_schema.run(tmp_path)
    assert target.read_text(encoding="utf-8") == once


def test_storage_version_matches_migrations() -> None:
    """마이그레이션을 추가하고 STORAGE_VERSION 을 올리지 않으면 부팅이 거부된다."""
    from app.core.storage.paths import STORAGE_VERSION
    from migrations import TARGET_VERSION

    assert STORAGE_VERSION == TARGET_VERSION


@pytest.mark.parametrize("marker", ["observability.md", "§"])
def test_rule_document_exists(marker: str) -> None:
    """규칙 정본이 사라지면 이 테스트들의 근거도 사라진다."""
    rule = REPO_ROOT / ".agents" / "rules" / "60-data" / "observability.md"
    assert rule.exists()
    if marker != "observability.md":
        assert marker in rule.read_text(encoding="utf-8")
