"""Stage B 출력 계약.

**이 스키마에는 좌표·크기·비율 필드가 존재하지 않는다.** 그것이 이 엔진의
핵심 안전장치다. 모델은 이미 실측된 블록 id 를 고르고 역할만 판정할 수 있을 뿐,
기하 정보를 지어낼 수단이 없다. 좌표는 전적으로 `extract/geometry.py` 가 소유한다.
"""
from __future__ import annotations

from typing import Any, Dict

# role 의미
#   title      : 문서 전체 제목
#   label      : 서식에 늘 인쇄된 항목명/머리글
#   value      : 블록 전체가 인스턴스 데이터 (슬롯이 됨)
#   mixed      : 한 블록에 고정 라벨과 데이터가 함께 있음 (일부만 슬롯)
#   decoration : 페이지 번호·상용구 등 서식과 무관한 장식
ROLES = ("title", "label", "value", "mixed", "decoration")

# 슬롯을 만들어내는 역할
SLOT_ROLES = frozenset({"value", "mixed"})

BLOCK_CLASSIFICATION_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "properties": {
        "doc_title": {"type": "string"},
        "blocks": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "role": {"type": "string", "enum": list(ROLES)},
                    "value_text": {"type": "string"},
                    "slot_label": {"type": "string"},
                },
                "required": ["id", "role", "value_text", "slot_label"],
            },
        },
    },
    "required": ["doc_title", "blocks"],
}

# 모델이 스키마를 무시하고 배열만 뱉을 때 재시도에 덧붙이는 힌트
SHAPE_REMINDER = (
    "\n\n[출력 형식 엄수] 최상위는 반드시 JSON 객체여야 하며 "
    '{"doc_title": "...", "blocks": [{"id","role","value_text","slot_label"}, ...]} '
    "형태입니다. 배열만 단독으로 반환하거나 코드블록으로 감싸지 마세요."
)
