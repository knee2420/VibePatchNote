"""`LlmHarness` 구현체 #1 — Antigravity CLI(agy).

규칙: `.agents/rules/50-develop/agy-cli/01_scripting_guide/rule.md`
- `--dangerously-skip-permissions` 필수 (헤드리스에서 권한 프롬프트가 자동 거부됨)
- 윈도우 UTF-8 입출력 강제
- `--json-schema` 로 구조화 출력 강제 (단, 항상 지켜지지는 않으므로 파서가 방어)

새 벤더를 붙이려면 이 파일을 복제하지 말고 `LlmHarness` 를 구현한 클래스를
`harness/` 에 추가한 뒤 `ScaffoldPipeline(harness=...)` 로 주입하면 된다.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import json
import logging
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict, Optional, Union

from .parsing import parse_json_payload

logger = logging.getLogger(__name__)

CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0

# 분류 및 구조화 작업 주력 모델 (Flash 계열이 충분히 정확하고 빠름)
DEFAULT_MODEL = "gemini-3.8-flash-low"
DEFAULT_TIMEOUT_SECONDS = 180


@dataclass
class CLIExecutionResult:
    """CLI 실행 결과 엔벨로프 및 세션 텔레메트리."""
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


class AgyHarness:
    """agy-cli 헤드리스 실행 클라이언트."""

    name = "agy"

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        effort: str = "low",
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
        executable: str = "agy",
    ) -> None:
        self.model = model
        self.effort = effort
        self.timeout_seconds = timeout_seconds
        self.executable = executable

    def run_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        retries: int = 2,
        retry_hint: str = "",
        list_key: str = "blocks",
    ) -> Optional[Dict[str, Any]]:
        """프롬프트를 실행하고 JSON 을 회수한다. 형식 위반 시 힌트를 덧붙여 재시도."""
        schema_path = None
        if schema is not None:
            handle = tempfile.NamedTemporaryFile(
                "w", suffix=".json", delete=False, encoding="utf-8"
            )
            json.dump(schema, handle)
            handle.close()
            schema_path = handle.name

        try:
            for attempt in range(retries + 1):
                body = prompt if attempt == 0 else prompt + retry_hint
                raw = self._invoke(body, schema_path, attempt)
                payload = parse_json_payload(raw, list_key)
                if payload and payload.get(list_key):
                    return payload
                logger.warning(
                    "[agy] 형식 회수 실패 (시도 %d/%d). 앞부분: %s",
                    attempt + 1, retries + 1, (raw or "")[:200],
                )
        finally:
            if schema_path:
                try:
                    os.unlink(schema_path)
                except OSError:
                    pass
        return None

    def run_structured(
        self,
        prompt: str,
        schema_path: Optional[Union[str, Path]] = None,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> CLIExecutionResult:
        """
        CLI 네이티브 구조화 출력(--json-schema, --output-format json) 및 텔레메트리를 직접 추출합니다.
        """
        target_model = model or self.model
        target_effort = effort or self.effort
        timeout_sec = timeout or self.timeout_seconds

        cmd = [
            self.executable,
            "-p", prompt,
            "--model", target_model,
            "--effort", target_effort,
            "--dangerously-skip-permissions",
            "--disable-slash-commands",
            "--output-format", "json",
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

    # --- 내부 ---

    def _invoke(self, prompt: str, schema_path: Optional[str], attempt: int) -> str:
        cmd = [self.executable, "-p", prompt, "--model", self.model,
               "--output-format", "json", "--dangerously-skip-permissions"]
        if schema_path:
            cmd[-1:-1] = ["--json-schema", schema_path]

        started = time.time()
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, encoding="utf-8",
                errors="replace", timeout=self.timeout_seconds, check=False,
                creationflags=CREATE_NO_WINDOW,
            )
        except FileNotFoundError:
            logger.error("[agy] 실행 파일을 PATH 에서 찾을 수 없습니다: %s", self.executable)
            return ""
        except subprocess.TimeoutExpired:
            logger.error("[agy] %d초 타임아웃 (시도 %d)", self.timeout_seconds, attempt + 1)
            return ""
        except OSError as exc:
            logger.error("[agy] 실행 오류: %s", exc)
            return ""

        elapsed = round(time.time() - started, 1)
        if result.returncode != 0:
            logger.warning("[agy] 종료코드 %d: %s", result.returncode, (result.stderr or "")[:300])
        logger.info("[agy] model=%s %ss (시도 %d)", self.model, elapsed, attempt + 1)
        return (result.stdout or "").strip()
