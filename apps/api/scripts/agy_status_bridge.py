"""AGY `/statusline` command target.

stdin으로 전달받은 TUI 상태 JSON에서 quota/context 상태만 추려 앱 storage에 쓴다.
사용 예: `/statusline python C:/.../agy_status_bridge.py`
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

target = Path(os.getenv("VIBE_AGY_STATUS_SNAPSHOT_FILE", Path(__file__).resolve().parents[1] / "storage" / "agy-status.json"))
try:
    raw = json.load(sys.stdin)
    snapshot = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "model": raw.get("model", {}),
        "cliVersion": raw.get("version"),
        "planTier": raw.get("plan_tier"),
        "contextWindow": raw.get("context_window", {}),
        "quota": raw.get("quota", {}),
        "agentState": raw.get("agent_state"),
        "taskCount": raw.get("task_count"),
        "artifactCount": raw.get("artifact_count"),
        "executionMode": raw.get("execution_mode"),
        "exceeds200kTokens": raw.get("exceeds_200k_tokens"),
    }
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(snapshot, ensure_ascii=False), encoding="utf-8")
except Exception:
    pass
