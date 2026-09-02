---
type: card
title: "Ask Human Hitl"
description: "ask_human_hitl.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/agent_v2/ask_human_hitl.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `ask_human_hitl.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | AskHumanFormBuildError | AskHumanFormBuildError 클래스 정의 및 추상화 | `## class AskHumanFormBuildError` |
| E2 | 규칙 | parse_ask_human_args | parse_ask_human_args 핵심 로직 및 프로시저 | `## def parse_ask_human_args` |
| E3 | 규칙 | _clamp_action_id | _clamp_action_id 핵심 로직 및 프로시저 | `## def _clamp_action_id` |
| E4 | 규칙 | _to_form_input | _to_form_input 핵심 로직 및 프로시저 | `## def _to_form_input` |
| E5 | 규칙 | _to_user_actions | _to_user_actions 핵심 로직 및 프로시저 | `## def _to_user_actions` |
| E6 | 규칙 | _render_form_content | _render_form_content 핵심 로직 및 프로시저 | `## def _render_form_content` |
| E7 | 규칙 | _resolved_default_values | _resolved_default_values 핵심 로직 및 프로시저 | `## def _resolved_default_values` |
| E8 | 규칙 | ask_human_args_to_node_data | ask_human_args_to_node_data 핵심 로직 및 프로시저 | `## def ask_human_args_to_node_data` |
| E9 | 규칙 | build_delivery_methods | build_delivery_methods 핵심 로직 및 프로시저 | `## def build_delivery_methods` |
| E10 | 아키텍처 | AskHumanFormCreated | AskHumanFormCreated 클래스 정의 및 추상화 | `## class AskHumanFormCreated` |
| E11 | 규칙 | create_ask_human_form | create_ask_human_form 핵심 로직 및 프로시저 | `## def create_ask_human_form` |
| E12 | 규칙 | build_ask_human_pause_reason | build_ask_human_pause_reason 핵심 로직 및 프로시저 | `## def build_ask_human_pause_reason` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[ask_human_hitl.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/agent_v2/ask_human_hitl.py)
