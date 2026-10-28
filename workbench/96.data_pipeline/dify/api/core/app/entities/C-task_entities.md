---
type: card
title: "Task Entities"
description: "task_entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/entities/task_entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `task_entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | AnnotationReplyAccount | AnnotationReplyAccount 클래스 정의 및 추상화 | `## class AnnotationReplyAccount` |
| E2 | 아키텍처 | AnnotationReply | AnnotationReply 클래스 정의 및 추상화 | `## class AnnotationReply` |
| E3 | 아키텍처 | TaskStateMetadata | TaskStateMetadata 클래스 정의 및 추상화 | `## class TaskStateMetadata` |
| E4 | 아키텍처 | TaskState | TaskState 클래스 정의 및 추상화 | `## class TaskState` |
| E5 | 아키텍처 | EasyUITaskState | EasyUITaskState 클래스 정의 및 추상화 | `## class EasyUITaskState` |
| E6 | 아키텍처 | WorkflowTaskState | WorkflowTaskState 클래스 정의 및 추상화 | `## class WorkflowTaskState` |
| E7 | 아키텍처 | StreamEvent | StreamEvent 클래스 정의 및 추상화 | `## class StreamEvent` |
| E8 | 아키텍처 | StreamResponse | StreamResponse 클래스 정의 및 추상화 | `## class StreamResponse` |
| E9 | 아키텍처 | ErrorStreamResponse | ErrorStreamResponse 클래스 정의 및 추상화 | `## class ErrorStreamResponse` |
| E10 | 아키텍처 | MessageStreamResponse | MessageStreamResponse 클래스 정의 및 추상화 | `## class MessageStreamResponse` |
| E11 | 아키텍처 | MessageAudioStreamResponse | MessageAudioStreamResponse 클래스 정의 및 추상화 | `## class MessageAudioStreamResponse` |
| E12 | 아키텍처 | MessageAudioEndStreamResponse | MessageAudioEndStreamResponse 클래스 정의 및 추상화 | `## class MessageAudioEndStreamResponse` |
| E13 | 아키텍처 | MessageEndStreamResponse | MessageEndStreamResponse 클래스 정의 및 추상화 | `## class MessageEndStreamResponse` |
| E14 | 아키텍처 | MessageFileStreamResponse | MessageFileStreamResponse 클래스 정의 및 추상화 | `## class MessageFileStreamResponse` |
| E15 | 아키텍처 | MessageReplaceStreamResponse | MessageReplaceStreamResponse 클래스 정의 및 추상화 | `## class MessageReplaceStreamResponse` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[task_entities.py](../../../../../../99.archive/dify/api/core/app/entities/task_entities.py)
