---
type: card
title: "Entities"
description: "entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/trigger/entities/entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | EventParameterType | EventParameterType 클래스 정의 및 추상화 | `## class EventParameterType` |
| E2 | 아키텍처 | EventParameter | EventParameter 클래스 정의 및 추상화 | `## class EventParameter` |
| E3 | 아키텍처 | TriggerProviderIdentity | TriggerProviderIdentity 클래스 정의 및 추상화 | `## class TriggerProviderIdentity` |
| E4 | 아키텍처 | EventIdentity | EventIdentity 클래스 정의 및 추상화 | `## class EventIdentity` |
| E5 | 아키텍처 | EventEntity | EventEntity 클래스 정의 및 추상화 | `## class EventEntity` |
| E6 | 아키텍처 | SubscriptionConstructor | SubscriptionConstructor 클래스 정의 및 추상화 | `## class SubscriptionConstructor` |
| E7 | 아키텍처 | TriggerProviderEntity | TriggerProviderEntity 클래스 정의 및 추상화 | `## class TriggerProviderEntity` |
| E8 | 아키텍처 | Subscription | Subscription 클래스 정의 및 추상화 | `## class Subscription` |
| E9 | 아키텍처 | UnsubscribeResult | UnsubscribeResult 클래스 정의 및 추상화 | `## class UnsubscribeResult` |
| E10 | 아키텍처 | RequestLog | RequestLog 클래스 정의 및 추상화 | `## class RequestLog` |
| E11 | 아키텍처 | SubscriptionBuilder | SubscriptionBuilder 클래스 정의 및 추상화 | `## class SubscriptionBuilder` |
| E12 | 아키텍처 | SubscriptionBuilderUpdater | SubscriptionBuilderUpdater 클래스 정의 및 추상화 | `## class SubscriptionBuilderUpdater` |
| E13 | 아키텍처 | TriggerEventData | TriggerEventData 클래스 정의 및 추상화 | `## class TriggerEventData` |
| E14 | 아키텍처 | TriggerCreationMethod | TriggerCreationMethod 클래스 정의 및 추상화 | `## class TriggerCreationMethod` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[entities.py](../../../../../../99.archive/dify/api/core/trigger/entities/entities.py)
