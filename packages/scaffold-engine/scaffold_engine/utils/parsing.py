"""Scaffold Engine — JSON 및 마크다운 페이로드 파싱 독립 유틸리티.

외부 LLM 드라이버에 의존하지 않고 자체적으로 마크다운 코드펜스 및 불완전 JSON을 안전하게 회수합니다.
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

_PAYLOAD_KEYS = ("response", "result", "output", "text", "content", "data")
_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.S)


def _strip_fence(raw: str) -> str:
    m = _FENCE.search(raw)
    return m.group(1).strip() if m else raw


def _normalize(obj: Any, list_key: str) -> Optional[Dict[str, Any]]:
    """객체/배열/래퍼를 `{list_key: [...]}` 표준형으로 되돌린다."""
    if isinstance(obj, list):
        if obj and isinstance(obj[0], dict) and "id" in obj[0]:
            return {list_key: obj}
        return None
    if not isinstance(obj, dict):
        return None
    if isinstance(obj.get(list_key), list):
        return obj
    for key in _PAYLOAD_KEYS:
        value = obj.get(key)
        if isinstance(value, (dict, list)):
            found = _normalize(value, list_key)
            if found:
                return found
        elif isinstance(value, str):
            found = parse_json_payload(value, list_key)
            if found:
                return found
    return None


def parse_json_payload(raw: str, list_key: str = "blocks") -> Optional[Dict[str, Any]]:
    """원시 출력에서 `{list_key: [...]}` 형태를 회수한다. 실패 시 None."""
    if not raw or not raw.strip():
        return None
    for candidate in (raw.strip(), _strip_fence(raw).strip()):
        try:
            found = _normalize(json.loads(candidate), list_key)
            if found:
                return found
        except json.JSONDecodeError:
            pass
        for opener, closer in (("{", "}"), ("[", "]")):
            start, end = candidate.find(opener), candidate.rfind(closer)
            if start == -1 or end <= start:
                continue
            try:
                found = _normalize(json.loads(candidate[start:end + 1]), list_key)
                if found:
                    return found
            except json.JSONDecodeError:
                pass
    return None


def unknown_ids(payload: Dict[str, Any], allowed: List[str], list_key: str = "blocks") -> List[str]:
    """모델이 지어낸 id 목록. 비어 있어야 정상이다."""
    allowed_set = set(allowed)
    return [
        str(item.get("id"))
        for item in payload.get(list_key, [])
        if isinstance(item, dict) and item.get("id") not in allowed_set
    ]
