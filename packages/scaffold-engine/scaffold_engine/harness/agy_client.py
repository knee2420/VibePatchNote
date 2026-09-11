"""`BaseLlmHarness` 구현체 #1 — Antigravity CLI(agy).

규칙: `.agents/rules/50-develop/agy-cli/01_scripting_guide/rule.md`

- `--dangerously-skip-permissions` 필수 (헤드리스에서 권한 프롬프트가 자동 거부됨)
- 윈도우 UTF-8 입출력 강제 / `CREATE_NO_WINDOW` 로 콘솔 창 억제
- `--json-schema` 로 구조화 출력 강제 (단, 항상 지켜지지는 않으므로 파서가 방어)

**전송 방식: stdin NDJSON (`--input-format stream-json`).**

프롬프트를 `-p <prompt>` 로 명령줄에 실으면 윈도우 32KB 명령줄 한계에 걸려
대형 문서 컨텍스트에서 `WinError 206` 으로 죽는다. `-p` 는 stdin 을 읽지 않으므로
(값을 비우면 "empty prompt" 에러를 뱉는다) 유일한 우회로가 stream-json 입력이다.

실측 확인 (2026-09-08, agy.exe):

- 입력: `{"event":"user","message":{"role":"user","content":[{"type":"text","text":...}]}}` 한 줄.
  `event` 필드가 없으면 CLI 가 거부한다.
- 출력: NDJSON. 마지막 `{"event":"result","result":{...}}` 의 `result` 가
  `--output-format json` 단일 엔벨로프와 **동일한 형태**(status/response/usage/...)다.
- `--json-schema` 병용 시 `result.structured_output` 에 스키마 준수 객체가 담긴다.
  `result.response` 쪽에는 `toolAction` 등 부수 필드가 섞이므로 structured_output 을 우선한다.

새 벤더를 붙이려면 이 파일을 복제하지 말고 `BaseLlmHarness` 를 구현한 클래스를
`harness/` 에 추가한 뒤 `HarnessFactory.register(provider, builder)` 로 등록한다.
"""
from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union

from .base import (
    STATUS_FAILED,
    STATUS_PARSE_ERROR,
    STATUS_TIMEOUT,
    BaseLlmHarness,
    LlmExecutionResult,
)
from .parsing import parse_json_payload
from .registry import DEFAULT_MODEL_NAME, get_model_spec, resolve_effort

logger = logging.getLogger(__name__)

CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0

DEFAULT_MODEL = DEFAULT_MODEL_NAME
DEFAULT_TIMEOUT_SECONDS = 180


def _stdin_envelope(prompt: str) -> str:
    """stream-json 입력 한 줄을 만든다."""
    return json.dumps(
        {
            "event": "user",
            "message": {"role": "user", "content": [{"type": "text", "text": prompt}]},
        },
        ensure_ascii=False,
    ) + "\n"


def _extract_result_envelope(stdout: str) -> Optional[Dict[str, Any]]:
    """NDJSON 스트림에서 최종 결과 엔벨로프를 회수한다.

    `--output-format json` 의 단일 객체 응답도 함께 흡수하므로,
    전송 방식을 되돌리더라도 파싱부는 그대로 쓸 수 있다.
    """
    envelope: Optional[Dict[str, Any]] = None
    for line in stdout.splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            msg = json.loads(line)
        except Exception:
            continue
        if not isinstance(msg, dict):
            continue
        if msg.get("event") == "result" and isinstance(msg.get("result"), dict):
            envelope = msg["result"]
        elif "status" in msg and "usage" in msg:
            envelope = msg
    return envelope


