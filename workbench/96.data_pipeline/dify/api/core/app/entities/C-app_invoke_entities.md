---
type: card
title: "App Invoke Entities"
description: "app_invoke_entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/entities/app_invoke_entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `app_invoke_entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | UserFrom | UserFrom 클래스 정의 및 추상화 | `## class UserFrom` |
| E2 | 아키텍처 | InvokeFrom | InvokeFrom 클래스 정의 및 추상화 | `## class InvokeFrom` |
| E3 | 규칙 | get_credit_usage_app_type | get_credit_usage_app_type 핵심 로직 및 프로시저 | `## def get_credit_usage_app_type` |
| E4 | 규칙 | get_credit_usage_created_by | get_credit_usage_created_by 핵심 로직 및 프로시저 | `## def get_credit_usage_created_by` |
| E5 | 아키텍처 | DifyRunContext | DifyRunContext 클래스 정의 및 추상화 | `## class DifyRunContext` |
| E6 | 규칙 | build_dify_run_context | build_dify_run_context 핵심 로직 및 프로시저 | `## def build_dify_run_context` |
| E7 | 아키텍처 | ModelConfigWithCredentialsEntity | ModelConfigWithCredentialsEntity 클래스 정의 및 추상화 | `## class ModelConfigWithCredentialsEntity` |
| E8 | 아키텍처 | AppGenerateEntity | AppGenerateEntity 클래스 정의 및 추상화 | `## class AppGenerateEntity` |
| E9 | 아키텍처 | EasyUIBasedAppGenerateEntity | EasyUIBasedAppGenerateEntity 클래스 정의 및 추상화 | `## class EasyUIBasedAppGenerateEntity` |
| E10 | 아키텍처 | ConversationAppGenerateEntity | ConversationAppGenerateEntity 클래스 정의 및 추상화 | `## class ConversationAppGenerateEntity` |
| E11 | 아키텍처 | ChatAppGenerateEntity | ChatAppGenerateEntity 클래스 정의 및 추상화 | `## class ChatAppGenerateEntity` |
| E12 | 아키텍처 | CompletionAppGenerateEntity | CompletionAppGenerateEntity 클래스 정의 및 추상화 | `## class CompletionAppGenerateEntity` |
| E13 | 아키텍처 | AgentChatAppGenerateEntity | AgentChatAppGenerateEntity 클래스 정의 및 추상화 | `## class AgentChatAppGenerateEntity` |
| E14 | 아키텍처 | AgentAppGenerateEntity | AgentAppGenerateEntity 클래스 정의 및 추상화 | `## class AgentAppGenerateEntity` |
| E15 | 아키텍처 | AdvancedChatAppGenerateEntity | AdvancedChatAppGenerateEntity 클래스 정의 및 추상화 | `## class AdvancedChatAppGenerateEntity` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[app_invoke_entities.py](../../../../../../99.archive/dify/api/core/app/entities/app_invoke_entities.py)
