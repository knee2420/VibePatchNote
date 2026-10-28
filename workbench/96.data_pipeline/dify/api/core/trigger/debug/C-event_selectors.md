---
type: card
title: "Event Selectors"
description: "event_selectors.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/trigger/debug/event_selectors.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `event_selectors.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | TriggerDebugEvent | TriggerDebugEvent 클래스 정의 및 추상화 | `## class TriggerDebugEvent` |
| E2 | 아키텍처 | TriggerDebugEventPoller | TriggerDebugEventPoller 클래스 정의 및 추상화 | `## class TriggerDebugEventPoller` |
| E3 | 아키텍처 | PluginTriggerDebugEventPoller | PluginTriggerDebugEventPoller 클래스 정의 및 추상화 | `## class PluginTriggerDebugEventPoller` |
| E4 | 아키텍처 | WebhookTriggerDebugEventPoller | WebhookTriggerDebugEventPoller 클래스 정의 및 추상화 | `## class WebhookTriggerDebugEventPoller` |
| E5 | 아키텍처 | ScheduleTriggerDebugEventPoller | ScheduleTriggerDebugEventPoller 클래스 정의 및 추상화 | `## class ScheduleTriggerDebugEventPoller` |
| E6 | 규칙 | create_event_poller | create_event_poller 핵심 로직 및 프로시저 | `## def create_event_poller` |
| E7 | 규칙 | select_trigger_debug_events | select_trigger_debug_events 핵심 로직 및 프로시저 | `## def select_trigger_debug_events` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[event_selectors.py](../../../../../../99.archive/dify/api/core/trigger/debug/event_selectors.py)
