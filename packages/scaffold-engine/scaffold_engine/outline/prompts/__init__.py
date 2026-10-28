"""Outline Prompts Subpackage."""
from pathlib import Path
from .context_builder import DocumentContextBuilder

PROMPTS_DIR = Path(__file__).resolve().parent
SYSTEM_INSTRUCTIONS_PATH = PROMPTS_DIR / "system_instructions.md"
OUTLINE_SCHEMA_PATH = PROMPTS_DIR / "outline_schema.json"

__all__ = [
    "DocumentContextBuilder",
    "SYSTEM_INSTRUCTIONS_PATH",
    "OUTLINE_SCHEMA_PATH",
]
