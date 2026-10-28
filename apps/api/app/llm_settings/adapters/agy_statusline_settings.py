"""사용자 AGY 설정에 앱 상태 브리지를 안전하게 등록하는 어댑터."""
from __future__ import annotations

import json
from pathlib import Path


class LocalAgyStatusLineSettings:
    def __init__(self, settings_file: Path, bridge_command: str) -> None:
        self._settings_file = settings_file
        self._bridge_command = bridge_command

    def is_installed(self) -> bool:
        try:
            payload = json.loads(self._settings_file.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return False
        status_line = payload.get("statusLine") if isinstance(payload, dict) else None
        return isinstance(status_line, dict) and status_line.get("command") == self._bridge_command

    def install(self) -> str:
        payload = self._load_existing()
        payload["statusLine"] = {
            "type": "command",
            "command": self._bridge_command,
            # 브리지는 상태를 파일에 기록하는 용도라 기본 AGY 상태줄을 가리지 않는다.
            "stack_with_default": True,
            "enabled": True,
        }
        self._settings_file.parent.mkdir(parents=True, exist_ok=True)
        temporary = self._settings_file.with_suffix(".tmp")
        temporary.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary.replace(self._settings_file)
        return str(self._settings_file)

    def _load_existing(self) -> dict[str, object]:
        if not self._settings_file.exists():
            return {}
        try:
            payload = json.loads(self._settings_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError("AGY settings.json 형식이 올바르지 않아 자동 등록을 중단했습니다.") from exc
        if not isinstance(payload, dict):
            raise ValueError("AGY settings.json 최상위 값이 JSON 객체가 아닙니다.")
        return payload
