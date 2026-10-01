# -*- coding: utf-8 -*-
"""
Rules Registry for Obsidian Note Validator
"""

from .base import BaseLintRule, LintContext, LintViolation
from .layer1_syntax import (
    EolRule,
    FrontmatterStructureRule,
    DangerousColonRule,
    MultitextTypeRule,
    WikilinkQuoteRule,
    UnquotedNumberListRule,
)
from .layer2_classification import ClassificationSinglePolicyRule
from .layer3_system_ground_rules import BugReportAuthorGroundRule
from .layer3_decisions import DecisionStatusRule, DecisionProvenanceRule

ALL_RULES: list[BaseLintRule] = [
    # Layer 1: 기본 구문 & 타입 무결성 (Syntax & Frontmatter Base Rules)
    EolRule(),
    FrontmatterStructureRule(),
    DangerousColonRule(),
    MultitextTypeRule(),
    WikilinkQuoteRule(),
    UnquotedNumberListRule(),
    # Layer 2: 구역/분류 거버넌스 (Classification Governance Rules)
    ClassificationSinglePolicyRule(),
    # Layer 3: 볼트 시스템 공식 그라운드 룰 (Vault System Ground Rules)
    BugReportAuthorGroundRule(),
    # Layer 3: 아티팩트 전용 계약 (Artifact-Specific Contracts)
    DecisionStatusRule(),
    DecisionProvenanceRule(),
]

__all__ = [
    "BaseLintRule",
    "LintContext",
    "LintViolation",
    "ALL_RULES",
]
