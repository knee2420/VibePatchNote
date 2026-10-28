import json
import os
import subprocess
import sys
from pathlib import Path

from app.core.llm import AgyStatusSnapshot


def test_status_snapshot_exposes_safe_agy_runtime_fields(tmp_path):
    path = tmp_path / "agy-status.json"
    path.write_text(
        json.dumps(
            {
                "updatedAt": "2026-09-09T00:00:00Z",
                "model": {"id": "gemini-3.5-flash", "display_name": "Gemini Flash"},
                "cliVersion": "1.0.13",
                "planTier": "Pro",
                "contextWindow": {"used_percentage": 14.24, "remaining_percentage": 85.76},
                "quota": {"gemini-weekly": {"remaining_fraction": 0.93, "reset_in_seconds": 600}},
                "agentState": "working",
                "taskCount": 1,
                "artifactCount": 2,
                "executionMode": "fast",
                "exceeds200kTokens": False,
                "email": "must-not-be-exposed@example.com",
                "transcriptPath": "C:/private/transcript.jsonl",
            }
        ),
        encoding="utf-8",
    )

    snapshot = AgyStatusSnapshot(path).read()

    assert snapshot is not None
    assert snapshot["model"]["id"] == "gemini-3.5-flash"
    assert snapshot["quota"]["gemini-weekly"]["remaining_fraction"] == 0.93
    assert snapshot["taskCount"] == 1
    assert "email" not in snapshot
    assert "transcriptPath" not in snapshot


def test_statusline_bridge_maps_agy_payload_to_snapshot(tmp_path):
    target = tmp_path / "agy-status.json"
    payload = {
        "model": {"id": "gemini-3.5-flash"},
        "version": "1.0.13",
        "context_window": {"used_percentage": 12.5},
        "quota": {"daily": {"remaining_fraction": 0.5}},
        "agent_state": "thinking",
        "task_count": 3,
        "email": "must-not-be-persisted@example.com",
    }
    environment = {**os.environ, "VIBE_AGY_STATUS_SNAPSHOT_FILE": str(target)}
    bridge = Path(__file__).parents[1] / "scripts" / "agy_status_bridge.py"

    subprocess.run(
        [sys.executable, str(bridge)],
        input=json.dumps(payload),
        text=True,
        env=environment,
        check=True,
    )

    persisted = json.loads(target.read_text(encoding="utf-8"))
    assert persisted["model"]["id"] == "gemini-3.5-flash"
    assert persisted["contextWindow"]["used_percentage"] == 12.5
    assert persisted["quota"]["daily"]["remaining_fraction"] == 0.5
    assert persisted["taskCount"] == 3
    assert "email" not in persisted
