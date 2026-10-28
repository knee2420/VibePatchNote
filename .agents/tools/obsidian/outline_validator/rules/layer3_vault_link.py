# -*- coding: utf-8 -*-
"""
Layer 3: Obsidian Vault Governance & Links
옵시디언 볼트 통합, 위키링크 정합성, 줄끝 규격 검증
"""

import os
import re
from .base import BaseOutlineRule, OutlineLintContext, OutlineViolation


class RuleWikilinkSyntax(BaseOutlineRule):
    rule_id = "OUT-LNK-001"
    description = "노드 텍스트 내 위키링크([[...]])의 괄호가 정상적으로 닫혀 있어야 합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.json_data or not isinstance(ctx.json_data.get("rootNodes"), list):
            return []

        violations: list[OutlineViolation] = []

        def check_links(nodes: list[dict]):
            for node in nodes:
                if isinstance(node, dict):
                    text = node.get("text", "")
                    if isinstance(text, str):
                        # [[ 개수와 ]] 개수 비교
                        open_count = text.count("[[")
                        close_count = text.count("]]")
                        if open_count != close_count:
                            violations.append(
                                OutlineViolation(
                                    self.rule_id,
                                    f"위키링크 괄호 짝이 맞지 않습니다 ('[[': {open_count}개, ']]': {close_count}개)",
                                    node_id=node.get("id"),
                                    node_text=text,
                                )
                            )
                    children = node.get("children")
                    if isinstance(children, list):
                        check_links(children)

        check_links(ctx.json_data["rootNodes"])
        return violations


class RuleLineEndings(BaseOutlineRule):
    rule_id = "OUT-GOV-001"
    description = "줄끝(Line Ending)은 LF(\\n)여야 합니다. (CRLF 방지)"

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if b"\r\n" in ctx.raw_bytes:
            return [OutlineViolation(self.rule_id, "CRLF(\\r\\n) 줄끝이 감지되었습니다. LF(\\n)로 정규화해야 합니다.")]
        return []


LAYER3_RULES: list[BaseOutlineRule] = [
    RuleWikilinkSyntax(),
    RuleLineEndings(),
]
