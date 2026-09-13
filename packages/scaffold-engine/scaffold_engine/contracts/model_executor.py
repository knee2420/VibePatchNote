"""엔진 파이프라인이 의존하는 모델 실행 계약.

비즈니스 로직은 특정 LLM 제공자에 종속되지 않고 이 Protocol에만 의존합니다.
새 executor를 주입할 수 있으며, 패키지는 앱의 provider 구현을 알 필요가 없습니다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, Protocol, Union


class ModelExecutor(Protocol):
    model: str

    def run_structured(
        self,
        prompt: str,
        *,
        schema_path: Optional[Union[str, Path]] = None,
        json_schema: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
        file_path: Optional[Union[str, Path]] = None,
        **kwargs: Any,
    ) -> Any:
        ...
