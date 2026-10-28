---
type: card
title: "Client Session"
description: "client_session.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/mcp/session/client_session.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `client_session.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | SamplingFnT | SamplingFnT 클래스 정의 및 추상화 | `## class SamplingFnT` |
| E2 | 아키텍처 | ListRootsFnT | ListRootsFnT 클래스 정의 및 추상화 | `## class ListRootsFnT` |
| E3 | 아키텍처 | LoggingFnT | LoggingFnT 클래스 정의 및 추상화 | `## class LoggingFnT` |
| E4 | 아키텍처 | MessageHandlerFnT | MessageHandlerFnT 클래스 정의 및 추상화 | `## class MessageHandlerFnT` |
| E5 | 규칙 | _default_message_handler | _default_message_handler 핵심 로직 및 프로시저 | `## def _default_message_handler` |
| E6 | 규칙 | _default_sampling_callback | _default_sampling_callback 핵심 로직 및 프로시저 | `## def _default_sampling_callback` |
| E7 | 규칙 | _default_list_roots_callback | _default_list_roots_callback 핵심 로직 및 프로시저 | `## def _default_list_roots_callback` |
| E8 | 규칙 | _default_logging_callback | _default_logging_callback 핵심 로직 및 프로시저 | `## def _default_logging_callback` |
| E9 | 아키텍처 | ClientSession | ClientSession 클래스 정의 및 추상화 | `## class ClientSession` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[client_session.py](../../../../../../99.archive/dify/api/core/mcp/session/client_session.py)
