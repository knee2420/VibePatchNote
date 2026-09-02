---
type: card
title: "Structured Output"
description: "structured_output.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/llm_generator/output_parser/structured_output.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `structured_output.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ResponseFormat | ResponseFormat 클래스 정의 및 추상화 | `## class ResponseFormat` |
| E2 | 아키텍처 | SpecialModelType | SpecialModelType 클래스 정의 및 추상화 | `## class SpecialModelType` |
| E3 | 규칙 | invoke_llm_with_structured_output | invoke_llm_with_structured_output 핵심 로직 및 프로시저 | `## def invoke_llm_with_structured_output` |
| E4 | 규칙 | invoke_llm_with_structured_output | invoke_llm_with_structured_output 핵심 로직 및 프로시저 | `## def invoke_llm_with_structured_output` |
| E5 | 규칙 | invoke_llm_with_structured_output | invoke_llm_with_structured_output 핵심 로직 및 프로시저 | `## def invoke_llm_with_structured_output` |
| E6 | 규칙 | invoke_llm_with_structured_output | invoke_llm_with_structured_output 핵심 로직 및 프로시저 | `## def invoke_llm_with_structured_output` |
| E7 | 규칙 | _handle_native_json_schema | _handle_native_json_schema 핵심 로직 및 프로시저 | `## def _handle_native_json_schema` |
| E8 | 규칙 | _set_response_format | _set_response_format 핵심 로직 및 프로시저 | `## def _set_response_format` |
| E9 | 규칙 | _handle_prompt_based_schema | _handle_prompt_based_schema 핵심 로직 및 프로시저 | `## def _handle_prompt_based_schema` |
| E10 | 규칙 | _parse_structured_output | _parse_structured_output 핵심 로직 및 프로시저 | `## def _parse_structured_output` |
| E11 | 규칙 | _prepare_schema_for_model | _prepare_schema_for_model 핵심 로직 및 프로시저 | `## def _prepare_schema_for_model` |
| E12 | 규칙 | remove_additional_properties | remove_additional_properties 핵심 로직 및 프로시저 | `## def remove_additional_properties` |
| E13 | 규칙 | convert_boolean_to_string | convert_boolean_to_string 핵심 로직 및 프로시저 | `## def convert_boolean_to_string` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[structured_output.py](../../../../../../99.archive/dify/api/core/llm_generator/output_parser/structured_output.py)
