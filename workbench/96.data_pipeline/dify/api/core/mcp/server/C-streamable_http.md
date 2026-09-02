---
type: card
title: "Streamable Http"
description: "streamable_http.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/mcp/server/streamable_http.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `streamable_http.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | _supports_structured_output | _supports_structured_output 핵심 로직 및 프로시저 | `## def _supports_structured_output` |
| E2 | 규칙 | negotiate_protocol_version | negotiate_protocol_version 핵심 로직 및 프로시저 | `## def negotiate_protocol_version` |
| E3 | 아키텍처 | ToolParameterSchemaDict | ToolParameterSchemaDict 클래스 정의 및 추상화 | `## class ToolParameterSchemaDict` |
| E4 | 아키텍처 | ToolArgumentsDict | ToolArgumentsDict 클래스 정의 및 추상화 | `## class ToolArgumentsDict` |
| E5 | 규칙 | handle_mcp_request | handle_mcp_request 핵심 로직 및 프로시저 | `## def handle_mcp_request` |
| E6 | 규칙 | handle_ping | handle_ping 핵심 로직 및 프로시저 | `## def handle_ping` |
| E7 | 규칙 | handle_initialize | handle_initialize 핵심 로직 및 프로시저 | `## def handle_initialize` |
| E8 | 규칙 | handle_list_tools | handle_list_tools 핵심 로직 및 프로시저 | `## def handle_list_tools` |
| E9 | 규칙 | handle_call_tool | handle_call_tool 핵심 로직 및 프로시저 | `## def handle_call_tool` |
| E10 | 규칙 | build_parameter_schema | build_parameter_schema 핵심 로직 및 프로시저 | `## def build_parameter_schema` |
| E11 | 규칙 | prepare_tool_arguments | prepare_tool_arguments 핵심 로직 및 프로시저 | `## def prepare_tool_arguments` |
| E12 | 규칙 | extract_structured_output | extract_structured_output 핵심 로직 및 프로시저 | `## def extract_structured_output` |
| E13 | 규칙 | extract_answer_from_response | extract_answer_from_response 핵심 로직 및 프로시저 | `## def extract_answer_from_response` |
| E14 | 규칙 | process_streaming_response | process_streaming_response 핵심 로직 및 프로시저 | `## def process_streaming_response` |
| E15 | 규칙 | process_mapping_response | process_mapping_response 핵심 로직 및 프로시저 | `## def process_mapping_response` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[streamable_http.py](../../../../../../99.archive/dify/api/core/mcp/server/streamable_http.py)
