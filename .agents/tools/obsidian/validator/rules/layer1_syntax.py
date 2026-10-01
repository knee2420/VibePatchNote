# -*- coding: utf-8 -*-
"""
Layer 1: 공통 구문 및 속성 타입 규칙 (Syntax & Frontmatter Base Rules)
"""

import re
from typing import Optional
import yaml
from .base import BaseLintRule, LintContext, LintViolation


class EolRule(BaseLintRule):
    rule_id = "EOL-001"
    description = "CRLF 줄끝 방지 (LF 강제)"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if b"\r\n" in ctx.raw_bytes[:4096]:
            violations.append(
                LintViolation(
                    rule_id=self.rule_id,
                    message="CRLF(\\r\\n)가 검출되었습니다. 옵시디언 속성창 렌더링 오류를 유발하므로 반드시 LF(\\n)여야 합니다."
                )
            )
        return violations


class FrontmatterStructureRule(BaseLintRule):
    rule_id = "FM-STRUCT-001"
    description = "프론트매터 닫는 --- 검증"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if ctx.text.startswith("---"):
            parts = ctx.text.split("---", 2)
            if len(parts) < 3:
                violations.append(
                    LintViolation(
                        rule_id=self.rule_id,
                        message="프론트매터를 닫는 두 번째 '---' 가 없습니다."
                    )
                )
        return violations


class DangerousColonRule(BaseLintRule):
    rule_id = "YML-COLON-001"
    description = "값 내부 따옴표 없는 ': '(콜론+공백) 매핑 충돌 방지"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if not ctx.fm_raw:
            return violations

        lines = ctx.fm_raw.split("\n")
        for idx, line in enumerate(lines, start=2):
            if ":" in line and not line.strip().startswith("#"):
                _, _, val = line.partition(":")
                val_clean = val.strip()
                if val_clean and not (val_clean.startswith('"') or val_clean.startswith("'")):
                    if ": " in val_clean:
                        violations.append(
                            LintViolation(
                                rule_id=self.rule_id,
                                message=f"값 내부에 따옴표 없이 ': '(콜론+공백)이 포함되어 YAML 키 매핑 파싱 에러를 유발합니다: {line.strip()}",
                                line=idx
                            )
                        )
        return violations


class MultitextTypeRule(BaseLintRule):
    rule_id = "TYP-NUM-001"
    description = "multitext 속성 내 숫자(int/float) 침범 방지"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if not ctx.fm_data or not isinstance(ctx.fm_data, dict):
            return violations

        multitext_fields = ["분류", "주제", "담당", "작성자"]
        for field in multitext_fields:
            if field in ctx.fm_data and ctx.fm_data[field] is not None:
                val = ctx.fm_data[field]
                if isinstance(val, list):
                    for item in val:
                        if isinstance(item, (int, float)):
                            violations.append(
                                LintViolation(
                                    rule_id=self.rule_id,
                                    message=f"'{field}' 속성에 숫자({item})가 검출되었습니다. 옵시디언 multitext 경고(⚠️)를 유발하므로 큰따옴표('- \"{item}\"')로 감싸야 합니다."
                                )
                            )
                elif isinstance(val, (int, float)):
                    violations.append(
                        LintViolation(
                            rule_id=self.rule_id,
                            message=f"'{field}' 속성 값({val})이 숫자입니다. 옵시디언 multitext 경고(⚠️)를 유발하므로 큰따옴표('- \"{val}\"')로 감싸야 합니다."
                        )
                    )
        return violations


class WikilinkQuoteRule(BaseLintRule):
    rule_id = "LNK-QUOTE-001"
    description = "리스트 위키링크 따옴표 강제 (- \"[[...]]\")"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if not ctx.fm_raw:
            return violations

        unquoted = re.search(r"^\s*-\s+\[\[.+?\]\]", ctx.fm_raw, re.MULTILINE)
        if unquoted:
            violations.append(
                LintViolation(
                    rule_id=self.rule_id,
                    message=f"리스트의 위키링크는 따옴표로 감싸야 합니다 -> '- \"[[...]]\"' ({unquoted.group(0).strip()})"
                )
            )
        return violations


class UnquotedNumberListRule(BaseLintRule):
    rule_id = "NUM-QUOTE-001"
    description = "리스트 항목 따옴표 없는 마침표 숫자/날짜 방지 (float 캐스팅 방지)"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if not ctx.fm_raw:
            return violations

        unquoted_num_pattern = re.compile(r"^\s*-\s+(\d+\.\d+(?:\.\d+)*)\s*$", re.MULTILINE)
        for match in unquoted_num_pattern.finditer(ctx.fm_raw):
            matched_str = match.group(1)
            violations.append(
                LintViolation(
                    rule_id=self.rule_id,
                    message=f"리스트 항목 '- {matched_str}' 에 따옴표가 없습니다. float 캐스팅 경고(⚠️) 방지를 위해 '- \"{matched_str}\"' 로 감싸야 합니다."
                )
            )
        return violations
