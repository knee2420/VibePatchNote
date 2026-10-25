# -*- coding: utf-8 -*-
"""
Layer 2: Outline Node Integrity & Tree Structure Rules
개별 노드 무결성, ID 고유성, 재귀 트리 구조 검증
"""

import re
from typing import Any
from .base import BaseOutlineRule, OutlineLintContext, OutlineViolation

ALLOWED_NODE_TYPES = {
    "bullet",
    "h1",
    "h2",
    "h3",
    "todo",
    "code",
    "quote",
    "paragraph",
    "divider",
}


def traverse_nodes(nodes: list[Any], path_ids: set[str], seen_ids: dict[str, int], violations: list[OutlineViolation]):
    """노드 트리를 재귀적으로 순회하며 구조 결함을 수집합니다."""
    for idx, node in enumerate(nodes):
        if not isinstance(node, dict):
            violations.append(OutlineViolation("OUT-NODE-000", f"노드가 딕셔너리(객체) 형식이 아닙니다 (인덱스 {idx})."))
            continue

        node_id = node.get("id")
        node_text = node.get("text", "")

        # 1. 필수 키 검사 (id, text, children)
        if not node_id or not isinstance(node_id, str):
            violations.append(OutlineViolation("OUT-NODE-001", "노드에 유효한 'id' 문자열이 누락되었습니다.", node_text=str(node_text)))
        else:
            # 2. ID 고유성 검사
            seen_ids[node_id] = seen_ids.get(node_id, 0) + 1
            if seen_ids[node_id] > 1:
                violations.append(OutlineViolation("OUT-NODE-002", f"노드 ID 중복이 발견되었습니다: '{node_id}'", node_id=node_id, node_text=str(node_text)))

            # 3. 순환 참조(Cycle) 검사
            if node_id in path_ids:
                violations.append(OutlineViolation("OUT-NODE-004", f"노드 트리 순환 참조(Cycle)가 감지되었습니다: '{node_id}'", node_id=node_id, node_text=str(node_text)))
                continue  # 무한 재귀 방지

        if "text" not in node or not isinstance(node.get("text"), str):
            violations.append(OutlineViolation("OUT-NODE-001", "노드에 'text' 문자열 필드가 누락되었거나 타입이 올바르지 않습니다.", node_id=node_id))

        if "children" not in node:
            violations.append(OutlineViolation("OUT-NODE-001", "노드에 'children' 필드가 누락되었습니다.", node_id=node_id, node_text=str(node_text)))
        elif not isinstance(node.get("children"), list):
            violations.append(OutlineViolation("OUT-NODE-003", f"'children' 필드는 리스트(배열)여야 합니다 (현재 타입: {type(node.get('children')).__name__}).", node_id=node_id, node_text=str(node_text)))

        # 4. nodeType 허용 목록 검사
        node_type = node.get("nodeType")
        if node_type is not None and node_type not in ALLOWED_NODE_TYPES:
            violations.append(OutlineViolation("OUT-NODE-005", f"지원되지 않는 nodeType입니다: '{node_type}' (허용 값: {sorted(ALLOWED_NODE_TYPES)})", node_id=node_id, node_text=str(node_text)))

        # 5. 딸린 파일(file) 스키마 검사
        file_obj = node.get("file")
        if file_obj is not None:
            if not isinstance(file_obj, dict):
                violations.append(OutlineViolation("OUT-NODE-006", "'file' 필드는 객체여야 합니다.", node_id=node_id, node_text=str(node_text)))
            else:
                target = file_obj.get("target")
                if not target or not isinstance(target, str):
                    violations.append(OutlineViolation("OUT-NODE-006", "딸린 파일(file) 객체에 'target' 파일 경로 문자열이 누락되었습니다.", node_id=node_id, node_text=str(node_text)))

        # 6. 인라인 이미지 임베드(![[...]]) 검출 및 'file' 속성 분리 권장 검사
        if isinstance(node_text, str) and re.search(r"!\[\[.*?\]\]", node_text):
            violations.append(
                OutlineViolation(
                    "OUT-NODE-007",
                    "노드 'text'에 인라인 마크다운 이미지(![[...]])가 감지되었습니다. '딸린 파일 표시(제목만/작게/크게)' 설정이 적용되도록 'file: { target: ... }' 첨부 속성으로 분리하는 것을 권장합니다 (--fix 지원).",
                    node_id=node_id,
                    node_text=str(node_text),
                )
            )

        # 자식 노드 재귀 탐색
        children = node.get("children")
        if isinstance(children, list) and node_id:
            next_path = path_ids | {node_id}
            traverse_nodes(children, next_path, seen_ids, violations)


class RuleNodeTreeIntegrity(BaseOutlineRule):
    rule_id = "OUT-NODE-001"
    description = "노드 필수 필드, 고유성, 재귀 트리 무결성을 검증합니다."

    def check(self, ctx: OutlineLintContext) -> list[OutlineViolation]:
        if not ctx.json_data or not isinstance(ctx.json_data.get("rootNodes"), list):
            return []

        violations: list[OutlineViolation] = []
        seen_ids: dict[str, int] = {}
        traverse_nodes(ctx.json_data["rootNodes"], set(), seen_ids, violations)

        ctx.all_node_ids = set(seen_ids.keys())
        return violations


LAYER2_RULES: list[BaseOutlineRule] = [
    RuleNodeTreeIntegrity(),
]
