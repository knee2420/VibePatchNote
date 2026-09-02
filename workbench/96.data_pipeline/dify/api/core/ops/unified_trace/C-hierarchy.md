---
type: card
title: "Hierarchy"
description: "hierarchy.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/ops/unified_trace/hierarchy.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `hierarchy.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | _read_attribute | _read_attribute 핵심 로직 및 프로시저 | `## def _read_attribute` |
| E2 | 아키텍처 | WrapperKey | WrapperKey 클래스 정의 및 추상화 | `## class WrapperKey` |
| E3 | 아키텍처 | WrapperSpec | WrapperSpec 클래스 정의 및 추상화 | `## class WrapperSpec` |
| E4 | 아키텍처 | WorkflowHierarchy | WorkflowHierarchy 클래스 정의 및 추상화 | `## class WorkflowHierarchy` |
| E5 | 규칙 | execution_id | execution_id 핵심 로직 및 프로시저 | `## def execution_id` |
| E6 | 규칙 | execution_metadata | execution_metadata 핵심 로직 및 프로시저 | `## def execution_metadata` |
| E7 | 규칙 | _unique_execution_by_node_id | _unique_execution_by_node_id 핵심 로직 및 프로시저 | `## def _unique_execution_by_node_id` |
| E8 | 규칙 | _metadata_or_attr | _metadata_or_attr 핵심 로직 및 프로시저 | `## def _metadata_or_attr` |
| E9 | 규칙 | _normalize_index | _normalize_index 핵심 로직 및 프로시저 | `## def _normalize_index` |
| E10 | 규칙 | _finished_at | _finished_at 핵심 로직 및 프로시저 | `## def _finished_at` |
| E11 | 규칙 | _failed | _failed 핵심 로직 및 프로시저 | `## def _failed` |
| E12 | 규칙 | _remove_cycles | _remove_cycles 핵심 로직 및 프로시저 | `## def _remove_cycles` |
| E13 | 규칙 | build_workflow_hierarchy | build_workflow_hierarchy 핵심 로직 및 프로시저 | `## def build_workflow_hierarchy` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[hierarchy.py](../../../../../../99.archive/dify/api/core/ops/unified_trace/hierarchy.py)
