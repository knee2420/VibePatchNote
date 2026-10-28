"""[01.outline_extraction_v2] Antigravity CLI 네이티브 구조화 하네스 클라이언트."""
from dataclasses import dataclass, field
import json
import logging
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)
CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0


@dataclass
class CLIExecutionResult:
    status: str
    structured_output: Optional[Dict[str, Any]] = None
    conversation_id: Optional[str] = None
    duration_seconds: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    thinking_tokens: int = 0
    total_tokens: int = 0
    raw_response: str = ""
    error: Optional[str] = None


class AntigravityCLIClient:
    """Antigravity CLI의 네이티브 구조화 출력(--json-schema, --output-format json) 및 텔레메트리 연동기."""

    def __init__(
        self,
        executable: str = "agy",
        default_model: str = "gemini-3.8-flash-low",
        default_effort: str = "low",
        timeout_seconds: int = 180,
    ) -> None:
        self.executable = executable
        self.default_model = default_model
        self.default_effort = default_effort
        self.timeout_seconds = timeout_seconds

    def run_structured(
        self,
        prompt: str,
        schema_path: Optional[Path] = None,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> CLIExecutionResult:
        """
        CLI를 실행하여 강제된 JSON 스키마에 부합하는 구조화된 딕셔너리와 세션 텔레메트리를 반환합니다.
        """
        target_model = model or self.default_model
        target_effort = effort or self.default_effort
        timeout_sec = timeout or self.timeout_seconds

        cmd = [
            self.executable,
            "-p",
            prompt,
            "--model",
            target_model,
            "--effort",
            target_effort,
            "--dangerously-skip-permissions",
            "--disable-slash-commands",
            "--output-format",
            "json",
        ]

        if schema_path and Path(schema_path).exists():
            cmd.extend(["--json-schema", str(Path(schema_path).resolve())])

        if conversation_id:
            cmd.extend(["--conversation", conversation_id])

        t0 = time.time()
        try:
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout_sec,
                check=False,
                creationflags=CREATE_NO_WINDOW,
            )
        except subprocess.TimeoutExpired:
            return CLIExecutionResult(
                status="TIMEOUT",
                error=f"CLI timed out after {timeout_sec}s",
                duration_seconds=round(time.time() - t0, 3),
            )
        except Exception as e:
            return CLIExecutionResult(
                status="FAILED",
                error=str(e),
                duration_seconds=round(time.time() - t0, 3),
            )

        elapsed = round(time.time() - t0, 3)

        if res.returncode != 0:
            return CLIExecutionResult(
                status="ERROR",
                error=f"CLI exit {res.returncode}: {res.stderr[:500]}",
                duration_seconds=elapsed,
            )

        raw_stdout = (res.stdout or "").strip()
        try:
            cli_meta = json.loads(raw_stdout)
        except Exception:
            return CLIExecutionResult(
                status="PARSE_ERROR",
                raw_response=raw_stdout,
                error="Failed to parse CLI envelope JSON",
                duration_seconds=elapsed,
            )

        usage = cli_meta.get("usage", {})
        structured = cli_meta.get("structured_output")
        if not structured and "response" in cli_meta:
            # Fallback if structured_output key wasn't isolated
            try:
                structured = json.loads(cli_meta["response"])
            except Exception:
                pass

        return CLIExecutionResult(
            status=cli_meta.get("status", "SUCCESS"),
            structured_output=structured,
            conversation_id=cli_meta.get("conversation_id"),
            duration_seconds=cli_meta.get("duration_seconds", elapsed),
            input_tokens=usage.get("input_tokens", 0),
            output_tokens=usage.get("output_tokens", 0),
            thinking_tokens=usage.get("thinking_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            raw_response=raw_stdout,
        )
