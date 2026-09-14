"""`RunArchivePort` 의 로컬 파일 구현.

**run 디렉터리의 레이아웃을 아는 것은 이 어댑터뿐이다.** 서비스는 `run_id` 와
계약 모양만 안다.

    {runs}/{run_id}/events.jsonl    실행 생애주기 (정본)
    {runs}/{run_id}/meta.json       텔레메트리 요약 (없을 수 있다)
    {runs}/{run_id}/ledger.jsonl    스팬·시도 (없을 수 있다)
    {runs}/{run_id}/snapshots.json  단계 스냅샷 (없을 수 있다)
    {runs}/{run_id}/payloads/       외부화된 대용량 본문
    {ledger}/{YYYY-MM}.jsonl        토큰·비용 원장

한 건이 깨져도 목록 전체를 잃지 않는다. 관측 도구는 깨진 기록을 보여주는 것이
일이다.
"""
from __future__ import annotations

import json
import logging
import shutil
from pathlib import Path
from typing import Any, Mapping, Optional

from agent_runtime import LocalAgentRunRepository

from app.core.storage.ids import safe_segment
from app.core.storage.payloads import read_payload

logger = logging.getLogger(__name__)

META_FILE = "meta.json"
LEDGER_FILE = "ledger.jsonl"
SNAPSHOTS_FILE = "snapshots.json"


class LocalRunArchive:
    """디스크에 남은 실행 기록을 계약 모양으로 돌려준다."""

    def __init__(self, runs_dir: Path, ledger_dir: Path) -> None:
        self._runs_dir = runs_dir
        self._ledger_dir = ledger_dir
        self._lifecycles = LocalAgentRunRepository(runs_dir)

    # --- 위치 ----------------------------------------------------------

    def _run_dir(self, run_id: str) -> Optional[Path]:
        try:
            safe_id = safe_segment(run_id)
        except ValueError:
            return None
        candidate = self._runs_dir / safe_id
        return candidate if candidate.is_dir() else None

    # --- 조회 ----------------------------------------------------------

    def list_run_ids(self) -> list[str]:
        if not self._runs_dir.exists():
            return []
        return [entry.name for entry in self._runs_dir.iterdir() if entry.is_dir()]

    def lifecycle(self, run_id: str) -> Any | None:
        return self._lifecycles.get(run_id)

    def meta(self, run_id: str) -> dict[str, Any]:
        run_dir = self._run_dir(run_id)
        if run_dir is None:
            return {}
        loaded = self._read_json(run_dir / META_FILE, run_id)
        return loaded if isinstance(loaded, dict) else {}

    def spans(self, run_id: str) -> list[dict[str, Any]]:
        spans, _ = self._read_ledger(run_id)
        if spans:
            return spans
        # 원장이 없던 시절의 run 은 요약 안에 스팬을 인라인으로 들고 있다.
        inline = self.meta(run_id).get("spans")
        return inline if isinstance(inline, list) else []

    def attempts(self, run_id: str) -> list[dict[str, Any]]:
        _, attempts = self._read_ledger(run_id)
        return attempts

    def snapshots(self, run_id: str) -> list[dict[str, Any]]:
        run_dir = self._run_dir(run_id)
        if run_dir is None:
            return []
        raw = self._read_json(run_dir / SNAPSHOTS_FILE, run_id)
        if isinstance(raw, dict):
            # 옛 기록은 `{stage_name: payload}` 딕셔너리다.
            return [
                {"stage_id": name, "stage_name": name, "payload": payload}
                for name, payload in raw.items()
            ]
        return [item for item in raw if isinstance(item, dict)] if isinstance(raw, list) else []

    def has_span_detail(self, run_id: str) -> bool:
        run_dir = self._run_dir(run_id)
        return run_dir is not None and (run_dir / LEDGER_FILE).is_file()

    def payload(self, run_id: str, digest: str) -> Optional[str]:
        run_dir = self._run_dir(run_id)
        if run_dir is None:
            return None
        return read_payload(run_dir, digest)

    def delete(self, run_id: str) -> bool:
        run_dir = self._run_dir(run_id)
        if run_dir is None:
            return False
        try:
            shutil.rmtree(run_dir)
        except OSError as exc:
            logger.error("[RunArchive] run 삭제 실패 (%s): %s", run_id, exc)
            return False
        logger.info("[RunArchive] run 삭제 완료: %s", run_id)
        return True

    def ledger_by_run(self) -> Mapping[str, dict[str, Any]]:
        """월별 원장을 `run_id` 로 색인한다.

        **비용의 정본은 원장이다** (`observability.md` §2-2). 스팬 `usage` 합산은
        표시용 파생일 뿐이고, 계측되지 않은 파이프라인의 비용은 거기 잡히지 않는다.
        같은 run 이 여러 번 기록됐으면 마지막 줄이 최종이다.
        """
        indexed: dict[str, dict[str, Any]] = {}
        if not self._ledger_dir.exists():
            return indexed
        for path in sorted(self._ledger_dir.glob("*.jsonl")):
            for row in self._read_jsonl(path):
                run_id = row.get("run_id")
                if isinstance(run_id, str) and run_id:
                    indexed[run_id] = row
        return indexed

    # --- 파일 ----------------------------------------------------------

    def _read_ledger(self, run_id: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        run_dir = self._run_dir(run_id)
        if run_dir is None:
            return [], []
        spans: list[dict[str, Any]] = []
        attempts: list[dict[str, Any]] = []
        for item in self._read_jsonl(run_dir / LEDGER_FILE):
            event_type = item.get("event_type")
            data = item.get("data")
            if event_type == "span" and isinstance(data, dict):
                spans.append(data)
            elif event_type == "attempt" and isinstance(data, dict):
                attempts.append(data)
            elif event_type is None:
                # 이벤트 봉투가 없던 시절의 줄은 그 자체가 스팬이다.
                spans.append(item)
        return spans, attempts

    @staticmethod
    def _read_json(path: Path, run_id: str) -> Any:
        if not path.is_file():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            logger.warning("[RunArchive] %s 해석 실패 (%s): %s", path.name, run_id, exc)
            return None

    @staticmethod
    def _read_jsonl(path: Path) -> list[dict[str, Any]]:
        if not path.is_file():
            return []
        try:
            raw = path.read_text(encoding="utf-8")
        except OSError as exc:
            logger.warning("[RunArchive] %s 를 읽지 못했습니다: %s", path.name, exc)
            return []
        rows: list[dict[str, Any]] = []
        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                parsed = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(parsed, dict):
                rows.append(parsed)
        return rows
