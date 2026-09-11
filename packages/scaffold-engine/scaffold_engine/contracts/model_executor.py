"""엔진 파이프라인이 의존하는 모델 실행 계약.

`BaseLlmHarness`는 이 구조 계약을 충족한다. 따라서 기존 호스트를 깨지 않고도
새 executor를 주입할 수 있으며, 패키지는 앱의 provider 구현을 알 필요가 없다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, Protocol, Union

from scaffold_engine.harness.base import LlmExecutionResult


class ModelExecutor(Protocol):
    model: str

    def run_structured(self, prompt: str, *, schema_path: Optional[Union[str, Path]] = None, json_schema: Optional[Dict[str, Any]] = None, model: Optional[str] = None, effort: Optional[str] = None, conversation_id: Optional[str] = None, timeout: Optional[int] = None, file_path: Optional[Union[str, Path]] = None, **kwargs: Any) -> LlmExecutionResult: ...
