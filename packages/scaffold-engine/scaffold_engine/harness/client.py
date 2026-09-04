"""Antigravity CLI Harness Client.

agy-cli 를 서브프로세스로 헤드리스 실행하고 응답을 파싱합니다.
규칙: .agents/rules/50-develop/agy-cli/01_scripting_guide/rule.md
- --dangerously-skip-permissions 필수
- 윈도우 UTF-8 입출력 강제
"""
import json
import logging
import subprocess
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# 기본 주력 모델 (규칙: Gemini-3.8-flash 또는 Gemini-3.1-pro)
DEFAULT_MODEL = "gemini-3.8-flash-low"
DEFAULT_TIMEOUT_SECONDS = 120


class AntigravityClient:
    """agy-cli 헤드리스 실행 클라이언트."""

    def __init__(
        self,
        model: str = DEFAULT_MODEL,
        timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
        executable: str = "agy",
    ) -> None:
        self.model = model
        self.timeout_seconds = timeout_seconds
        self.executable = executable

    def run(self, prompt: str) -> Optional[str]:
        """프롬프트를 agy-cli에 전달하고 원본 출력을 반환합니다."""
        cmd = [
            self.executable,
            "-p",
            prompt,
            "--model",
            self.model,
            "--dangerously-skip-permissions",
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=self.timeout_seconds,
                check=False,
            )
        except FileNotFoundError:
            logger.error("agy executable not found: %s", self.executable)
            return None
        except subprocess.TimeoutExpired:
            logger.error("agy-cli timed out after %ds", self.timeout_seconds)
            return None
        except OSError as exc:
            logger.error("agy-cli execution error: %s", exc)
            return None

        if result.returncode != 0:
            logger.warning("agy-cli returned non-zero (%d): %s", result.returncode, result.stderr)

        return (result.stdout or "").strip()

    def run_json(self, prompt: str) -> Optional[Dict[str, Any]]:
        """프롬프트를 실행하고 응답에서 JSON 객체를 추출합니다."""
        raw_output = self.run(prompt)
        if not raw_output:
            return None
        return self._extract_json_object(raw_output)

    @staticmethod
    def _extract_json_object(raw_output: str) -> Optional[Dict[str, Any]]:
        """출력 문자열에서 안전하게 JSON 객체를 발췌합니다."""
        # 1. 원문 직접 파싱
        try:
            parsed = json.loads(raw_output)
            if isinstance(parsed, dict):
                # agy wrapper 응답인 경우
                if "response" in parsed and isinstance(parsed["response"], str):
                    try:
                        inner = json.loads(parsed["response"])
                        if isinstance(inner, dict):
                            return inner
                    except json.JSONDecodeError:
                        pass
                return parsed
        except json.JSONDecodeError:
            pass

        # 2. 마크다운 코드블록 내 JSON 추출 (```json ... ```)
        if "```json" in raw_output:
            try:
                parts = raw_output.split("```json")
                for part in parts[1:]:
                    block = part.split("```")[0].strip()
                    parsed = json.loads(block)
                    if isinstance(parsed, dict):
                        return parsed
            except Exception:
                pass

        # 3. 최외곽 중괄호 잘라내기
        start_idx = raw_output.find("{")
        end_idx = raw_output.rfind("}")
        if start_idx != -1 and end_idx > start_idx:
            candidate = raw_output[start_idx : end_idx + 1]
            try:
                parsed = json.loads(candidate)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                pass

        return None
