"""L2 단위 테스트 골격 — 어댑터 · 저장소 · 유스케이스.

L2 가 지키는 것: **포트 뒤의 행동.** 파일·시간·식별자를 다루되 앱은 부팅하지 않는다.
등급 예산은 전체 2초다.

판정: "정적으로 증명되는가?" 아니오 → "앱을 부팅해야 하는가?" 아니오 →
      "포트/파일/외부 경계를 넘는가?" **예** → L2

정본: workbench/07.test_strategy/spec/02.tiers/03.L2-units.md
실제 예: workbench/07.test_strategy/examples/02.L2-run-observation-store.md
"""
from __future__ import annotations

from pathlib import Path

from app.core.observation import RunObservationStore


# ── 1. 정상 경로 ─────────────────────────────────────────────────────────────


def test_the_target_does_what_it_promises(tmp_path: Path) -> None:   # ← 이름을 바꾼다
    """<한 줄: 이 테스트가 지키는 사실>

    <사고 기록 — templates/regression-header.md 형식>
    """
    # given — 루트는 **주입**한다. 어댑터가 경로를 스스로 만들면 그것부터 위반이다.
    store = RunObservationStore(tmp_path / "runs")

    # when
    result = store.list_run_ids()

    # then
    assert result == []


# ── 2. 경계 — 없을 때 · 깨졌을 때 ────────────────────────────────────────────


def test_absence_is_answered_not_raised(tmp_path: Path) -> None:
    """부재는 오류가 아니다. 빈 값과 실패를 구분해서 돌려준다.

    "없음"을 예외로 돌려주면 호출부가 정상 흐름에서 예외를 잡게 되고,
    진짜 실패가 그 안에 섞여 보이지 않게 된다.
    """
    store = RunObservationStore(tmp_path / "runs")

    assert store.meta("run-없음") == {}


def test_one_broken_record_does_not_lose_the_rest(tmp_path: Path) -> None:
    """한 건이 깨져도 나머지는 돌려준다. 관측 도구는 깨진 데이터를 보여주는 것이 일이다."""
    runs = tmp_path / "runs" / "run-1"
    runs.mkdir(parents=True)
    (runs / "meta.json").write_text("{ 깨진 JSON", encoding="utf-8")

    assert RunObservationStore(tmp_path / "runs").meta("run-1") == {}


# ── 3. 식별자 안전성 (경로를 만드는 어댑터라면 필수) ─────────────────────────


def test_an_identifier_is_not_a_path(tmp_path: Path) -> None:
    """상위로 올라가는 이름은 통과하지 않는다. 치환하지 않고 **거부**한다."""
    runs = tmp_path / "runs"
    runs.mkdir(parents=True)
    outsider = tmp_path / "outsider"
    outsider.mkdir()

    store = RunObservationStore(runs)

    assert store.delete("../outsider") is False
    assert outsider.exists()


# ── 이 등급에서 하지 않는 것 ─────────────────────────────────────────────────
#
# ✗ `TestClient` / `from main import app`  → L3 다
# ✗ 협력자를 `None` 으로 두고 만들기        → 프로덕션에 없는 조합이다
#                                            examples/91.antipattern-none-collaborators.md
# ✗ 실제 `settings.storage` 사용            → `tmp_path` 또는 `storage` 픽스처를 쓴다
# ✗ 외부 CLI/HTTP 호출                      → spec/05.fixtures/02.external-boundaries.md
