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


RESERVED_STATUS_VALUES = {
    "검토 중",
    "진행 중",
    "완료",
    "보류",
    "미처리",
    "결정 사항",
    "확인 필요",
}


class StatusLeakToClassificationRule(BaseLintRule):
    rule_id = "CLS-STATUS-LEAK-001"
    description = "상태(Status) 속성 값의 분류(Classification) 속성 오염/침범 방지"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if not ctx.fm_data or not isinstance(ctx.fm_data, dict):
            return violations

        actual_class = ctx.fm_data.get("분류")
        if not actual_class:
            return violations

        actual_list = actual_class if isinstance(actual_class, list) else [actual_class]
        actual_list_str = [str(x).strip('"\'') for x in actual_list]

        leaks = [x for x in actual_list_str if x in RESERVED_STATUS_VALUES]
        if leaks:
            violations.append(
                LintViolation(
                    rule_id=self.rule_id,
                    message=(
                        f"상태(Status) 속성 값({leaks})이 분류(Classification) 속성에 침범했습니다. "
                        f"상태는 '상태:' 필드에만 기재되어야 하며, 분류에서 제거해야 합니다."
                    ),
                )
            )
        return violations


class ResourceClassificationRule(BaseLintRule):
    rule_id = "CLS-RESOURCE-SINGLE-001"
    description = "3.resource 구역 최상위 1레벨 관리 폴더명 단일 분류 강제"

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
        if "3." in zone_dir and "자료" in zone_dir:
            expected_class = path_parts[1]
            if expected_class.startswith("!") or expected_class.endswith(".md"):
                return violations

            actual_class = ctx.fm_data.get("분류")
            if actual_class is None:
                violations.append(
                    LintViolation(
                        rule_id="CLS-RESOURCE-MISSING-001",
                        message=f"3.resource 구역 노트는 최상위 1레벨 관리 폴더명인 '- \"{expected_class}\"' 가 반드시 지정되어야 합니다.",
                    )
                )
            else:
                actual_list = actual_class if isinstance(actual_class, list) else [actual_class]
                actual_list_str = [str(x).strip('"\'') for x in actual_list]

                if expected_class not in actual_list_str:
                    violations.append(
                        LintViolation(
                            rule_id="CLS-RESOURCE-MISMATCH-001",
                            message=f"현재 위치한 리소스 관리 폴더명('{expected_class}')이 분류 속성에 없습니다. (현재: {actual_list_str})",
                        )
                    )

                # 단일 분류 강제: 최상위 1레벨 폴더 외의 모든 서브폴더/다중 항목 침범 차단
                polluted = [x for x in actual_list_str if x != expected_class]
                if polluted:
                    violations.append(
                        LintViolation(
                            rule_id=self.rule_id,
                            message=(
                                f"3.resource 구역의 분류는 최상위 1레벨 관리 폴더명(['{expected_class}']) 단 하나만 허용됩니다. "
                                f"제거해야 할 침범 항목: {polluted}"
                            ),
                        )
                    )
        return violations
