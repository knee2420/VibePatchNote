# -*- coding: utf-8 -*-
"""
Outline LintRule Base Classes & Context
.outline 파일 전용 린트 규칙 기본 클래스 및 컨텍스트
"""

from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class OutlineViolation:
    rule_id: str
    message: str
    node_id: Optional[str] = None
    node_text: Optional[str] = None

    def __str__(self) -> str:
        loc = f" [Node: {self.node_id}]" if self.node_id else ""
        text_preview = f" ('{self.node_text[:30]}...')" if self.node_text else ""
        return f"[{self.rule_id}]{loc}{text_preview} {self.message}"


@dataclass
class OutlineLintContext:
    file_path: str
    raw_bytes: bytes
    raw_text: str
    json_data: Optional[dict] = None
    is_valid_json: bool = False
    vault_root: Optional[str] = None
    path_relative_to_vault: Optional[str] = None
    all_node_ids: set[str] = field(default_factory=set)


class BaseOutlineRule:
    rule_id: str = "OUT-BASE"
    description: str = "Base outline rule"

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        raise NotImplementedError
