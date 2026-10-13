# -*- coding: utf-8 -*-
"""
Rules Registry for Outline Validator
모든 린트 레이어 규칙들을 통합하여 등록
"""

from .base import BaseOutlineRule, OutlineLintContext, OutlineViolation
from .layer1_schema import LAYER1_RULES
from .layer2_node_integrity import LAYER2_RULES
from .layer3_vault_link import LAYER3_RULES

ALL_OUTLINE_RULES: list[BaseOutlineRule] = [
    *LAYER1_RULES,
    *LAYER2_RULES,
    *LAYER3_RULES,
]

__all__ = [
    "BaseOutlineRule",
    "OutlineLintContext",
    "OutlineViolation",
    "ALL_OUTLINE_RULES",
]
