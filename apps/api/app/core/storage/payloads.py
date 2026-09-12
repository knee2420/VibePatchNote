"""대용량 페이로드 외부화.

## 문제

`ledger.jsonl` 이 7.1MB 까지 자랐고, 그중 **93%가 다섯 개 키**였다.

    outputs.structured_output   평균 173KB
    inputs.raw_output           평균 157KB
    outputs.raw_response        평균  31KB
    outputs.prompt / inputs.prompt   각 8KB

게다가 `structured_output` 과 `raw_output` 은 **같은 데이터**다 — 모델 출력이
LLM 스팬의 출력이자 검증 스팬의 입력으로 두 번 실렸다.

이 모듈은 **바이트 배치**만 안다. 어느 디렉터리에 쓸지는 호출부가 `run_dir` 로
넘긴다 — 저장 게이트에 있으면서도 스스로 경로를 만들지 않는다
(`60-data/rule.md` §4-4).

이것은 `.agents/rules/60-data/rule.md` §4-1 *"애그리거트는 식별자로만 참조한다"*
와 같은 문제다. 원장 한 줄이 본문 사본을 들고 있으면 원장이 본문만큼 커진다.

## 해법

본문은 내용 해시로 한 번만 저장하고, 원장에는 **포인터와 미리보기**만 남긴다.
같은 내용은 해시가 같으므로 중복이 사라진다.

    data/runs/{run_id}/
      ledger.jsonl              스팬 (포인터)
      payloads/{sha256}.txt     본문 (내용당 한 번)

조회 시 본문을 다시 끼워 넣지 않는다. 그러면 응답이 다시 7MB 가 된다.
소비자는 카드를 펼칠 때 `/runs/{id}/payloads/{ref}` 로 필요한 것만 받는다.

**기존 run 은 건드리지 않는다.** 인라인 본문을 그대로 읽을 수 있고,
소비자는 포인터와 인라인을 모두 다룰 수 있어야 한다.
"""
from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

PAYLOAD_DIR = "payloads"

#: 이 크기를 넘는 문자열만 밖으로 뺀다. 짧은 값은 포인터가 본문보다 크다.
EXTERNALIZE_OVER_BYTES = 2048

#: 원장에 남길 미리보기 길이. 카드를 펼치지 않아도 무엇인지는 알 수 있어야 한다.
PREVIEW_CHARS = 280

#: 포인터임을 알리는 표식. 계약(`Dict[str, Any]`) 안에서 구분되어야 한다.
REF_MARKER = "__payload_ref__"


def is_payload_ref(value: Any) -> bool:
    return isinstance(value, dict) and REF_MARKER in value


def make_ref(digest: str, *, byte_length: int, preview: str, media_type: str) -> dict[str, Any]:
    return {
        REF_MARKER: digest,
        "bytes": byte_length,
        "preview": preview,
        "media_type": media_type,
    }


def _sniff_media_type(text: str) -> str:
    """미리보기만으로 뷰어를 고를 수 있도록 대략의 종류를 남긴다."""
    head = text.lstrip()[:1]
    if head in "{[":
        return "application/json"
    if text.lstrip().startswith("#") or "\n## " in text:
        return "text/markdown"
    return "text/plain"


def externalize(payload: Any, run_dir: Path) -> Any:
    """페이로드 트리에서 큰 문자열을 밖으로 빼고 포인터로 바꾼다.

    구조(키·중첩·숫자)는 보존한다. 바뀌는 것은 **큰 문자열 잎**뿐이다.
    """
    if isinstance(payload, dict):
        return {key: externalize(value, run_dir) for key, value in payload.items()}
    if isinstance(payload, list):
        return [externalize(item, run_dir) for item in payload]

    # 문자열이 아니면 그대로 둔다. 구조화된 값은 원장에 있는 편이 쓸모 있다.
    if not isinstance(payload, str):
        return payload

    encoded = payload.encode("utf-8")
    if len(encoded) <= EXTERNALIZE_OVER_BYTES:
        return payload

    digest = hashlib.sha256(encoded).hexdigest()
    target = run_dir / PAYLOAD_DIR / f"{digest}.txt"
    if not target.exists():
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(payload, encoding="utf-8")
        except OSError as exc:
            # 외부화에 실패하면 인라인으로 남긴다. 기록을 잃는 것보다 낫다.
            logger.warning("[Payloads] 외부화 실패, 인라인 유지 (%s): %s", digest[:12], exc)
            return payload

    return make_ref(
        digest,
        byte_length=len(encoded),
        preview=payload[:PREVIEW_CHARS],
        media_type=_sniff_media_type(payload),
    )


def read_payload(run_dir: Path, digest: str) -> Optional[str]:
    """포인터가 가리키는 본문. 없으면 None."""
    # 해시는 파일명이 되므로 형식을 엄격히 본다. 경로 조각이 섞이면 안 된다.
    if len(digest) != 64 or not all(c in "0123456789abcdef" for c in digest):
        return None
    target = run_dir / PAYLOAD_DIR / f"{digest}.txt"
    if not target.is_file():
        return None
    try:
        return target.read_text(encoding="utf-8")
    except OSError as exc:
        logger.warning("[Payloads] 본문을 읽지 못했습니다 (%s): %s", digest[:12], exc)
        return None


def externalize_span_dict(span: dict[str, Any], run_dir: Path) -> dict[str, Any]:
    """스팬 한 건의 `inputs` / `outputs` 만 외부화한다.

    메타데이터·식별자·사용량은 작고 자주 쓰이므로 그대로 둔다.
    """
    for bucket in ("inputs", "outputs"):
        value = span.get(bucket)
        if isinstance(value, (dict, list)):
            span[bucket] = externalize(value, run_dir)
    return span


def payload_dir_size(run_dir: Path) -> int:
    directory = run_dir / PAYLOAD_DIR
    if not directory.is_dir():
        return 0
    return sum(f.stat().st_size for f in directory.glob("*.txt") if f.is_file())


def dumps_line(entry: dict[str, Any]) -> str:
    return json.dumps(entry, ensure_ascii=False)
