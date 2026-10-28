"""Stage B 출력 계약 (Wireframe 트랙).

이 스키마에는 좌표·크기·비율 필드가 존재하지 않는다.
모델은 이미 실측된 블록 id 를 고르고 역할만 판정할 수 있을 뿐 기하 정보를 지어낼 수 없다.
좌표는 전적으로 `wireframe/extract/geometry.py` 가 소유한다.
"""
from __future__ import annotations

from typing import Any, Dict

ROLES = ("title", "label", "value", "mixed", "decoration", "ignore")
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

SHAPE_REMINDER = (
    "\n\n[출력 형식 엄수] 최상위는 반드시 JSON 객체여야 하며 "
    '{"doc_title": "...", "blocks": [{"id","role","value_text","slot_label"}, ...]} '
    "형태입니다. 배열만 단독으로 반환하거나 코드블록으로 감싸지 마세요."
)
