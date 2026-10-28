---
type: card
title: "Node Factory"
description: "node_factory.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/workflow/node_factory.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `node_factory.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | DifyGraphInitContext | DifyGraphInitContext 클래스 정의 및 추상화 | `## class DifyGraphInitContext` |
| E2 | 규칙 | _import_node_package | _import_node_package 핵심 로직 및 프로시저 | `## def _import_node_package` |
| E3 | 규칙 | register_nodes | register_nodes 핵심 로직 및 프로시저 | `## def register_nodes` |
| E4 | 규칙 | get_node_type_classes_mapping | get_node_type_classes_mapping 핵심 로직 및 프로시저 | `## def get_node_type_classes_mapping` |
| E5 | 규칙 | resolve_workflow_node_class | resolve_workflow_node_class 핵심 로직 및 프로시저 | `## def resolve_workflow_node_class` |
| E6 | 규칙 | is_start_node_type | is_start_node_type 핵심 로직 및 프로시저 | `## def is_start_node_type` |
| E7 | 규칙 | get_default_root_node_id | get_default_root_node_id 핵심 로직 및 프로시저 | `## def get_default_root_node_id` |
| E8 | 아키텍처 | _LazyNodeTypeClassesMapping | _LazyNodeTypeClassesMapping 클래스 정의 및 추상화 | `## class _LazyNodeTypeClassesMapping` |
| E9 | 규칙 | fetch_memory | fetch_memory 핵심 로직 및 프로시저 | `## def fetch_memory` |
| E10 | 아키텍처 | DefaultWorkflowCodeExecutor | DefaultWorkflowCodeExecutor 클래스 정의 및 추상화 | `## class DefaultWorkflowCodeExecutor` |
| E11 | 아키텍처 | DifyNodeFactory | DifyNodeFactory 클래스 정의 및 추상화 | `## class DifyNodeFactory` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[node_factory.py](../../../../../99.archive/dify/api/core/workflow/node_factory.py)
