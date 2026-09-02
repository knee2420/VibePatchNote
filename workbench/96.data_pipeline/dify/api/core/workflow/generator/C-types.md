---
type: card
title: "Types"
description: "types.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/workflow/generator/types.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `types.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | WorkflowGenerateErrorCode | WorkflowGenerateErrorCode 클래스 정의 및 추상화 | `## class WorkflowGenerateErrorCode` |
| E2 | 아키텍처 | WorkflowGenerateErrorDict | WorkflowGenerateErrorDict 클래스 정의 및 추상화 | `## class WorkflowGenerateErrorDict` |
| E3 | 아키텍처 | PlannerNodeDict | PlannerNodeDict 클래스 정의 및 추상화 | `## class PlannerNodeDict` |
| E4 | 아키텍처 | PlannerEdgeDict | PlannerEdgeDict 클래스 정의 및 추상화 | `## class PlannerEdgeDict` |
| E5 | 아키텍처 | PlannerStartInputDict | PlannerStartInputDict 클래스 정의 및 추상화 | `## class PlannerStartInputDict` |
| E6 | 아키텍처 | PlannerResultDict | PlannerResultDict 클래스 정의 및 추상화 | `## class PlannerResultDict` |
| E7 | 아키텍처 | GraphNodePositionDict | GraphNodePositionDict 클래스 정의 및 추상화 | `## class GraphNodePositionDict` |
| E8 | 아키텍처 | GraphNodeDict | GraphNodeDict 클래스 정의 및 추상화 | `## class GraphNodeDict` |
| E9 | 아키텍처 | GraphEdgeDict | GraphEdgeDict 클래스 정의 및 추상화 | `## class GraphEdgeDict` |
| E10 | 아키텍처 | GraphViewportDict | GraphViewportDict 클래스 정의 및 추상화 | `## class GraphViewportDict` |
| E11 | 아키텍처 | GraphDict | GraphDict 클래스 정의 및 추상화 | `## class GraphDict` |
| E12 | 아키텍처 | WorkflowGenerateResultDict | WorkflowGenerateResultDict 클래스 정의 및 추상화 | `## class WorkflowGenerateResultDict` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[types.py](../../../../../../99.archive/dify/api/core/workflow/generator/types.py)
