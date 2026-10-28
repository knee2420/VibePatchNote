"""`data/runs/{run_id}/` 의 관측 자료를 아는 곳은 하나다.

예전에는 셋이었다 — 경로를 지어내 쓰는 트레이서, 파일 이름을 손으로 읽는
inspector, 또 다른 곳의 `rmtree`. 레이아웃을 바꾸면 셋을 동시에 고쳐야 했다.
"""
from __future__ import annotations

import json
from pathlib import Path

from app.core.observation import RunObservationStore


def _write_run(runs_dir: Path, run_id: str, doc_id: str) -> Path:
    run_dir = runs_dir / run_id
    (run_dir / "payloads").mkdir(parents=True, exist_ok=True)
    (run_dir / "meta.json").write_text(
        json.dumps({"run_id": run_id, "doc_id": doc_id}), encoding="utf-8"
    )
    # 프롬프트 본문. 문서를 지우면 이것도 사라져야 한다.
    (run_dir / "payloads" / "abc123.txt").write_text("문서 본문 사본", encoding="utf-8")
    return run_dir


def test_document_deletion_cascades_to_run_payloads(tmp_path: Path) -> None:
    """문서를 지우면 그 문서의 본문이 실린 실행 기록도 사라진다.

    프롬프트에는 문서 본문이 실리고, 그 본문은 `payloads/` 에 내용 해시로
    외부화되어 남는다. 원본만 지우면 지운 문서의 내용이 계속 디스크에 있다.
    예전 트레이스 연쇄 삭제가 지키려던 것이 이것인데, 트레이스 자체가 쓰이지
    않게 된 뒤로 그 연쇄는 빈 디렉터리를 뒤지는 no-op 이 되어 있었다.
    """
    runs_dir = tmp_path / "runs"
    mine = _write_run(runs_dir, "run-1", "doc-1")
    other = _write_run(runs_dir, "run-2", "doc-2")

    removed = RunObservationStore(runs_dir).delete_for_document("doc-1")

    assert removed == 1
    assert not mine.exists()
    assert other.exists(), "다른 문서의 기록은 건드리지 않는다"


def test_unknown_document_removes_nothing(tmp_path: Path) -> None:
    runs_dir = tmp_path / "runs"
    _write_run(runs_dir, "run-1", "doc-1")

    assert RunObservationStore(runs_dir).delete_for_document("doc-없음") == 0
    assert (runs_dir / "run-1").exists()


def test_unsafe_run_id_cannot_escape_the_runs_root(tmp_path: Path) -> None:
    """식별자는 경로가 아니다. 상위로 올라가는 이름은 통과하지 않는다."""
    runs_dir = tmp_path / "runs"
    runs_dir.mkdir(parents=True)
    outsider = tmp_path / "outsider"
    outsider.mkdir()

    store = RunObservationStore(runs_dir)

    assert store.delete("../outsider") is False
    assert store.meta("../outsider") == {}
    assert outsider.exists()
