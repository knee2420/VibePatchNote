"""Scaffold Engine — Model Registry (Re-exported from llm_driver)."""
from __future__ import annotations

from llm_driver.registry import (
    DEFAULT_CLI_MODEL_NAME,
    DEFAULT_GOOGLE_MODEL_NAME,
    DEFAULT_MODEL_NAME,
    EFFORT_SUFFIXES,
    MODEL_REGISTRY,
    ModelSpec,
    get_model_spec,
    register_model_spec,
    resolve_effort,
)

__all__ = [
    "EFFORT_SUFFIXES",
    "DEFAULT_GOOGLE_MODEL_NAME",
    "DEFAULT_CLI_MODEL_NAME",
    "DEFAULT_MODEL_NAME",
    "ModelSpec",
    "MODEL_REGISTRY",
    "get_model_spec",
    "register_model_spec",
    "resolve_effort",
]
