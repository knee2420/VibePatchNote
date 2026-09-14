"""`TargetNamePort` 의 구현. 문서 저장소에 이름을 물어본다.

예전에는 inspector 가 `knowledge/documents/{doc_id}/meta.json` 을 직접 읽었다.
import 가 없으니 계약 위반으로 보이지 않았지만, **디스크 레이아웃에 결합된
것은 마찬가지**였다. documents 가 저장 형식을 바꾸면 관측 콘솔의 이름이 조용히
식별자로 되돌아간다.

이 어댑터는 주입받은 저장소에 `get(doc_id)` 만 묻는다. 어느 도메인의 무엇인지는
컨테이너가 정한다.
"""
from __future__ import annotations

import logging
from typing import Any, Optional, Protocol

logger = logging.getLogger(__name__)


class _MetaSource(Protocol):
    def get(self, doc_id: str) -> Any | None: ...


class DocumentTargetNameAdapter:
    """문서 식별자를 사람이 읽는 원본 파일명으로 옮긴다."""

    def __init__(self, source: _MetaSource) -> None:
        self._source = source

    def display_name(self, target_id: str) -> Optional[str]:
        if not target_id:
            return None
        try:
            meta = self._source.get(target_id)
        except Exception as exc:  # 조회 실패가 관측 화면을 깨뜨리지는 않는다.
            logger.info("[Inspector] 대상 이름을 찾지 못했습니다 (%s): %s", target_id, exc)
            return None
        if meta is None:
            return None
        return getattr(meta, "original_name", None) or getattr(meta, "stored_name", None)
