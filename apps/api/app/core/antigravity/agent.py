"""
Antigravity 에이전트 하네스 — AI 통신의 최하단 뼈대.

이 모듈은 "프롬프트를 넣으면 텍스트/JSON 을 돌려준다" 는 범용 통로만 제공합니다.
어떤 도메인의 프롬프트인지 이 계층은 알지 못하며, 알아서도 안 됩니다.
(프롬프트는 각 도메인 패키지가 소유합니다. 예: `app/documents/prompts.py`)

[듀얼 라우팅 아키텍처]
1. 1순위 (초고속 모드): 독립 터미널에 상주하는 Agent Server (:8001)로 HTTP 위임
2. 2순위 (무중단 폴백): 서버 미실행 시 무창(CREATE_NO_WINDOW) 단발 CLI로 즉시 자동 폴백

agy-cli 연동 규칙: `.agents/rules/50-develop/agy-cli/01_scripting_guide/rule.md`
- (A) 헤드리스 실행에는 `--dangerously-skip-permissions` 가 필수입니다.
- (B) 윈도우 cp949 인코딩 사고를 막기 위해 항상 UTF-8 로 캡처합니다.
"""
import json
import logging
import subprocess
import sys
from typing import Any, Dict, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# Windows 프로세스 창 깜빡임 방지 플래그 (CREATE_NO_WINDOW = 0x08000000)
CREATE_NO_WINDOW = 0x08000000 if sys.platform == "win32" else 0

AGENT_SERVER_URL = "http://127.0.0.1:8001"


class AntigravityAgent:
    """
    Antigravity 에이전트 하네스.
    독립 에이전트 서버(:8001) 우선 호출 및 CLI 무창 자동 폴백을 제공합니다.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        executable: Optional[str] = None,
        server_url: str = AGENT_SERVER_URL,
    ) -> None:
        self.model = model or settings.agent_cli_model
        self.timeout_seconds = timeout_seconds or settings.agent_cli_timeout_seconds
        self.executable = executable or settings.agent_cli_bin
        self.server_url = server_url

    def run(self, prompt: str) -> Optional[str]:
        """
        프롬프트를 실행하고 표준출력 원문을 돌려줍니다.
        1) 독립 에이전트 서버 (:8001) 호출 시도
        2) 실패 시 직접 무창 CLI 프로세스로 자동 폴백
        """
        # 1. 상주형 에이전트 서버(:8001) 우선 호출
        via_server = self._run_via_server(prompt)
        if via_server is not None:
            return via_server

        # 2. 서버 미실행 시 로컬 CLI 자동 폴백
        return self._run_via_cli(prompt)

    def run_json(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        프롬프트를 실행하고 응답에서 JSON 객체를 추출합니다.
        1) 에이전트 서버(:8001/agent/run-json) 우선 호출
        2) 실패 시 CLI 실행 후 로컬 JSON 추출 폴백
        """
        # 1. 상주형 에이전트 서버(:8001) 우선 호출
        via_server_json = self._run_via_server_json(prompt)
        if via_server_json is not None:
            return via_server_json

        # 2. 폴백
        raw_output = self._run_via_cli(prompt)
        if not raw_output:
            return None
        return self.extract_json_object(raw_output)

    def _run_via_server(self, prompt: str) -> Optional[str]:
        """8001 포트 에이전트 브릿지 서버로 프롬프트 전송."""
        url = f"{self.server_url}/agent/run"
        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                res = client.post(
                    url,
                    json={
                        "prompt": prompt,
                        "model": self.model,
                        "effort": "low",
                        "timeout_seconds": self.timeout_seconds,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("output", "")
        except (httpx.ConnectError, httpx.ConnectTimeout):
            # 서버가 안 켜져 있는 정상적인 폴백 상황 (디버그 수준 로깅)
            logger.debug("Agent server (%s) is offline. Using local CLI fallback.", self.server_url)
            return None
        except Exception as exc:
            logger.warning("Agent server call failed (%s): %s. Falling back to CLI.", url, exc)
            return None
        return None

    def _run_via_server_json(self, prompt: str) -> Optional[Dict[str, Any]]:
        """8001 포트 에이전트 브릿지 서버로 JSON 프롬프트 전송."""
        url = f"{self.server_url}/agent/run-json"
        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                res = client.post(
                    url,
                    json={
                        "prompt": prompt,
                        "model": self.model,
                        "effort": "low",
                        "timeout_seconds": self.timeout_seconds,
                    },
                )
                if res.status_code == 200:
                    body = res.json()
                    data = body.get("data")
                    if isinstance(data, dict):
                        return data
        except (httpx.ConnectError, httpx.ConnectTimeout):
            logger.debug("Agent server (%s) is offline. Using local CLI fallback.", self.server_url)
            return None
        except Exception as exc:
            logger.warning("Agent server JSON call failed (%s): %s. Falling back to CLI.", url, exc)
            return None
        return None

    def _run_via_cli(self, prompt: str) -> Optional[str]:
        """로컬 CLI (무창 CREATE_NO_WINDOW) 직접 실행 폴백."""
        cmd = [
            self.executable,
            "-p",
            prompt,
            "--model",
            self.model,
            "--dangerously-skip-permissions",
            "--disable-slash-commands",
            "--effort",
            "low",
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
                creationflags=CREATE_NO_WINDOW,
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

    @staticmethod
    def extract_json_object(raw_output: str) -> Optional[Dict[str, Any]]:
        """CLI 응답 텍스트에서 JSON 객체를 관대하게 추출합니다."""
        if not raw_output:
            return None

        parsed = _loads_or_none(raw_output)

        if isinstance(parsed, dict) and "response" in parsed:
            inner = parsed.get("response")
            if isinstance(inner, str):
                unwrapped = _loads_or_none(inner)
                if isinstance(unwrapped, dict):
                    return unwrapped
            return parsed

        if isinstance(parsed, dict):
            return parsed

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
