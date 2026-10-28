"""v1 — 등급 디렉터리로 분리한다 (XDG Base Directory Specification).

전(前):

    uploads/  storage/  logs/  workspaces_db.json

후(後):

    config/  data/  cache/  state/

이 단계는 **식별자를 바꾸지 않는다.** 옮기기만 한다. 옮기기와 식별자 변경을
한 단계에 섞으면 실패했을 때 어디까지 진행됐는지 알 수 없다.
`uploads/` 와 `storage/documents/` 는 v2 가 처리하도록 그대로 둔다.
"""
from __future__ import annotations

import json
import logging
import shutil
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def run(base_dir: Path) -> None:
    legacy_storage = base_dir / "storage"
    legacy_logs = base_dir / "logs"
    legacy_db = base_dir / "workspaces_db.json"

    config_dir = base_dir / "config"
    data_dir = base_dir / "data"
    state_dir = base_dir / "state"

    for directory in (config_dir, data_dir, state_dir):
        directory.mkdir(parents=True, exist_ok=True)

    _move_runtime_state(legacy_storage, config_dir, state_dir)
    _move_agent_runs(legacy_storage / "agent-runs", data_dir / "runs")
    _move_logs(legacy_logs, state_dir / "log")
    _split_sessions(legacy_db, data_dir / "memory" / "sessions")


def _move_runtime_state(legacy_storage: Path, config_dir: Path, state_dir: Path) -> None:
    """만료 상태는 state/ 로, 사용자 설정은 config/ 로."""
    moves = {
        "provider-state.json": state_dir / "provider-state.json",
        "agy-status.json": state_dir / "agy-status.json",
        "llm-runtime-policy.json": config_dir / "llm-runtime-policy.json",
    }
    for name, target in moves.items():
        source = legacy_storage / name
        if source.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(source), str(target))
            logger.info("[v1] %s -> %s", source.name, target)


def _move_agent_runs(legacy_runs: Path, target_root: Path) -> None:
    """실행 기록을 이력 기반 구조로 옮긴다.

    구 형식은 최종 상태 한 덩어리였다. 그 상태를 만들어 낸 이벤트를 되살릴 수는
    없으므로, "시작했고 이렇게 끝났다" 두 줄로 최소 이력을 합성한다.
    """
    if not legacy_runs.exists():
        return

    for path in legacy_runs.glob("*.json"):
        try:
            payload: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            logger.warning("[v1] 해석할 수 없는 실행 기록을 건너뜁니다: %s", path.name)
            continue

        run_id = payload.get("run_id") or path.stem
        run_dir = target_root / run_id
        run_dir.mkdir(parents=True, exist_ok=True)

        started_at = payload.get("started_at")
        finished_at = payload.get("finished_at") or started_at
        status = payload.get("status", "failed")

        events: list[dict[str, Any]] = [
            {
                "type": "started",
                "at": started_at,
                "agent_name": payload.get("agent_name"),
                "trace_id": payload.get("trace_id"),
            }
        ]
        if status == "completed":
            events.append({"type": "succeeded", "at": finished_at, "result": payload.get("result")})
        else:
            # queued/running 인 채 남은 것은 프로세스와 함께 끊긴 실행이다.
            events.append(
                {
                    "type": "failed",
                    "at": finished_at,
                    "error_code": payload.get("error_code") or "AGENT_RUN_INTERRUPTED",
                    "detail": payload.get("metadata") or {},
                }
            )

        with (run_dir / "events.jsonl").open("w", encoding="utf-8") as handle:
            for event in events:
                handle.write(json.dumps(event, ensure_ascii=False) + "\n")

        logger.info("[v1] 실행 기록 이관: %s", run_id)

    shutil.rmtree(legacy_runs, ignore_errors=True)


def _move_logs(legacy_logs: Path, target: Path) -> None:
    if not legacy_logs.exists():
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        shutil.rmtree(target, ignore_errors=True)
    shutil.move(str(legacy_logs), str(target))
    logger.info("[v1] logs/ -> %s", target)


def _split_sessions(legacy_db: Path, target_root: Path) -> None:
    """세션 하나가 파일 하나가 되도록 쪼갠다."""
    if not legacy_db.exists():
        return
    try:
        sessions: dict[str, Any] = json.loads(legacy_db.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        logger.error("[v1] workspaces_db.json 을 읽을 수 없어 세션 이관을 건너뜁니다.")
        return

    target_root.mkdir(parents=True, exist_ok=True)
    for session_id, session in sessions.items():
        (target_root / f"{session_id}.json").write_text(
            json.dumps(session, ensure_ascii=False, indent=2), encoding="utf-8"
        )
    logger.info("[v1] 세션 %d건 분리 완료", len(sessions))
    legacy_db.unlink()
