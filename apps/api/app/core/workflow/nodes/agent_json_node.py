"""
AgentJsonNode — 프롬프트를 에이전트에 실행시켜 JSON 객체를 받아오는 범용 실행 노드.

워크플로우 엔진에 플러그인처럼 결합되는 단위이며, 특정 도메인(문서 분석, 웹소설 등)의
지식을 갖지 않습니다. 프롬프트는 호출하는 도메인 서비스가 만들어 주입합니다.
"""
import logging
from typing import Any, Dict, Optional

from scaffold_engine.harness import BaseLlmHarness

logger = logging.getLogger(__name__)


class AgentJsonNode:
    """프롬프트 → 에이전트 실행 → JSON 객체."""

    def __init__(self, harness: BaseLlmHarness) -> None:
        self.harness = harness

    def execute(self, prompt: str) -> Optional[Dict[str, Any]]:
        if not prompt or not prompt.strip():
            raise ValueError("AgentJsonNode requires a non-empty prompt.")

        logger.info("AgentJsonNode executing (model=%s)", self.harness.model)
        # 이 노드는 특정 도메인 스키마를 소유하지 않는다. 존재하지 않는 키를 사용해
        # BaseLlmHarness의 재시도/파싱 기능은 재사용하되, 빈 ``segments`` 같은
        # 유효한 도메인 결과를 실패로 오인하지 않게 한다.
        return self.harness.run_json(prompt, list_key="__workflow_payload__")
