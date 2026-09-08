"""
Antigravity 에이전트 하네스 — AI 통신의 최하단 뼈대.

`app.core.llm` 허브(= `scaffold_engine.harness` 계약)로 단일화되어, 별도 :8001 브릿지
데몬 없이도 공식 CLI(agy) 헤드리스 프로토콜(stream-json stdin, --json-schema,
Windows CREATE_NO_WINDOW)을 안전하고 신속하게 수행합니다.

이 모듈은 "프롬프트를 넣으면 텍스트/JSON 을 돌려준다" 는 범용 통로만 제공합니다.
어떤 도메인의 프롬프트인지 이 계층은 알지 못하며, 알아서도 안 됩니다.
"""
import logging
from typing import Any, Dict, Optional

from app.core.config import settings
from app.core.llm import llm_manager, parse_json_payload

logger = logging.getLogger(__name__)


class AntigravityAgent:
    """
    Antigravity 에이전트 하네스 (app.core.llm 일원화).
    단일 프로세스 무창(CREATE_NO_WINDOW) 및 CLI 네이티브 구조화 통신을 제공합니다.
    """

    def __init__(
        self,
        model: Optional[str] = None,
        timeout_seconds: Optional[int] = None,
        executable: Optional[str] = None,
        effort: str = "low",
    ) -> None:
        self.model = model or settings.agent_cli_model
        self.timeout_seconds = timeout_seconds or settings.agent_cli_timeout_seconds
        self.executable = executable or settings.agent_cli_bin
        self.effort = effort
        self.harness = llm_manager.get_harness(
            model=self.model,
            effort=self.effort,
            timeout=self.timeout_seconds,
            executable=self.executable,
        )

    def run(self, prompt: str) -> Optional[str]:
        """
        프롬프트를 실행하고 응답 원문을 반환합니다.
        """
        if not prompt or not prompt.strip():
            return None

        prompt_len = len(prompt)
        logger.info(
            "[AntigravityAgent] run 시작 (model=%s, effort=%s, prompt_len=%d)",
            self.model,
            self.effort,
            prompt_len,
        )

        res = self.harness.run_structured(
            prompt=prompt,
            model=self.model,
            effort=self.effort,
            timeout=self.timeout_seconds,
        )

        if res.status != "SUCCESS":
            logger.error(
                "[AntigravityAgent] run 실패 (status=%s, error=%s, elapsed=%.2fs)",
                res.status,
                res.error,
                res.duration_seconds,
            )
            return None

        logger.info(
            "[AntigravityAgent] run 완료 (status=SUCCESS, elapsed=%.2fs, tokens=%d[in=%d, out=%d])",
            res.duration_seconds,
            res.total_tokens,
            res.input_tokens,
            res.output_tokens,
        )
        return (res.raw_response or "").strip()

    def run_json(
        self, prompt: str, schema: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        프롬프트를 실행하고 응답에서 JSON 객체를 추출합니다.
        스카폴드 엔진의 parse_json_payload 및 스키마 검증을 사용합니다.
        """
        if not prompt or not prompt.strip():
            return None

        prompt_len = len(prompt)
        logger.info(
            "[AntigravityAgent] run_json 시작 (model=%s, schema=%s, prompt_len=%d)",
            self.model,
            bool(schema),
            prompt_len,
        )

        # 1. 스키마가 제공된 경우 표준 run_json(schema 템프파일 + 자동 재시도) 활용
        if schema is not None:
            data = self.harness.run_json(prompt, schema=schema, timeout=self.timeout_seconds)
            if data is not None:
                return data

        # 2. 스키마가 없거나 1차 시도 실패 시 run_structured 호출 후 파싱
        res = self.harness.run_structured(
            prompt=prompt,
            model=self.model,
            effort=self.effort,
            timeout=self.timeout_seconds,
        )

        if res.status != "SUCCESS":
            logger.error(
                "[AntigravityAgent] run_json 실패 (status=%s, error=%s, elapsed=%.2fs)",
                res.status,
                res.error,
                res.duration_seconds,
            )
            return None

        logger.info(
            "[AntigravityAgent] run_json 완료 (status=SUCCESS, elapsed=%.2fs, tokens=%d[in=%d, out=%d])",
            res.duration_seconds,
            res.total_tokens,
            res.input_tokens,
            res.output_tokens,
        )

        if res.structured_output and isinstance(res.structured_output, dict):
            return res.structured_output

        return self.extract_json_object(res.raw_response)

    @staticmethod
    def extract_json_object(raw_output: str) -> Optional[Dict[str, Any]]:
        """CLI 원문 응답에서 JSON 객체를 안전하게 추출합니다."""
        if not raw_output:
            return None
        return parse_json_payload(raw_output, list_key="blocks") or parse_json_payload(raw_output, list_key="")


# 도메인 서비스가 공유하는 기본 하네스 인스턴스.
antigravity_agent = AntigravityAgent()

