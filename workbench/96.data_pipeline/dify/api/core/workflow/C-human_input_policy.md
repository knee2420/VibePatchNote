---
type: card
title: "Human Input Policy"
description: "human_input_policy.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/workflow/human_input_policy.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `human_input_policy.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | HumanInputSurface | HumanInputSurface 클래스 정의 및 추상화 | `## class HumanInputSurface` |
| E2 | 규칙 | is_recipient_type_allowed_for_surface | is_recipient_type_allowed_for_surface 핵심 로직 및 프로시저 | `## def is_recipient_type_allowed_for_surface` |
| E3 | 규칙 | get_preferred_form_token | get_preferred_form_token 핵심 로직 및 프로시저 | `## def get_preferred_form_token` |
| E4 | 아키텍처 | FormDisposition | FormDisposition 클래스 정의 및 추상화 | `## class FormDisposition` |
| E5 | 규칙 | disposition_for_surface | disposition_for_surface 핵심 로직 및 프로시저 | `## def disposition_for_surface` |
| E6 | 규칙 | enrich_human_input_pause_reasons | enrich_human_input_pause_reasons 핵심 로직 및 프로시저 | `## def enrich_human_input_pause_reasons` |
| E7 | 규칙 | resolve_variable_select_input_options | resolve_variable_select_input_options 핵심 로직 및 프로시저 | `## def resolve_variable_select_input_options` |
| E8 | 규칙 | resolve_human_input_pause_reason_inputs | resolve_human_input_pause_reason_inputs 핵심 로직 및 프로시저 | `## def resolve_human_input_pause_reason_inputs` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[human_input_policy.py](../../../../../99.archive/dify/api/core/workflow/human_input_policy.py)
