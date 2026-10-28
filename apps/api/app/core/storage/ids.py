"""저장소 식별자 발급과 경로 세그먼트 검증.

식별자는 **대리키(surrogate key)** 다. 파일명·제목처럼 사용자가 바꿀 수 있는 값을
경로의 키로 쓰면, 이름을 바꾼 순간 다른 문서가 되고 되돌릴 방법이 없다.

발급 형식은 ULID 와 같은 사상이다 — 앞자리에 밀리초 타임스탬프를 고정 폭으로 두어
사전순 정렬이 곧 생성순 정렬이 되게 하고, 뒤에 난수를 붙여 충돌을 막는다.
외부 의존성 없이 같은 성질만 얻는다.
"""
from __future__ import annotations

import re
import time
import uuid

# 경로 세그먼트로 허용하는 문자. 구분자·상위 이동·예약 문자를 모두 배제한다.
_SAFE_SEGMENT = re.compile(r"^[A-Za-z0-9_.\-]{1,128}$")

DOCUMENT_PREFIX = "doc"
ARTIFACT_PREFIX = "art"
RUN_PREFIX = "run"
AGREEMENT_PREFIX = "agr"


def new_id(prefix: str) -> str:
    """시간순으로 정렬되는 대리키를 발급한다."""
    milliseconds = int(time.time() * 1000)
    return f"{prefix}-{milliseconds:011x}-{uuid.uuid4().hex[:8]}"


def is_safe_segment(value: str) -> bool:
    """경로 한 조각으로 그대로 써도 되는 값인지 판정한다.

    `.` 과 `..` 은 허용 문자만으로 이루어져 있지만 경로에서는 상위 이동이다.
    문자 집합만 보면 통과하므로 따로 걸러 낸다.
    """
    if value in {".", ".."}:
        return False
    return bool(_SAFE_SEGMENT.match(value))


def safe_segment(value: str) -> str:
    """경로 조각으로 쓸 수 없는 값이면 거부한다.

    조용히 치환하지 않는다. 치환은 서로 다른 두 식별자를 같은 디렉터리로 합쳐
    데이터를 덮어쓸 수 있다.
    """
    candidate = (value or "").strip()
    if not is_safe_segment(candidate):
        raise ValueError(f"Unsafe path segment: {value!r}")
    return candidate
