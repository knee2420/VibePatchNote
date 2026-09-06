"""엔진 부품 계약 (SSOT).

dify 의 `ModelManager` 사상을 따른다 — 비즈니스 로직(파이프라인)은 특정 벤더
(agy-cli, OpenAI, ...)에 종속되지 않고 오직 이 프로토콜에만 의존한다.
새 하네스를 붙이려면 `LlmHarness` 를 구현해 파이프라인에 주입하면 된다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol, runtime_checkable


@runtime_checkable
class LlmHarness(Protocol):
    """LLM 호출 추상화. 구현체는 `harness/` 아래에 둔다."""

    name: str

    def run_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        retries: int = 2,
        retry_hint: str = "",
    ) -> Optional[Dict[str, Any]]:
        """프롬프트를 실행하고 JSON 객체를 돌려준다. 실패 시 None."""
        ...


@runtime_checkable
class GeometryExtractor(Protocol):
    """문서 -> 결정적 기하 측정. AI 를 쓰지 않는다."""

    def extract(self, path: Path) -> List[Any]:
        ...


@runtime_checkable
class BlockClassifier(Protocol):
    """측정된 블록 -> 역할 판정. 좌표를 생성해서는 안 된다."""

    def classify(self, source_name: str, page: Any) -> Optional[Dict[str, Any]]:
        ...


@runtime_checkable
class Assembler(Protocol):
    """측정 기하 + 판정 -> 산출물(HTML/Markdown/슬롯)."""

    def assemble(self, path: Path, page: Any, decisions: Dict[str, Any]) -> Any:
        ...
