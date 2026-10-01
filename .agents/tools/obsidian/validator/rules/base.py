# -*- coding: utf-8 -*-
"""
LintRule Base Classes & Context
"""

from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class LintViolation:
    rule_id: str
    message: str
    line: Optional[int] = None

    def __str__(self) -> str:
        loc = f"Line {self.line} " if self.line else ""
        return f"[{self.rule_id}] {loc}{self.message}"


@dataclass
class LintContext:
    file_path: str
    raw_bytes: bytes
    text: str
    has_frontmatter: bool
    fm_raw: Optional[str]
    fm_data: Optional[dict]
    vault_root: Optional[str]
    path_relative_to_vault: Optional[str]


class BaseLintRule:
    rule_id: str = "BASE"
    description: str = "Base lint rule"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        raise NotImplementedError
