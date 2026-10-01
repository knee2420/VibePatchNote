# -*- coding: utf-8 -*-
"""
Layer 3: 결정 카드(Decisions) 거버넌스 및 원천 데이터 혈통(Provenance) 검증 규칙
"""

import glob
import os
import re
from typing import Optional
from .base import BaseLintRule, LintContext, LintViolation


class DecisionStatusRule(BaseLintRule):
    rule_id = "DEC-STAT-001"
    description = "decisions 카드는 상태가 반드시 '결정 사항'이어야 함"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if not ctx.path_relative_to_vault:
            return violations

        norm_rel = os.path.normpath(ctx.path_relative_to_vault)
        parts = norm_rel.split(os.sep)
        file_name = os.path.basename(ctx.file_path)

        # decisions 디렉토리 내 Decision *.md 파일 대상
        if "decisions" in parts and file_name.startswith("Decision"):
            if not ctx.fm_data or not isinstance(ctx.fm_data, dict):
                violations.append(
                    LintViolation(
                        rule_id=self.rule_id,
                        message="decisions 카드는 프론트매터가 필수이며 '상태: 결정 사항'이어야 합니다."
                    )
                )
                return violations

            current_status = ctx.fm_data.get("상태")
            if current_status != "결정 사항":
                violations.append(
                    LintViolation(
                        rule_id=self.rule_id,
                        message=f"결정 사항 상태 불일치: decisions 카드의 상태는 반드시 '결정 사항'이어야 합니다. (현재: '{current_status}')"
                    )
                )
        return violations


class DecisionProvenanceRule(BaseLintRule):
    rule_id = "DEC-LNK-001"
    description = "decisions 카드는 회의록/공유회 A5.outputs 원 정리본 링크(D{N}_*.md)가 필수 바인딩되어야 함"

    def check(self, ctx: LintContext) -> list[LintViolation]:
        violations = []
        if not ctx.path_relative_to_vault or not ctx.vault_root:
            return violations

        norm_rel = os.path.normpath(ctx.path_relative_to_vault)
        parts = norm_rel.split(os.sep)
        file_name = os.path.basename(ctx.file_path)

        if "decisions" not in parts or not file_name.startswith("Decision"):
            return violations

        # 1. 결정 번호 추출 (예: Decision 01 -> "1", "D1")
        num_match = re.search(r"Decision\s*0?(\d+)", file_name, re.IGNORECASE)
        if not num_match:
            return violations
        d_num = num_match.group(1)
        target_prefix = f"D{d_num}_"

        # 2. 날짜 단서 추출 (예: 26.09.29, 26.10.01)
        date_match = re.search(r"(\d{2,4}\.\d{2}\.\d{2})", norm_rel)
        if not date_match:
            return violations
        date_str = date_match.group(1)  # e.g., '26.09.29' or '26.10.01'
        # 월.일 추출 (예: '09.29', '10.01')
        mm_dd = ".".join(date_str.split(".")[-2:])

        # 3. 원천 디렉토리(A5.outputs) 탐색 후보
        # 작업공간(99) 또는 보관함(4) 하위 탐색
        candidate_dirs = [
            os.path.join(ctx.vault_root, "99.🥸(Agent) 작업 공간"),
            os.path.join(ctx.vault_root, "4.🗄️(Archive) 보관", "에이전트 작업 공간"),
            os.path.join(ctx.vault_root, "4.🗄️(Archive) 보관"),
        ]

        matched_output_files = []
        for cdir in candidate_dirs:
            if not os.path.exists(cdir):
                continue
            # 날짜 또는 mm_dd를 포함하는 디렉토리 내의 A5.outputs 폴더 검색
            for root, dirs, _ in os.walk(cdir):
                if "A5.outputs" in dirs:
                    # 상위 경로에 mm_dd 또는 date_str가 포함되어 있는지 확인
                    if mm_dd in root or date_str in root:
                        a5_path = os.path.join(root, "A5.outputs")
                        for f in os.listdir(a5_path):
                            if f.startswith(target_prefix) and f.endswith(".md"):
                                matched_output_files.append((f, os.path.join(a5_path, f)))

        if not matched_output_files:
            # 원본 정리본 파일이 아직 생성되지 않았거나 경로가 완전히 다른 경우 경고
            return violations

        # 가장 적합한 첫 번째 원본 파일 이름 (확장자 제외)
        expected_stem = os.path.splitext(matched_output_files[0][0])[0]

        # 4. 프론트매터 링크 확인
        links = []
        if ctx.fm_data and isinstance(ctx.fm_data, dict):
            raw_links = ctx.fm_data.get("링크")
            if isinstance(raw_links, list):
                links = [str(x) for x in raw_links]
            elif raw_links:
                links = [str(raw_links)]

        # 위키링크 내부에 expected_stem이 들어있는지 확인
        # e.g., '[[D1_인스파이어드_...]]' or '[["D1_..."]]'
        found = any(expected_stem in l for l in links)

        if not found:
            violations.append(
                LintViolation(
                    rule_id=self.rule_id,
                    message=(
                        f"원 정리본 링크 누락: {date_str} 회의/공유회의 A5.outputs 원본인 "
                        f"'[[{expected_stem}]]' 링크가 프론트매터 '링크:' 에 반드시 포함되어야 합니다."
                    )
                )
            )

        return violations
