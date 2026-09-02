---
type: card
title: "Trace Entity"
description: "trace_entity.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/ops/entities/trace_entity.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `trace_entity.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | BaseTraceInfo | BaseTraceInfo 클래스 정의 및 추상화 | `## class BaseTraceInfo` |
| E2 | 아키텍처 | WorkflowTraceInfo | WorkflowTraceInfo 클래스 정의 및 추상화 | `## class WorkflowTraceInfo` |
| E3 | 아키텍처 | MessageTraceInfo | MessageTraceInfo 클래스 정의 및 추상화 | `## class MessageTraceInfo` |
| E4 | 아키텍처 | ModerationTraceInfo | ModerationTraceInfo 클래스 정의 및 추상화 | `## class ModerationTraceInfo` |
| E5 | 아키텍처 | SuggestedQuestionTraceInfo | SuggestedQuestionTraceInfo 클래스 정의 및 추상화 | `## class SuggestedQuestionTraceInfo` |
| E6 | 아키텍처 | DatasetRetrievalTraceInfo | DatasetRetrievalTraceInfo 클래스 정의 및 추상화 | `## class DatasetRetrievalTraceInfo` |
| E7 | 아키텍처 | ToolTraceInfo | ToolTraceInfo 클래스 정의 및 추상화 | `## class ToolTraceInfo` |
| E8 | 아키텍처 | GenerateNameTraceInfo | GenerateNameTraceInfo 클래스 정의 및 추상화 | `## class GenerateNameTraceInfo` |
| E9 | 아키텍처 | PromptGenerationTraceInfo | PromptGenerationTraceInfo 클래스 정의 및 추상화 | `## class PromptGenerationTraceInfo` |
| E10 | 아키텍처 | WorkflowNodeTraceInfo | WorkflowNodeTraceInfo 클래스 정의 및 추상화 | `## class WorkflowNodeTraceInfo` |
| E11 | 아키텍처 | DraftNodeExecutionTrace | DraftNodeExecutionTrace 클래스 정의 및 추상화 | `## class DraftNodeExecutionTrace` |
| E12 | 아키텍처 | TaskData | TaskData 클래스 정의 및 추상화 | `## class TaskData` |
| E13 | 아키텍처 | OperationType | OperationType 클래스 정의 및 추상화 | `## class OperationType` |
| E14 | 아키텍처 | TraceTaskName | TraceTaskName 클래스 정의 및 추상화 | `## class TraceTaskName` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[trace_entity.py](../../../../../../99.archive/dify/api/core/ops/entities/trace_entity.py)
