"""
AgentJsonNode — 프롬프트를 에이전트에 실행시켜 JSON 객체를 받아오는 범용 실행 노드.

워크플로우 엔진에 플러그인처럼 결합되는 단위이며, 특정 도메인(문서 분석, 웹소설 등)의
지식을 갖지 않습니다. 프롬프트는 호출하는 도메인 서비스가 만들어 주입합니다.
"""
import logging
from typing import Any, Dict, Optional

from app.core.antigravity import AntigravityAgent, antigravity_agent

logger = logging.getLogger(__name__)


class AgentJsonNode:
    """프롬프트 → 에이전트 실행 → JSON 객체."""

    def __init__(self, agent: Optional[AntigravityAgent] = None) -> None:
        self.agent = agent or antigravity_agent

    def execute(self, prompt: str) -> Optional[Dict[str, Any]]:
        if not prompt or not prompt.strip():
            raise ValueError("AgentJsonNode requires a non-empty prompt.")

        logger.info("AgentJsonNode executing (model=%s)", self.agent.model)
        return self.agent.run_json(prompt)
