"""Scaffold Engine — Base LLM Harness & Execution Result (Re-exported from llm_driver)."""
from __future__ import annotations

from llm_driver.base import (
    CLIExecutionResult,
    STATUS_ERROR,
    STATUS_FAILED,
    STATUS_PARSE_ERROR,
    STATUS_SUCCESS,
    STATUS_TIMEOUT,
    BaseLlmHarness,
    LlmExecutionResult,
)

__all__ = [
    "BaseLlmHarness",
    "LlmExecutionResult",
    "CLIExecutionResult",
    "STATUS_SUCCESS",
    "STATUS_ERROR",
    "STATUS_FAILED",
    "STATUS_TIMEOUT",
    "STATUS_PARSE_ERROR",
]
