"""LLM 하네스 계약 · 모델 레지스트리 · 구현체 모음.

이 패키지가 LLM 계약의 **정본(SSOT)** 이다. 호스트 앱(`apps/api`)은 계약을 다시
정의하지 말고 여기서 가져다 쓰고, 호스트 고유의 것(설정 주입, 감사 로그, 자체 어댑터)만
자기 쪽에 둔다.

- `registry` — 모델 프로필 카탈로그와 effort 판정
- `base` — 실행 결과 엔벨로프 + 어댑터 추상 계약
- `agy_client` — Antigravity CLI 어댑터
- `factory` — 프로바이더별 어댑터 라우팅 (호스트 확장 지점)
"""
from .agy_client import DEFAULT_MODEL, DEFAULT_TIMEOUT_SECONDS, AgyCliHarness, AgyHarness
from .base import (
    STATUS_ERROR,
    STATUS_FAILED,
    STATUS_PARSE_ERROR,
    STATUS_SUCCESS,
    STATUS_TIMEOUT,
    BaseLlmHarness,
    CLIExecutionResult,
    LlmExecutionResult,
)
from .factory import HarnessFactory, UnsupportedProviderError
from .parsing import parse_json_payload
from .registry import (
    DEFAULT_MODEL_NAME,
    EFFORT_SUFFIXES,
    MODEL_REGISTRY,
    ModelSpec,
    get_model_spec,
    register_model_spec,
    resolve_effort,
)

__all__ = [
    "AgyCliHarness",
    "AgyHarness",
    "BaseLlmHarness",
    "CLIExecutionResult",
    "DEFAULT_MODEL",
    "DEFAULT_MODEL_NAME",
    "DEFAULT_TIMEOUT_SECONDS",
    "EFFORT_SUFFIXES",
    "HarnessFactory",
    "LlmExecutionResult",
    "MODEL_REGISTRY",
    "ModelSpec",
    "STATUS_ERROR",
    "STATUS_FAILED",
    "STATUS_PARSE_ERROR",
    "STATUS_SUCCESS",
    "STATUS_TIMEOUT",
    "UnsupportedProviderError",
    "get_model_spec",
    "parse_json_payload",
    "register_model_spec",
    "resolve_effort",
]
