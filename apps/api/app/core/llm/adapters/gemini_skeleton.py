"""Google GenAI / Vertex AI SDK 직결 어댑터 — **미연결 스켈레톤**.

CLI 를 거치지 않고 `google-genai` 파이썬 SDK 를 직접 호출하기 위한 자리.
CLI 대비 이점은 프로세스 기동 비용 제거와 스트리밍 제어이고, 대신 인증·쿼터를
호스트가 직접 관리해야 한다.

붙일 때 할 일:

1. `api_key` / ADC 인증 로드
2. `generate_content` 호출 + `response_schema` 로 구조화 강제
3. `usage_metadata` 를 `LlmExecutionResult` 토큰 필드로 매핑
4. 이 프로바이더는 `--effort` 접미사 규칙이 없으므로, 대응하는 `ModelSpec` 은
   `supports_effort_flag=True` 로 등록해야 effort 인자가 살아난다.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union

from scaffold_engine.harness import STATUS_FAILED, BaseLlmHarness, LlmExecutionResult

logger = logging.getLogger(__name__)


class GoogleGenAiHarness(BaseLlmHarness):
    """Google GenAI Direct SDK 인터페이스 스켈레톤."""

    name = "google-genai"

    def __init__(
        self,
        model: str = "gemini-3.8-flash-low",
        api_key: Optional[str] = None,
        timeout_seconds: int = 180,
    ) -> None:
        super().__init__(model=model, timeout_seconds=timeout_seconds)
        self.api_key = api_key

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
    ) -> LlmExecutionResult:
        target_model = model or self.model
        logger.warning("[GoogleGenAiHarness] 미연결 스켈레톤 호출 (model=%s)", target_model)
        return LlmExecutionResult(
            status=STATUS_FAILED,
            model=target_model,
            error="GoogleGenAiHarness is a skeleton adapter — direct SDK connection is not configured.",
            telemetry_metadata={"provider": "google_api", "attached": False},
        )
