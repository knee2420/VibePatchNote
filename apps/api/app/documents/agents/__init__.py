"""documents 도메인의 Agent 계층.

LLM 이 개입하는 Agent 경로들을 정의한다.
Agent Runtime 을 통과하며, 산출물은 data/ 에 provenance 와 함께 아티팩트로 커밋한다.
"""
from .extract_outline import ExtractOutlineUseCase
from .generate_scaffold import GenerateScaffoldUseCase

__all__ = [
    "ExtractOutlineUseCase",
    "GenerateScaffoldUseCase",
]
