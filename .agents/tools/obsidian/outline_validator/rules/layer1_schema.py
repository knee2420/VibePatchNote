# -*- coding: utf-8 -*-
"""
Layer 1: Outline Top-Level Schema Rules
.outline 최상위 스키마 및 필수 메타데이터 검증
"""

from typing import Any
from .base import BaseOutlineRule, OutlineLintContext, OutlineViolation

REQUIRED_VERSION = "1.0.0"
ALLOWED_VIEW_MODES = {"bullets", "board"}


class RuleValidJson(BaseOutlineRule):
    rule_id = "OUT-SPEC-000"
    description = "파일이 올바른 JSON 객체 형식이어야 합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.is_valid_json or not isinstance(ctx.json_data, dict):
            return [OutlineViolation(self.rule_id, "파일을 JSON 객체로 파싱할 수 없습니다.")]
        return []


class RuleVersionSpec(BaseOutlineRule):
    rule_id = "OUT-SPEC-001"
    description = f"스키마 version 필드는 반드시 문자열 '{REQUIRED_VERSION}'이어야 합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.json_data:
            return []
        version = ctx.json_data.get("version")
        if version is None:
            return [OutlineViolation(self.rule_id, "최상위 'version' 필드가 누락되었습니다.")]
        if not isinstance(version, str):
            return [OutlineViolation(self.rule_id, f"'version' 필드가 문자열이 아닙니다 (현재 타입: {type(version).__name__}, 값: {version}). '{REQUIRED_VERSION}'이어야 합니다.")]
        if version != REQUIRED_VERSION:
            return [OutlineViolation(self.rule_id, f"지원되지 않는 스키마 버전입니다: '{version}' (지원 버전: '{REQUIRED_VERSION}')")]
        return []


class RuleProjectId(BaseOutlineRule):
    rule_id = "OUT-SPEC-002"
    description = "최상위 'id' 필드는 1자 이상의 고유 식별자 문자열이어야 합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.json_data:
            return []
        project_id = ctx.json_data.get("id")
        if not project_id:
            return [OutlineViolation(self.rule_id, "최상위 'id' 필드가 누락되었거나 비어 있습니다.")]
        if not isinstance(project_id, str) or len(project_id.strip()) == 0:
            return [OutlineViolation(self.rule_id, f"'id' 필드는 비어있지 않은 문자열이어야 합니다 (현재 값: {project_id}).")]
        return []


class RuleProjectTitle(BaseOutlineRule):
    rule_id = "OUT-SPEC-003"
    description = "최상위 'title' 필드는 문자열이어야 합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.json_data:
            return []
        title = ctx.json_data.get("title")
        if title is None:
            return [OutlineViolation(self.rule_id, "최상위 'title' 필드가 누락되었습니다.")]
        if not isinstance(title, str):
            return [OutlineViolation(self.rule_id, f"'title' 필드가 문자열이 아닙니다 (현재 타입: {type(title).__name__}).")]
        return []


class RuleRootNodesArray(BaseOutlineRule):
    rule_id = "OUT-SPEC-004"
    description = "'rootNodes' 필드는 노드 객체들의 배열(list)이어야 합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.json_data:
            return []
        root_nodes = ctx.json_data.get("rootNodes")
        if root_nodes is None:
            return [OutlineViolation(self.rule_id, "'rootNodes' 필드가 누락되었습니다.")]
        if not isinstance(root_nodes, list):
            return [OutlineViolation(self.rule_id, f"'rootNodes' 필드는 리스트(배열)여야 합니다 (현재 타입: {type(root_nodes).__name__}).")]
        return []


class RuleDefaultView(BaseOutlineRule):
    rule_id = "OUT-SPEC-005"
    description = "'defaultView' 필드가 존재할 경우 'bullets' 또는 'board'여야 합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.json_data:
            return []
        view = ctx.json_data.get("defaultView")
        if view is not None and view not in ALLOWED_VIEW_MODES:
            return [OutlineViolation(self.rule_id, f"'defaultView' 값이 올바르지 않습니다: '{view}' (허용 값: {sorted(ALLOWED_VIEW_MODES)})")]
        return []


class RuleTimestamps(BaseOutlineRule):
    rule_id = "OUT-SPEC-006"
    description = "'createdAt' 및 'updatedAt'은 필수 밀리초 정수 타임스탬프여야 합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.json_data:
            return []
        violations = []
        for field in ("createdAt", "updatedAt"):
            val = ctx.json_data.get(field)
            if val is None:
                violations.append(OutlineViolation(self.rule_id, f"최상위 필수 필드 '{field}'가 누락되었습니다. 옵시디언 플러그인(Zod safeParse) 요구 규격입니다."))
            elif not isinstance(val, (int, float)):
                violations.append(OutlineViolation(self.rule_id, f"'{field}'는 숫자(밀리초 타임스탬프)여야 합니다 (현재 타입: {type(val).__name__})."))
        return violations


LAYER1_RULES: list[BaseOutlineRule] = [
    RuleValidJson(),
    RuleVersionSpec(),
    RuleProjectId(),
    RuleProjectTitle(),
    RuleRootNodesArray(),
    RuleDefaultView(),
    RuleTimestamps(),
]
