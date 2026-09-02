---
type: card
title: "Events"
description: "events.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/telemetry/events.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `events.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | TraceContext | TraceContext 클래스 정의 및 추상화 | `## class TraceContext` |
| E2 | 아키텍처 | MetricLogContext | MetricLogContext 클래스 정의 및 추상화 | `## class MetricLogContext` |
| E3 | 아키텍처 | NodeExecutionPayload | NodeExecutionPayload 클래스 정의 및 추상화 | `## class NodeExecutionPayload` |
| E4 | 아키텍처 | AppCreatedPayload | AppCreatedPayload 클래스 정의 및 추상화 | `## class AppCreatedPayload` |
| E5 | 아키텍처 | AppUpdatedPayload | AppUpdatedPayload 클래스 정의 및 추상화 | `## class AppUpdatedPayload` |
| E6 | 아키텍처 | AppDeletedPayload | AppDeletedPayload 클래스 정의 및 추상화 | `## class AppDeletedPayload` |
| E7 | 아키텍처 | PromptGenerationPayload | PromptGenerationPayload 클래스 정의 및 추상화 | `## class PromptGenerationPayload` |
| E8 | 아키텍처 | FeedbackCreatedPayload | FeedbackCreatedPayload 클래스 정의 및 추상화 | `## class FeedbackCreatedPayload` |
| E9 | 아키텍처 | TelemetryContext | TelemetryContext 클래스 정의 및 추상화 | `## class TelemetryContext` |
| E10 | 아키텍처 | TelemetryEvent | TelemetryEvent 클래스 정의 및 추상화 | `## class TelemetryEvent` |
| E11 | 아키텍처 | DraftNodeExecutionTraceEvent | DraftNodeExecutionTraceEvent 클래스 정의 및 추상화 | `## class DraftNodeExecutionTraceEvent` |
| E12 | 아키텍처 | PromptGenerationEvent | PromptGenerationEvent 클래스 정의 및 추상화 | `## class PromptGenerationEvent` |
| E13 | 아키텍처 | AppCreatedEvent | AppCreatedEvent 클래스 정의 및 추상화 | `## class AppCreatedEvent` |
| E14 | 아키텍처 | AppUpdatedEvent | AppUpdatedEvent 클래스 정의 및 추상화 | `## class AppUpdatedEvent` |
| E15 | 아키텍처 | AppDeletedEvent | AppDeletedEvent 클래스 정의 및 추상화 | `## class AppDeletedEvent` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[events.py](../../../../../99.archive/dify/api/core/telemetry/events.py)