class AgyCliHarness(BaseLlmHarness):
    """agy-cli 헤드리스 실행 어댑터."""

    name = "agy"

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        effort: Optional[str] = None,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
        executable: str = "agy",
    ) -> None:
        super().__init__(model=model, timeout_seconds=timeout_seconds)
        self.effort = effort
        self.executable = executable

    def run_structured(
        self,
        prompt: str,
        *,
        schema_path: Optional[Union[str, Path]] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
        file_path: Optional[Union[str, Path]] = None,
        **kwargs: Any,
    ) -> LlmExecutionResult:
        target_model = model or self.model
        spec = get_model_spec(target_model)
        timeout_sec = timeout or self.timeout_seconds

        cmd = [
            self.executable,
            "--model", target_model,
            "--input-format", "stream-json",
            "--output-format", "stream-json",
            "--dangerously-skip-permissions",
            "--disable-slash-commands",
        ]

        # effort 판정의 유일한 출처는 registry.resolve_effort 다.
        # 모델명이 이미 effort 를 담고 있으면(-low 등) None 이 돌아와 플래그가 붙지 않는다.
        resolved_effort = resolve_effort(spec, effort or self.effort)
        if resolved_effort:
            cmd.extend(["--effort", resolved_effort])

        schema_file, is_temp_schema = self._resolve_schema_file(schema_path, json_schema)
        if schema_file:
            cmd.extend(["--json-schema", schema_file])
        if conversation_id:
            cmd.extend(["--conversation", conversation_id])

        # 호출이 길게 매달릴 수 있으므로 시작 시점도 남긴다(행 진단용).
        logger.info(
            "[agy] 호출 시작 model=%s prompt=%d자 schema=%s timeout=%ds",
            target_model, len(prompt), bool(schema_file), timeout_sec,
        )

        prompt_file = None
        t0 = time.time()
        try:
            # 프롬프트를 디스크 파일로 먼저 영속화하여 던짐 (사용자 요청: 파일 기반 전달)
            temp_dir = Path(tempfile.gettempdir())
            prompt_file = temp_dir / f"agy_prompt_{int(time.time() * 1000)}.ndjson"
            prompt_file.write_text(_stdin_envelope(prompt), encoding="utf-8")

            with open(prompt_file, "r", encoding="utf-8") as stdin_f:
                res = subprocess.run(
                    cmd,
                    stdin=stdin_f,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=timeout_sec,
                    check=False,
                    creationflags=CREATE_NO_WINDOW,
                )
        except subprocess.TimeoutExpired:
            logger.error("[agy] 타임아웃 (%ds, model=%s)", timeout_sec, target_model)
            return LlmExecutionResult(
                status=STATUS_TIMEOUT,
                model=target_model,
                error=f"CLI timed out after {timeout_sec}s",
                duration_seconds=round(time.time() - t0, 3),
                telemetry_metadata={
                    "command": cmd,
                    "timeout_seconds": timeout_sec,
                    "prompt_chars": len(prompt),
                    "prompt_file": str(prompt_file) if prompt_file else None,
                },
            )
        except FileNotFoundError:
            logger.error("[agy] 실행 파일을 찾을 수 없음: %s", self.executable)
            return LlmExecutionResult(
                status=STATUS_FAILED,
                model=target_model,
                error=f"CLI executable not found: {self.executable}",
                duration_seconds=round(time.time() - t0, 3),
                telemetry_metadata={"command": cmd},
            )
        except Exception as e:
            logger.exception("[agy] 프로세스 호출 오류: %s", e)
            return LlmExecutionResult(
                status=STATUS_FAILED,
                model=target_model,
                error=str(e),
                duration_seconds=round(time.time() - t0, 3),
                telemetry_metadata={"command": cmd},
            )
        finally:
            self._cleanup_schema(schema_file, is_temp_schema)
            if prompt_file and prompt_file.exists():
                try:
                    prompt_file.unlink()
                except Exception:
                    pass

        elapsed = round(time.time() - t0, 3)
        raw_stdout = (res.stdout or "").strip()
        envelope = _extract_result_envelope(raw_stdout)

        if envelope is None:
            detail = (res.stderr or raw_stdout or "").strip()
            failed = res.returncode != 0
            logger.error(
                "[agy] 결과 엔벨로프 회수 실패 (code=%d): %s", res.returncode, detail[:300]
            )
            return LlmExecutionResult(
                status=STATUS_FAILED if failed else STATUS_PARSE_ERROR,
                model=target_model,
                raw_response=raw_stdout,
                error=(
                    f"CLI exit {res.returncode}: {detail[:500]}"
                    if failed
                    else "Failed to parse CLI result envelope"
                ),
                duration_seconds=elapsed,
            )

        usage = envelope.get("usage") or {}
        response_text = envelope.get("response") or ""
        status = envelope.get("status", "SUCCESS")

        # 성공 경로에도 반드시 흔적을 남긴다. 수백 초짜리 호출이 로그에 한 줄도
        # 없으면 엔진 로그만 보고는 LLM 이 돌았는지조차 알 수 없다.
        logger.info(
            "[agy] model=%s status=%s %.2fs (prompt=%d자, tokens: in=%d out=%d total=%d)",
            target_model,
            status,
            elapsed,
            len(prompt),
            usage.get("input_tokens", 0),
            usage.get("output_tokens", 0),
            usage.get("total_tokens", 0),
        )

        # 스키마 준수 객체가 있으면 그것이 정본. 없을 때만 본문에서 관대 복원한다.
        structured = envelope.get("structured_output")
        if not isinstance(structured, dict):
            structured = parse_json_payload(response_text) if response_text else None

        return LlmExecutionResult(
            status=status,
            model=target_model,
            structured_output=structured,
            raw_response=response_text or raw_stdout,
            conversation_id=envelope.get("conversation_id") or conversation_id,
            duration_seconds=envelope.get("duration_seconds", elapsed),
            input_tokens=usage.get("input_tokens", 0),
            output_tokens=usage.get("output_tokens", 0),
            thinking_tokens=usage.get("thinking_tokens", 0),
            cache_read_tokens=usage.get("cache_read_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            error=envelope.get("error"),
            telemetry_metadata={
                "provider": spec.provider,
                "transport": "stream-json/stdin",
                "effort_flag": resolved_effort,
                "prompt_chars": len(prompt),
                "wall_seconds": elapsed,
                "command": cmd,
            },
        )

    # --- 내부 ---

    @staticmethod
    def _resolve_schema_file(
        schema_path: Optional[Union[str, Path]],
        json_schema: Optional[Dict[str, Any]],
    ) -> Tuple[Optional[str], bool]:
        """`--json-schema` 에 넘길 파일 경로를 확정한다. 반환: (경로, 임시파일여부)"""
        if schema_path and Path(schema_path).exists():
            return str(Path(schema_path).resolve()), False
        if json_schema:
            try:
                handle = tempfile.NamedTemporaryFile(
                    mode="w", suffix=".json", delete=False, encoding="utf-8"
                )
                json.dump(json_schema, handle, ensure_ascii=False, indent=2)
                handle.close()
                return handle.name, True
            except Exception as e:
                logger.warning("[agy] 임시 스키마 생성 실패 — 스키마 없이 진행: %s", e)
        return None, False

    @staticmethod
    def _cleanup_schema(schema_file: Optional[str], is_temp: bool) -> None:
        if is_temp and schema_file and os.path.exists(schema_file):
            try:
                os.unlink(schema_file)
            except OSError:
                pass


# 하위 호환 별칭 (`core/pipeline.py` 등 기존 참조 지점 보호)
AgyHarness = AgyCliHarness
