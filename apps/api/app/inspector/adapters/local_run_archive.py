"""`RunArchivePort` 의 구현.

**파일 이름을 아는 코드는 여기에 없다.** 이 어댑터가 하는 일은 두 소유자에게
묻는 것뿐이다.

    실행 생애주기   `agent_runtime` 의 run 레포지토리
    관측 자료       `app.core.observation` 의 `RunObservationStore`

예전에는 inspector 서비스가 `meta.json`, `ledger.jsonl`, `snapshots.json` 을 직접
열고 `shutil.rmtree` 로 지웠다. 같은 디렉터리를 아는 곳이 셋이었고, 레이아웃을
바꾸면 세 곳을 동시에 고쳐야 했다.
"""
from __future__ import annotations

from typing import Any, Mapping, Optional

from app.core.observation import RunObservationStore


class LocalRunArchive:
    """디스크에 남은 실행 기록을 관측 콘솔의 계약 모양으로 돌려준다."""

    def __init__(self, lifecycles: Any, observations: RunObservationStore, ledger_dir: Any) -> None:
        self._lifecycles = lifecycles
        self._observations = observations
        self._ledger_dir = ledger_dir

    # --- 조회 ----------------------------------------------------------

    def list_run_ids(self) -> list[str]:
        return self._observations.list_run_ids()

    def lifecycle(self, run_id: str) -> Any | None:
        return self._lifecycles.get(run_id)

    def meta(self, run_id: str) -> dict[str, Any]:
        return self._observations.meta(run_id)

    def spans(self, run_id: str) -> list[dict[str, Any]]:
        return self._observations.spans(run_id)

    def attempts(self, run_id: str) -> list[dict[str, Any]]:
        return self._observations.attempts(run_id)

    def snapshots(self, run_id: str) -> list[dict[str, Any]]:
        return self._observations.snapshots(run_id)

    def has_span_detail(self, run_id: str) -> bool:
        return self._observations.has_span_detail(run_id)

    def payload(self, run_id: str, digest: str) -> Optional[str]:
        return self._observations.payload(run_id, digest)

    def delete(self, run_id: str) -> bool:
        return self._observations.delete(run_id)

    def ledger_by_run(self) -> Mapping[str, dict[str, Any]]:
        return RunObservationStore.ledger_by_run(self._ledger_dir)
