"""`LlmHarness` 구현체 #1 — Antigravity CLI(agy).

규칙: `.agents/rules/50-develop/agy-cli/01_scripting_guide/rule.md`
- `--dangerously-skip-permissions` 필수 (헤드리스에서 권한 프롬프트가 자동 거부됨)
- 윈도우 UTF-8 입출력 강제
- `--json-schema` 로 구조화 출력 강제 (단, 항상 지켜지지는 않으므로 파서가 방어)

새 벤더를 붙이려면 이 파일을 복제하지 말고 `LlmHarness` 를 구현한 클래스를
`harness/` 에 추가한 뒤 `ScaffoldPipeline(harness=...)` 로 주입하면 된다.
"""
from __future__ import annotations

import json
import logging
import os
import subprocess
import tempfile
import time
from typing import Any, Dict, Optional

from .parsing import parse_json_payload

logger = logging.getLogger(__name__)

# 분류 작업에는 flash 계열이 충분히 정확하고 훨씬 빠르다.
DEFAULT_MODEL = "gemini-3.8-flash-low"
# 정상 경로는 15~25초. 재시도까지 최악 75x3=225초로 프런트 가드(240초) 안에 든다.
DEFAULT_TIMEOUT_SECONDS = 75


class AgyHarness:
    """agy-cli 헤드리스 실행 클라이언트."""

    name = "agy"

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
        executable: str = "agy",
    ) -> None:
        self.model = model
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
