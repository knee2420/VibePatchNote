"""
Antigravity 에이전트 하네스 — AI 통신의 최하단 뼈대.

이 모듈은 "프롬프트를 넣으면 텍스트/JSON 을 돌려준다" 는 범용 통로만 제공합니다.
어떤 도메인의 프롬프트인지 이 계층은 알지 못하며, 알아서도 안 됩니다.
(프롬프트는 각 도메인 패키지가 소유합니다. 예: `app/documents/prompts.py`)

agy-cli 연동 규칙: `.agents/rules/50-develop/agy-cli/01_scripting_guide/rule.md`
- (A) 헤드리스 실행에는 `--dangerously-skip-permissions` 가 필수입니다.
- (B) 윈도우 cp949 인코딩 사고를 막기 위해 항상 UTF-8 로 캡처합니다.
"""
import json
import logging
import subprocess
from typing import Any, Dict, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


class AntigravityAgent:
    """
    agy-cli 를 헤드리스로 실행하는 단일 진입점.

    실행 파일명·모델·타임아웃은 전부 `core/config.py` 에서 옵니다.
    이 값들을 호출부에서 하드코딩하지 마십시오.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        executable: Optional[str] = None,
    ) -> None:
        self.model = model or settings.agent_cli_model
        self.timeout_seconds = timeout_seconds or settings.agent_cli_timeout_seconds
        self.executable = executable or settings.agent_cli_bin

    def run(self, prompt: str) -> Optional[str]:
        """
        프롬프트를 실행하고 표준출력 원문을 돌려줍니다.
        실행 자체가 실패하면 서버를 죽이지 않고 None 을 돌려줍니다.
        """
        cmd = [
            self.executable,
            "-p",
            prompt,
            "--model",
            self.model,
            # (A) 헤드리스에서 권한 프롬프트를 띄울 수 없어 자동 거부되는 것을 방지합니다.
            "--dangerously-skip-permissions",
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                # (B) 콘솔 기본 코덱(cp949)이 아니라 항상 UTF-8 로 해석합니다.
                encoding="utf-8",
                errors="replace",
                timeout=self.timeout_seconds,
                check=False,
            )
        except FileNotFoundError:
            logger.error("Agent CLI executable not found: %s", self.executable)
            return None
        except subprocess.TimeoutExpired:
            logger.error("Agent CLI timed out after %ss", self.timeout_seconds)
            return None
        except OSError as exc:
            logger.error("Agent CLI invocation failed: %s", exc, exc_info=True)
            return None

        if result.returncode != 0:
            logger.warning(
                "Agent CLI returned non-zero (%s): %s", result.returncode, result.stderr
            )

        return (result.stdout or "").strip()

    def run_json(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        프롬프트를 실행하고 응답에서 JSON 객체를 추출합니다.
        추출에 실패하면 None 을 돌려주며, 폴백 판단은 호출한 도메인의 몫입니다.
        """
        raw_output = self.run(prompt)
        if not raw_output:
            return None
        return self.extract_json_object(raw_output)

    @staticmethod
    def extract_json_object(raw_output: str) -> Optional[Dict[str, Any]]:
        """CLI 응답 텍스트에서 JSON 객체를 관대하게 추출합니다."""
        if not raw_output:
            return None

        # 1. 원문 전체가 순수 JSON 인 경우
        parsed = _loads_or_none(raw_output)

        # 2. agy-cli wrapper 응답({"response": "..."}) 인 경우 내부 문자열을 한 겹 더 벗깁니다.
        if isinstance(parsed, dict) and "response" in parsed:
            inner = parsed.get("response")
            if isinstance(inner, str):
                unwrapped = _loads_or_none(inner)
                if isinstance(unwrapped, dict):
                    return unwrapped
            return parsed

        if isinstance(parsed, dict):
            return parsed

        # 3. 마크다운 코드블록 등 잡음에 둘러싸인 JSON 을 최외곽 중괄호로 잘라냅니다.
        start_idx = raw_output.find("{")
        end_idx = raw_output.rfind("}")
        if start_idx != -1 and end_idx > start_idx:
            candidate = _loads_or_none(raw_output[start_idx : end_idx + 1])
            if isinstance(candidate, dict):
                return candidate

        logger.warning("Agent CLI response did not contain a JSON object.")
        return None


def _loads_or_none(raw: str) -> Any:
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return None


# 도메인 서비스가 공유하는 기본 하네스 인스턴스.
antigravity_agent = AntigravityAgent()
