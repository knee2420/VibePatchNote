---
type: card
title: "Queue Entities"
description: "queue_entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/entities/queue_entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `queue_entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | QueueEvent | QueueEvent 클래스 정의 및 추상화 | `## class QueueEvent` |
| E2 | 아키텍처 | AppQueueEvent | AppQueueEvent 클래스 정의 및 추상화 | `## class AppQueueEvent` |
| E3 | 아키텍처 | QueueLLMChunkEvent | QueueLLMChunkEvent 클래스 정의 및 추상화 | `## class QueueLLMChunkEvent` |
| E4 | 아키텍처 | QueueIterationStartEvent | QueueIterationStartEvent 클래스 정의 및 추상화 | `## class QueueIterationStartEvent` |
| E5 | 아키텍처 | QueueIterationNextEvent | QueueIterationNextEvent 클래스 정의 및 추상화 | `## class QueueIterationNextEvent` |
| E6 | 아키텍처 | QueueIterationCompletedEvent | QueueIterationCompletedEvent 클래스 정의 및 추상화 | `## class QueueIterationCompletedEvent` |
| E7 | 아키텍처 | QueueLoopStartEvent | QueueLoopStartEvent 클래스 정의 및 추상화 | `## class QueueLoopStartEvent` |
| E8 | 아키텍처 | QueueLoopNextEvent | QueueLoopNextEvent 클래스 정의 및 추상화 | `## class QueueLoopNextEvent` |
| E9 | 아키텍처 | QueueLoopCompletedEvent | QueueLoopCompletedEvent 클래스 정의 및 추상화 | `## class QueueLoopCompletedEvent` |
| E10 | 아키텍처 | QueueTextChunkEvent | QueueTextChunkEvent 클래스 정의 및 추상화 | `## class QueueTextChunkEvent` |
| E11 | 아키텍처 | QueueReasoningChunkEvent | QueueReasoningChunkEvent 클래스 정의 및 추상화 | `## class QueueReasoningChunkEvent` |
| E12 | 아키텍처 | QueueAgentMessageEvent | QueueAgentMessageEvent 클래스 정의 및 추상화 | `## class QueueAgentMessageEvent` |
| E13 | 아키텍처 | QueueMessageReplaceEvent | QueueMessageReplaceEvent 클래스 정의 및 추상화 | `## class QueueMessageReplaceEvent` |
| E14 | 아키텍처 | QueueRetrieverResourcesEvent | QueueRetrieverResourcesEvent 클래스 정의 및 추상화 | `## class QueueRetrieverResourcesEvent` |
| E15 | 아키텍처 | QueueAnnotationReplyEvent | QueueAnnotationReplyEvent 클래스 정의 및 추상화 | `## class QueueAnnotationReplyEvent` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[queue_entities.py](../../../../../../99.archive/dify/api/core/app/entities/queue_entities.py)
