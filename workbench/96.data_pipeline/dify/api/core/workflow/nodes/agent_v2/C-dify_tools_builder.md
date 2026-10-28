---
type: card
title: "Dify Tools Builder"
description: "dify_tools_builder.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/agent_v2/dify_tools_builder.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `dify_tools_builder.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | WorkflowAgentDifyToolsBuildError | WorkflowAgentDifyToolsBuildError 클래스 정의 및 추상화 | `## class WorkflowAgentDifyToolsBuildError` |
| E2 | 아키텍처 | AgentToolRuntimeProvider | AgentToolRuntimeProvider 클래스 정의 및 추상화 | `## class AgentToolRuntimeProvider` |
| E3 | 아키텍처 | ProviderToolsLister | ProviderToolsLister 클래스 정의 및 추상화 | `## class ProviderToolsLister` |
| E4 | 아키텍처 | MCPProviderIDResolver | MCPProviderIDResolver 클래스 정의 및 추상화 | `## class MCPProviderIDResolver` |
| E5 | 아키텍처 | WorkflowAgentToolLayers | WorkflowAgentToolLayers 클래스 정의 및 추상화 | `## class WorkflowAgentToolLayers` |
| E6 | 아키텍처 | WorkflowAgentDifyToolLayersBuilder | WorkflowAgentDifyToolLayersBuilder 클래스 정의 및 추상화 | `## class WorkflowAgentDifyToolLayersBuilder` |
| E7 | 규칙 | _list_provider_tool_names | _list_provider_tool_names 핵심 로직 및 프로시저 | `## def _list_provider_tool_names` |
| E8 | 규칙 | _resolve_mcp_provider_id | _resolve_mcp_provider_id 핵심 로직 및 프로시저 | `## def _resolve_mcp_provider_id` |
| E9 | 아키텍처 | WorkflowAgentDifyToolsBuilder | WorkflowAgentDifyToolsBuilder 클래스 정의 및 추상화 | `## class WorkflowAgentDifyToolsBuilder` |
| E10 | 규칙 | _is_plugin_provider_id | _is_plugin_provider_id 핵심 로직 및 프로시저 | `## def _is_plugin_provider_id` |
| E11 | 규칙 | _plugin_file_input_schema | _plugin_file_input_schema 핵심 로직 및 프로시저 | `## def _plugin_file_input_schema` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[dify_tools_builder.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/agent_v2/dify_tools_builder.py)
