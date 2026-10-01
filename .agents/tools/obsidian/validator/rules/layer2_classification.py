# -*- coding: utf-8 -*-
"""
Layer 2: 구역/분류 거버넌스 규칙 (Classification Governance Rules)
"""

import os
from .base import BaseLintRule, LintContext, LintViolation


class ClassificationSinglePolicyRule(BaseLintRule):
    rule_id = "CLS-SINGLE-001"
    description = "1.project 구역 최상위 1레벨 관리 폴더명 단일 분류 강제"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if not ctx.fm_data or not isinstance(ctx.fm_data, dict):
            return violations

        if not ctx.path_relative_to_vault:
            return violations

        path_parts = ctx.path_relative_to_vault.split(os.sep)
        if len(path_parts) < 2:
            return violations

        zone_dir = path_parts[0]
        if "1." in zone_dir and "프로젝트" in zone_dir:
            if "🐛 버그 리포트" in path_parts:
                expected_class = "🐛 버그 리포트"
            else:
                expected_class = path_parts[1]
            if not expected_class.startswith("!") and not expected_class.endswith(".md"):
                actual_class = ctx.fm_data.get("분류")
                if actual_class is None:
                    violations.append(
                        LintViolation(
                            rule_id="CLS-MISSING-001",
                            message=f"1.project 구역 노트는 최상위 관리 폴더명인 '- \"{expected_class}\"' 가 반드시 지정되어야 합니다."
                        )
                    )
                else:
                    actual_list = actual_class if isinstance(actual_class, list) else [actual_class]
                    actual_list_str = [str(x).strip('"\'') for x in actual_list]

                    if expected_class not in actual_list_str:
                        violations.append(
                            LintViolation(
                                rule_id="CLS-MISMATCH-001",
                                message=f"현재 위치한 프로젝트 관리 폴더명('{expected_class}')이 분류 속성에 없습니다. (현재: {actual_list_str})"
                            )
                        )

                    # 1레벨 프로젝트 폴더 이외의 하위 디렉토리 또는 외래 분류 검출
                    sub_dirs = [d for d in path_parts[2:-1] if d != expected_class]
                    polluted = [x for x in actual_list_str if x in sub_dirs or x != expected_class]
                    if polluted:
                        violations.append(
                            LintViolation(
                                rule_id=self.rule_id,
                                message=(
                                    f"1.project 구역의 분류는 최상위 관리 폴더명(['{expected_class}']) 단 하나만 허용됩니다. "
                                    f"제거해야 할 침범 항목: {polluted}"
                                )
                            )
                        )
        return violations
