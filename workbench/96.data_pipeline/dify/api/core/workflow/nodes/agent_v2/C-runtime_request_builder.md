---
type: card
title: "Runtime Request Builder"
description: "runtime_request_builder.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/agent_v2/runtime_request_builder.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `runtime_request_builder.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | WorkflowAgentRuntimeRequestBuildError | WorkflowAgentRuntimeRequestBuildError 클래스 정의 및 추상화 | `## class WorkflowAgentRuntimeRequestBuildError` |
| E2 | 아키텍처 | VariablePoolReader | VariablePoolReader 클래스 정의 및 추상화 | `## class VariablePoolReader` |
| E3 | 아키텍처 | WorkflowAgentRuntimeBuildContext | WorkflowAgentRuntimeBuildContext 클래스 정의 및 추상화 | `## class WorkflowAgentRuntimeBuildContext` |
| E4 | 아키텍처 | WorkflowAgentRuntimeRequest | WorkflowAgentRuntimeRequest 클래스 정의 및 추상화 | `## class WorkflowAgentRuntimeRequest` |
| E5 | 아키텍처 | WorkflowAgentRuntimeRequestBuilder | WorkflowAgentRuntimeRequestBuilder 클래스 정의 및 추상화 | `## class WorkflowAgentRuntimeRequestBuilder` |
| E6 | 규칙 | build_shell_layer_config | build_shell_layer_config 핵심 로직 및 프로시저 | `## def build_shell_layer_config` |
| E7 | 규칙 | build_knowledge_layer_config | build_knowledge_layer_config 핵심 로직 및 프로시저 | `## def build_knowledge_layer_config` |
| E8 | 규칙 | _knowledge_retrieval_config | _knowledge_retrieval_config 핵심 로직 및 프로시저 | `## def _knowledge_retrieval_config` |
| E9 | 규칙 | _knowledge_metadata_filtering_config | _knowledge_metadata_filtering_config 핵심 로직 및 프로시저 | `## def _knowledge_metadata_filtering_config` |
| E10 | 규칙 | _knowledge_model_config | _knowledge_model_config 핵심 로직 및 프로시저 | `## def _knowledge_model_config` |
| E11 | 규칙 | build_ask_human_layer_config | build_ask_human_layer_config 핵심 로직 및 프로시저 | `## def build_ask_human_layer_config` |
| E12 | 규칙 | append_runtime_warnings | append_runtime_warnings 핵심 로직 및 프로시저 | `## def append_runtime_warnings` |
| E13 | 규칙 | build_config_aware_soul_mention_resolver | build_config_aware_soul_mention_resolver 핵심 로직 및 프로시저 | `## def build_config_aware_soul_mention_resolver` |
| E14 | 규칙 | load_runtime_agent_skill_configs | load_runtime_agent_skill_configs 핵심 로직 및 프로시저 | `## def load_runtime_agent_skill_configs` |
| E15 | 규칙 | build_config_layer_config | build_config_layer_config 핵심 로직 및 프로시저 | `## def build_config_layer_config` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[runtime_request_builder.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/agent_v2/runtime_request_builder.py)
