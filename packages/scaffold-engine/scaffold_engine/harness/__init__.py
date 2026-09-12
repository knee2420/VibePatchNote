"""Scaffold Engine — LLM Harness Re-export (Backed by llm_driver package).

LLM 실행 계약의 SSOT는 모노레포 독립 패키지인 `llm_driver`(`packages/llm-driver`)입니다.
이 모듈은 하위 호환성을 위해 `llm_driver`의 계약과 어댑터를 그대로 re-export합니다.
"""
from __future__ import annotations

from llm_driver import (
    AgyCliHarness,
    BaseLlmHarness,
    CLIExecutionResult,
    DEFAULT_CLI_MODEL_NAME,
    DEFAULT_GOOGLE_MODEL_NAME,
    DEFAULT_MODEL_NAME,
    EFFORT_SUFFIXES,
    GoogleGenAiHarness,
    HarnessFactory,
    LlmExecutionResult,
    LocalGemmaHarness,
    MODEL_REGISTRY,
    ModelSpec,
    STATUS_ERROR,
    STATUS_FAILED,
    STATUS_PARSE_ERROR,
    STATUS_SUCCESS,
    STATUS_TIMEOUT,
    UnsupportedProviderError,
    get_model_spec,
    parse_json_payload,
    register_model_spec,
    resolve_effort,
)
from llm_driver.adapters.agy_cli import DEFAULT_MODEL, DEFAULT_TIMEOUT_SECONDS

# 하위 호환용 별칭
AgyHarness = AgyCliHarness
GeminiAdapter = GoogleGenAiHarness
GeminiApiHarness = GoogleGenAiHarness

__all__ = [
    "AgyCliHarness",
    "AgyHarness",
    "BaseLlmHarness",
    "CLIExecutionResult",
    "DEFAULT_CLI_MODEL_NAME",
    "DEFAULT_GOOGLE_MODEL_NAME",
    "DEFAULT_MODEL",
    "DEFAULT_MODEL_NAME",
    "DEFAULT_TIMEOUT_SECONDS",
    "EFFORT_SUFFIXES",
    "GeminiAdapter",
    "GeminiApiHarness",
    "GoogleGenAiHarness",
    "HarnessFactory",
    "LlmExecutionResult",
    "LocalGemmaHarness",
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
