"""Wireframe 블록 판정 및 분류 패키지."""
from .agent import FALLBACK_ROLE, SlotClassifier
from .prompt import build_classification_prompt, render_blocks
from .schema import (
    BLOCK_CLASSIFICATION_SCHEMA,
    ROLES,
    SHAPE_REMINDER,
    SLOT_ROLES,
)

__all__ = [
    "SlotClassifier",
    "FALLBACK_ROLE",
    "build_classification_prompt",
    "render_blocks",
    "BLOCK_CLASSIFICATION_SCHEMA",
    "ROLES",
    "SLOT_ROLES",
    "SHAPE_REMINDER",
]
