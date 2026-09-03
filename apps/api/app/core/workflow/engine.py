"""
Native Workflow Engine — 외부 Dify 클라이언트 의존 없이 DAG 실행 흐름을 통제하는 오케스트레이터.

이 엔진은 도메인 중립입니다. "무엇을 분석할지"는 각 도메인 서비스가 프롬프트로 주입하며,
엔진은 "어떤 노드를 어떤 순서로 실행할지"만 책임집니다.
"""
import asyncio
import logging
from typing import Any, Dict, Optional

from .nodes import AgentJsonNode

logger = logging.getLogger(__name__)


class NativeWorkflowEngine:
    """
    내부 워크플로우 엔진. Dify 의 DAG 실행 개념만 차용하고 구현은 전부 자체 소유입니다.
    노드 실행/상태 전달/에이전트 호출을 관장합니다.
    """

    def __init__(self, agent_node: Optional[AgentJsonNode] = None) -> None:
        self.agent_node = agent_node or AgentJsonNode()

    async def execute_agent_json(self, prompt: str) -> Optional[Dict[str, Any]]:
        """
        단일 에이전트 노드를 실행해 JSON 결과를 돌려줍니다.

        CLI 호출은 블로킹 서브프로세스이므로 별도 스레드에서 실행합니다.
        (그렇지 않으면 타임아웃 동안 FastAPI 이벤트 루프 전체가 멈춥니다.)
        """
        return await asyncio.to_thread(self.agent_node.execute, prompt)
