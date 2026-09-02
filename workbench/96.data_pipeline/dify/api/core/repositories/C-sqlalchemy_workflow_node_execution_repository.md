---
type: card
title: "Sqlalchemy Workflow Node Execution Repository"
description: "sqlalchemy_workflow_node_execution_repository.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/repositories/sqlalchemy_workflow_node_execution_repository.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `sqlalchemy_workflow_node_execution_repository.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | _InputsOutputsTruncationResult | _InputsOutputsTruncationResult 클래스 정의 및 추상화 | `## class _InputsOutputsTruncationResult` |
| E2 | 아키텍처 | SQLAlchemyWorkflowNodeExecutionRepository | SQLAlchemyWorkflowNodeExecutionRepository 클래스 정의 및 추상화 | `## class SQLAlchemyWorkflowNodeExecutionRepository` |
| E3 | 규칙 | _deterministic_json_dump | _deterministic_json_dump 핵심 로직 및 프로시저 | `## def _deterministic_json_dump` |
| E4 | 규칙 | _find_first | _find_first 핵심 로직 및 프로시저 | `## def _find_first` |
| E5 | 규칙 | _filter_by_offload_type | _filter_by_offload_type 핵심 로직 및 프로시저 | `## def _filter_by_offload_type` |
| E6 | 규칙 | _replace_or_append_offload | _replace_or_append_offload 핵심 로직 및 프로시저 | `## def _replace_or_append_offload` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[sqlalchemy_workflow_node_execution_repository.py](../../../../../99.archive/dify/api/core/repositories/sqlalchemy_workflow_node_execution_repository.py)
