---
type: card
title: "Context"
description: "context.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/logging/context.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `context.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | IdentityContext | IdentityContext 클래스 정의 및 추상화 | `## class IdentityContext` |
| E2 | 규칙 | get_request_id | get_request_id 핵심 로직 및 프로시저 | `## def get_request_id` |
| E3 | 규칙 | get_trace_id | get_trace_id 핵심 로직 및 프로시저 | `## def get_trace_id` |
| E4 | 규칙 | get_identity_context | get_identity_context 핵심 로직 및 프로시저 | `## def get_identity_context` |
| E5 | 규칙 | set_identity_context | set_identity_context 핵심 로직 및 프로시저 | `## def set_identity_context` |
| E6 | 규칙 | init_request_context | init_request_context 핵심 로직 및 프로시저 | `## def init_request_context` |
| E7 | 규칙 | clear_request_context | clear_request_context 핵심 로직 및 프로시저 | `## def clear_request_context` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[context.py](../../../../../99.archive/dify/api/core/logging/context.py)
