"""Scaffold Engine — Outline Extraction Package (V2 Cognitive Layout Decomposition).

1-Stage 멀티모달 인지 분해 기반 고정밀 문서 목차 및 컴포넌트 추출 패키지입니다.

파이프라인 라이프사이클:
    1. 전처리 (preprocess/): 실측 기하 컨텍스트 추출 및 프롬프트 조립
    2. LLM 추론 (inference/): 1-Stage 구조화 목차 인지 실행
    3. 후처리 (postprocess/): Pydantic 스키마 검증 및 OutlineDocument 표준화
    4. 품질검증 (evaluate/): 계층 트리 완성도 및 충실도 검증
"""
from .evaluate.validator import OutlineValidationReport, OutlineValidator
from .inference.agent import OutlineInferencer
from .interfaces import (
    ContextBuilder,
    OutlineInferencer as OutlineInferencerInterface,
    OutlineParser,
    OutlineValidator as OutlineValidatorInterface,
    PromptAssembler,
)
from .pipeline import OutlineExtractionStep, OutlinePipeline
from .postprocess.parser import OutlineResponseParser
from .preprocess.context_builder import DocumentContextBuilder
from .preprocess.prompt_assembler import OutlinePromptAssembler
from .schemas.models import (
    ElementItem,
    OutlineDocument,
    OutlineItem,
    OutlineNode,
    OutlineOutput,
    export_json_schema,
)

__all__ = [
    # 스키마
    "ElementItem",
    "OutlineItem",
    "OutlineNode",
    "OutlineOutput",
    "OutlineDocument",
    "export_json_schema",
    # 파이프라인
    "OutlinePipeline",
    "OutlineExtractionStep",
    # 4단계 컴포넌트
    "DocumentContextBuilder",
    "OutlinePromptAssembler",
    "OutlineInferencer",
    "OutlineResponseParser",
    "OutlineValidator",
    "OutlineValidationReport",
    # 인터페이스
    "ContextBuilder",
    "PromptAssembler",
    "OutlineInferencerInterface",
    "OutlineParser",
    "OutlineValidatorInterface",
]
