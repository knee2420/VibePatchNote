"""Scaffold Engine — Base LLM Harness & Execution Result (SSOT 계약).

모든 모델 하네스(CLI, REST, 로컬 서빙, SDK 직결)가 준수하는 단일 규격이다.
호스트 앱(`apps/api`)도 이 계약을 **재정의하지 않고 그대로 가져다 쓴다** —
같은 계약이 두 벌 존재하면 시그니처가 조용히 갈라진다(P5).

설계 결정:

- `run_structured` 의 `prompt` 이후 인자는 **전부 키워드 전용**이다.
  구현체마다 인자 순서가 달라 위치 인자로 넘겼을 때 엉뚱한 값이 박히는 사고를 원천 차단한다.
- `run_text` / `run_json` 은 **구상 메서드**다. 어댑터는 `run_structured` 하나만 구현하면 된다.
  세 벌씩 복붙하던 것을 여기 한 곳으로 모은다.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union

from .parsing import parse_json_payload
from .registry import DEFAULT_MODEL_NAME

logger = logging.getLogger(__name__)

# 실행 상태 값 (CLI 엔벨로프의 status 를 그대로 흡수한다)
STATUS_SUCCESS = "SUCCESS"
STATUS_ERROR = "ERROR"
STATUS_FAILED = "FAILED"
STATUS_TIMEOUT = "TIMEOUT"
STATUS_PARSE_ERROR = "PARSE_ERROR"


@dataclass
class LlmExecutionResult:
    """하네스 실행 결과 표준 엔벨로프 및 세션 텔레메트리."""

    status: str = STATUS_SUCCESS
    model: str = ""
    structured_output: Optional[Dict[str, Any]] = None
    raw_response: str = ""
    conversation_id: Optional[str] = None
    duration_seconds: float = 0.0
    input_tokens: int = 0
    output_tokens: int = 0
    thinking_tokens: int = 0
    cache_read_tokens: int = 0
    total_tokens: int = 0
    error: Optional[str] = None
    telemetry_metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def ok(self) -> bool:
        return self.status == STATUS_SUCCESS


# 하위 호환 별칭 (구 `CLIExecutionResult` 참조 지점 보호)
CLIExecutionResult = LlmExecutionResult


class BaseLlmHarness(ABC):
    """모든 LLM 공급자 어댑터의 기저 추상 클래스."""

    name = "base"

    def __init__(
        self,
        model: str = DEFAULT_MODEL_NAME,
        timeout_seconds: int = 180,
    ) -> None:
        self.model = model
        self.timeout_seconds = timeout_seconds

    @abstractmethod
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
        """JSON Schema 를 걸어 정형 데이터를 1-Stage 로 회수한다. 어댑터의 유일한 필수 구현."""
        raise NotImplementedError

    def run_text(
        self,
        prompt: str,
        *,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> LlmExecutionResult:
        """스키마 없이 텍스트 응답을 받는다."""
        return self.run_structured(
            prompt,
            model=model,
            effort=effort,
            conversation_id=conversation_id,
            timeout=timeout,
        )

    def run_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        retries: int = 2,
        retry_hint: str = "",
        list_key: str = "blocks",
        *,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """JSON 을 회수한다. 형식 위반 시 힌트를 덧붙여 재시도. 실패 시 None.

        `core.interfaces.LlmHarness` 프로토콜의 구현체이기도 하다.
        """
        for attempt in range(retries + 1):
            body = prompt if attempt == 0 else prompt + retry_hint
            res = self.run_structured(
                body,
                json_schema=schema,
                model=model,
                effort=effort,
                timeout=timeout,
            )

            payload = res.structured_output if isinstance(res.structured_output, dict) else None
            if payload is None:
                payload = parse_json_payload(res.raw_response, list_key)

            # list_key 를 쓰는 스키마면 그 키가 채워져야 성공으로 본다.
            # 그 키를 아예 안 쓰는 스키마(임의 객체)면 파싱 성공만으로 충분하다.
            if payload and (payload.get(list_key) or list_key not in payload):
                return payload

            logger.warning(
                "[%s] JSON 회수 실패 (시도 %d/%d, status=%s). 앞부분: %s",
                self.name, attempt + 1, retries + 1, res.status,
                (res.raw_response or "")[:200],
            )
        return None
