---
type: card
title: "Human Input Adapter"
description: "human_input_adapter.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/workflow/human_input_adapter.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `human_input_adapter.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | DeliveryMethodType | DeliveryMethodType 클래스 정의 및 추상화 | `## class DeliveryMethodType` |
| E2 | 아키텍처 | EmailRecipientType | EmailRecipientType 클래스 정의 및 추상화 | `## class EmailRecipientType` |
| E3 | 아키텍처 | _InteractiveSurfaceDeliveryConfig | _InteractiveSurfaceDeliveryConfig 클래스 정의 및 추상화 | `## class _InteractiveSurfaceDeliveryConfig` |
| E4 | 아키텍처 | BoundRecipient | BoundRecipient 클래스 정의 및 추상화 | `## class BoundRecipient` |
| E5 | 아키텍처 | ExternalRecipient | ExternalRecipient 클래스 정의 및 추상화 | `## class ExternalRecipient` |
| E6 | 아키텍처 | EmailRecipients | EmailRecipients 클래스 정의 및 추상화 | `## class EmailRecipients` |
| E7 | 아키텍처 | EmailDeliveryConfig | EmailDeliveryConfig 클래스 정의 및 추상화 | `## class EmailDeliveryConfig` |
| E8 | 아키텍처 | _DeliveryMethodBase | _DeliveryMethodBase 클래스 정의 및 추상화 | `## class _DeliveryMethodBase` |
| E9 | 아키텍처 | InteractiveSurfaceDeliveryMethod | InteractiveSurfaceDeliveryMethod 클래스 정의 및 추상화 | `## class InteractiveSurfaceDeliveryMethod` |
| E10 | 아키텍처 | EmailDeliveryMethod | EmailDeliveryMethod 클래스 정의 및 추상화 | `## class EmailDeliveryMethod` |
| E11 | 규칙 | _copy_mapping | _copy_mapping 핵심 로직 및 프로시저 | `## def _copy_mapping` |
| E12 | 규칙 | adapt_human_input_node_data_for_graph | adapt_human_input_node_data_for_graph 핵심 로직 및 프로시저 | `## def adapt_human_input_node_data_for_graph` |
| E13 | 규칙 | parse_human_input_delivery_methods | parse_human_input_delivery_methods 핵심 로직 및 프로시저 | `## def parse_human_input_delivery_methods` |
| E14 | 규칙 | is_human_input_webapp_enabled | is_human_input_webapp_enabled 핵심 로직 및 프로시저 | `## def is_human_input_webapp_enabled` |
| E15 | 규칙 | adapt_node_data_for_graph | adapt_node_data_for_graph 핵심 로직 및 프로시저 | `## def adapt_node_data_for_graph` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[human_input_adapter.py](../../../../../99.archive/dify/api/core/workflow/human_input_adapter.py)
