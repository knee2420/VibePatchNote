---
type: card
title: "Llm Generator"
description: "llm_generator.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/llm_generator/llm_generator.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `llm_generator.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | SuggestedQuestionsModelConfig | SuggestedQuestionsModelConfig 클래스 정의 및 추상화 | `## class SuggestedQuestionsModelConfig` |
| E2 | 규칙 | _normalize_completion_params | _normalize_completion_params 핵심 로직 및 프로시저 | `## def _normalize_completion_params` |
| E3 | 규칙 | _parse_string_list | _parse_string_list 핵심 로직 및 프로시저 | `## def _parse_string_list` |
| E4 | 아키텍처 | WorkflowServiceInterface | WorkflowServiceInterface 클래스 정의 및 추상화 | `## class WorkflowServiceInterface` |
| E5 | 아키텍처 | CodeGenerateResultDict | CodeGenerateResultDict 클래스 정의 및 추상화 | `## class CodeGenerateResultDict` |
| E6 | 아키텍처 | StructuredOutputResultDict | StructuredOutputResultDict 클래스 정의 및 추상화 | `## class StructuredOutputResultDict` |
| E7 | 아키텍처 | LLMGenerator | LLMGenerator 클래스 정의 및 추상화 | `## class LLMGenerator` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[llm_generator.py](../../../../../99.archive/dify/api/core/llm_generator/llm_generator.py)
