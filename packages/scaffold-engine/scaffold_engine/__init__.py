"""Scaffold Engine — 호스트 비의존 문서 스캐폴딩 및 구조 분석 복합 엔진.

멀티 파이프라인 아키텍처:
- `wireframe`: PDF 기하 실측 기반 Tiptap 서식 및 슬롯 조립 파이프라인 (`ScaffoldPipeline`)
- `outline`: 1-Stage 멀티모달 인지 분해 기반 계층 목차 및 컴포넌트 추출 파이프라인 (`OutlinePipeline`)
"""
from .contracts import ModelExecutor
from .json_runner import JsonPromptRunner
from .outline import (
    ElementItem,
    OutlineDocument,
    OutlineNode,
    OutlinePipeline,
)
from .wireframe import (
    ScaffoldExtractResult,
    ScaffoldMeta,
    ScaffoldPipeline,
    ScannedDocumentError,
    SlotMappingItem,
)

__all__ = [
    # Wireframe 트랙
    "ScaffoldPipeline",
    "ScannedDocumentError",
    "ScaffoldExtractResult",
    "ScaffoldMeta",
    "SlotMappingItem",
    # Outline 트랙
    "ElementItem",
    "OutlineNode",
    "OutlineDocument",
    "OutlinePipeline",
    # 공통 계약
    "ModelExecutor",
    "JsonPromptRunner",
]
