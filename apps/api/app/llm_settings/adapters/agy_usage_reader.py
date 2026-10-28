"""AGY CLI의 `/usage` 명령을 호출해 현재 quota를 읽는 어댑터."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any


class AgyUsageReader:
    def __init__(self, executable: str, timeout_seconds: int = 20) -> None:
        self._executable = executable
        self._timeout_seconds = timeout_seconds

    def read(self) -> dict[str, Any]:
        executable = self._resolve_executable()
        if not executable:
            raise RuntimeError("Antigravity CLI 실행 파일을 찾지 못했습니다.")
        try:
            completed = subprocess.run(
                [executable, "-p", "/usage", "--output-format", "json"],
                capture_output=True,
                check=False,
                encoding="utf-8",
                errors="replace",
                timeout=self._timeout_seconds,
            )
        except subprocess.TimeoutExpired as exc:
            raise RuntimeError("AGY 사용량 조회 시간이 초과되었습니다.") from exc
        if completed.returncode != 0:
            raise RuntimeError("AGY 사용량을 조회하지 못했습니다. CLI 로그인 상태를 확인해 주세요.")
        try:
            payload = json.loads(completed.stdout)
            data = payload["command"]["data"]
            groups = data["groups"]
        except (KeyError, TypeError, ValueError) as exc:
            raise RuntimeError("AGY 사용량 응답 형식을 해석하지 못했습니다.") from exc
        if not isinstance(groups, list):
            raise RuntimeError("AGY 사용량 응답에 quota 그룹이 없습니다.")
        return {"description": data.get("description", ""), "groups": groups}

    def _resolve_executable(self) -> str | None:
        candidates = [self._executable, shutil.which(self._executable)]
        local_app_data = os.getenv("LOCALAPPDATA")
        if local_app_data:
            candidates.append(str(Path(local_app_data) / "agy" / "bin" / "agy.exe"))
        return next((candidate for candidate in candidates if candidate and Path(candidate).is_file()), None)
