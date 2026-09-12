"""Scaffold Engine — AgyCliHarness (Re-exported from llm_driver)."""
from __future__ import annotations

from llm_driver.adapters.agy_cli import (
    DEFAULT_MODEL,
    DEFAULT_TIMEOUT_SECONDS,
    AgyCliHarness,
)

AgyHarness = AgyCliHarness

__all__ = ["AgyCliHarness", "AgyHarness", "DEFAULT_MODEL", "DEFAULT_TIMEOUT_SECONDS"]
