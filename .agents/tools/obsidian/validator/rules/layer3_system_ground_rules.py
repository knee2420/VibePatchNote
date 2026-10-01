# -*- coding: utf-8 -*-
"""
Layer 3: 볼트 시스템 공식 그라운드 룰 (Vault System Ground Rules)
docs/new-notes.md 및 docs/project-board.md 에 명시된 볼트 시스템 공식 예외 규약 및 거버넌스 강제
"""

import os
from .base import BaseLintRule, LintContext, LintViolation


class BugReportAuthorGroundRule(BaseLintRule):
    """볼트 시스템 공식 그라운드 룰 (docs/new-notes.md §예외: bug):

    '🐛 버그 리포트' 구역의 노트는 칸반 보드에서 카드가 렌더링될 때
    가장 눈에 잘 띄는 위치(작성자 칩)를 통해 버그임을 즉시 식별할 수 있도록,
    '작성자' 속성에 반드시 '[[bug]]' 칩이 포함되어야 합니다.
    사람/에이전트 이름은 순서와 상관없이 함께 병기할 수 있습니다.
    """

    rule_id = "SYS-BUG-001"
    description = "볼트 그라운드 룰: '🐛 버그 리포트' 구역의 카드는 '작성자'에 '[[bug]]' 칩 필수 포함"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []

        file_name = os.path.basename(ctx.file_path)

        # 1. 양식/템플릿 파일('!(Template)*')은 검사 제외 (Bypass)
        if file_name.startswith("!"):
            return violations

        # 2. 버그 리포트 구역 판정: 경로 또는 '분류' 속성에 '🐛 버그 리포트'가 포함된 경우
        is_bug_report = False
        if ctx.path_relative_to_vault and "🐛 버그 리포트" in ctx.path_relative_to_vault:
            is_bug_report = True
        elif ctx.fm_data and isinstance(ctx.fm_data, dict):
            categories = ctx.fm_data.get("분류", [])
            cat_list = categories if isinstance(categories, list) else [categories]
            if any("🐛 버그 리포트" in str(c) for c in cat_list):
                is_bug_report = True

        if not is_bug_report:
            return violations

        # 3. 작성자 속성 무결성 검증 (그라운드 룰: 'bug' 포함 여부 판정, 순서 무관)
        if not ctx.fm_data or not isinstance(ctx.fm_data, dict):
            violations.append(
                LintViolation(
                    rule_id=self.rule_id,
                    message="프론트매터가 없거나 올바르지 않아 '작성자'의 '[[bug]]' 그라운드 룰을 검증할 수 없습니다."
                )
            )
            return violations

        raw_authors = ctx.fm_data.get("작성자")
        if raw_authors is None:
            violations.append(
                LintViolation(
                    rule_id=self.rule_id,
                    message="볼트 시스템 그라운드 룰 위반: '작성자' 속성이 비어있습니다. '[[bug]]' 칩이 반드시 포함되어야 합니다."
                )
            )
            return violations

        author_list = raw_authors if isinstance(raw_authors, list) else [raw_authors]
        # 큰따옴표, 작은따옴표, 대괄호, 공백 제거 후 순수 키워드 추출
        clean_authors = [str(a).strip(" \"'[]") for a in author_list]

        if "bug" not in clean_authors:
            violations.append(
                LintViolation(
                    rule_id=self.rule_id,
                    message=(
                        f"볼트 시스템 그라운드 룰 위반: '🐛 버그 리포트' 카드는 칸반 식별을 위해 "
                        f"'작성자' 속성에 반드시 '[[bug]]' 칩이 포함되어야 합니다. (현재: {author_list})"
                    )
                )
            )

        return violations
