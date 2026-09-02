---
type: card
title: "App Runner"
description: "app_runner.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/app/apps/agent_app/app_runner.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `app_runner.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | _DefaultSessionScopeSnapshotId | _DefaultSessionScopeSnapshotId 클래스 정의 및 추상화 | `## class _DefaultSessionScopeSnapshotId` |
| E2 | 규칙 | _agent_backend_failure_to_exception | _agent_backend_failure_to_exception 핵심 로직 및 프로시저 | `## def _agent_backend_failure_to_exception` |
| E3 | 규칙 | _prompt_messages_from_query | _prompt_messages_from_query 핵심 로직 및 프로시저 | `## def _prompt_messages_from_query` |
| E4 | 규칙 | _llm_usage_from_agent_backend | _llm_usage_from_agent_backend 핵심 로직 및 프로시저 | `## def _llm_usage_from_agent_backend` |
| E5 | 규칙 | publish_text_answer | publish_text_answer 핵심 로직 및 프로시저 | `## def publish_text_answer` |
| E6 | 규칙 | publish_text_delta | publish_text_delta 핵심 로직 및 프로시저 | `## def publish_text_delta` |
| E7 | 규칙 | publish_agent_message_delta | publish_agent_message_delta 핵심 로직 및 프로시저 | `## def publish_agent_message_delta` |
| E8 | 규칙 | publish_message_end | publish_message_end 핵심 로직 및 프로시저 | `## def publish_message_end` |
| E9 | 아키텍처 | _TextDeltaDebouncer | _TextDeltaDebouncer 클래스 정의 및 추상화 | `## class _TextDeltaDebouncer` |
| E10 | 아키텍처 | _AgentProcessRecorder | _AgentProcessRecorder 클래스 정의 및 추상화 | `## class _AgentProcessRecorder` |
| E11 | 규칙 | _event_index | _event_index 핵심 로직 및 프로시저 | `## def _event_index` |
| E12 | 규칙 | _string_or_none | _string_or_none 핵심 로직 및 프로시저 | `## def _string_or_none` |
| E13 | 규칙 | _json_or_text | _json_or_text 핵심 로직 및 프로시저 | `## def _json_or_text` |
| E14 | 규칙 | _tool_labels | _tool_labels 핵심 로직 및 프로시저 | `## def _tool_labels` |
| E15 | 규칙 | _suffix_prefix_overlap_length | _suffix_prefix_overlap_length 핵심 로직 및 프로시저 | `## def _suffix_prefix_overlap_length` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[app_runner.py](../../../../../../../99.archive/dify/api/core/app/apps/agent_app/app_runner.py)
