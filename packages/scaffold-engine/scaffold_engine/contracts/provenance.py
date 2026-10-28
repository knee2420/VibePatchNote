"""산출물의 출처(provenance) 계약.

LLM 산출물은 결정적 함수의 결과가 아니다. 같은 PDF 를 같은 모델로 다시 돌려도
바이트가 같지 않다. 그러므로 산출물만 남기면 "왜 이 결과가 나왔는가"를 되짚을 수
없고, 모델이나 프롬프트를 바꿨을 때 품질 변화의 원인을 특정할 수 없다.

엔진은 자기가 무엇을 썼는지만 알려준다 — 어디에 저장할지는 호스트가 정한다.
"""
from __future__ import annotations

import hashlib
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional

# 엔진 자체의 버전. 파이프라인 로직이 바뀌면 여기를 올린다.
ENGINE_VERSION = "0.1.0"


def hash_text(text: str) -> str:
    """프롬프트·스키마처럼 내용이 곧 버전인 자료의 지문."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def hash_file(path: Optional[Path]) -> Optional[str]:
    """파일 내용의 지문. 없으면 None."""
    if path is None or not Path(path).exists():
        return None
    return hash_text(Path(path).read_text(encoding="utf-8"))


@dataclass(frozen=True)
class EngineProvenance:
    """산출물 한 건을 만든 조건."""

    engine_version: str = ENGINE_VERSION
    pipeline: str = ""
    model: str = ""
    effort: Optional[str] = None
    prompt_hash: Optional[str] = None
    schema_hash: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
