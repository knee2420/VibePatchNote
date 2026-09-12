"""Scaffold Engine — GoogleGenAiHarness (Re-exported from llm_driver)."""
from __future__ import annotations

import requests
from llm_driver.adapters.gemini import GoogleGenAiHarness

GeminiAdapter = GoogleGenAiHarness
GeminiApiHarness = GoogleGenAiHarness

__all__ = ["GoogleGenAiHarness", "GeminiAdapter", "GeminiApiHarness", "requests"]
