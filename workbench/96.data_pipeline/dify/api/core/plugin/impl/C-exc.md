---
type: card
title: "Exc"
description: "exc.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/plugin/impl/exc.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `exc.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | PluginDaemonError | PluginDaemonError 클래스 정의 및 추상화 | `## class PluginDaemonError` |
| E2 | 아키텍처 | PluginDaemonInternalError | PluginDaemonInternalError 클래스 정의 및 추상화 | `## class PluginDaemonInternalError` |
| E3 | 아키텍처 | PluginDaemonClientSideError | PluginDaemonClientSideError 클래스 정의 및 추상화 | `## class PluginDaemonClientSideError` |
| E4 | 아키텍처 | PluginDaemonInternalServerError | PluginDaemonInternalServerError 클래스 정의 및 추상화 | `## class PluginDaemonInternalServerError` |
| E5 | 아키텍처 | PluginDaemonUnauthorizedError | PluginDaemonUnauthorizedError 클래스 정의 및 추상화 | `## class PluginDaemonUnauthorizedError` |
| E6 | 아키텍처 | PluginDaemonNotFoundError | PluginDaemonNotFoundError 클래스 정의 및 추상화 | `## class PluginDaemonNotFoundError` |
| E7 | 아키텍처 | PluginDaemonBadRequestError | PluginDaemonBadRequestError 클래스 정의 및 추상화 | `## class PluginDaemonBadRequestError` |
| E8 | 아키텍처 | PluginRuntimeError | PluginRuntimeError 클래스 정의 및 추상화 | `## class PluginRuntimeError` |
| E9 | 아키텍처 | PluginInvokeError | PluginInvokeError 클래스 정의 및 추상화 | `## class PluginInvokeError` |
| E10 | 아키텍처 | PluginLLMPollingUnsupportedError | PluginLLMPollingUnsupportedError 클래스 정의 및 추상화 | `## class PluginLLMPollingUnsupportedError` |
| E11 | 아키텍처 | PluginUniqueIdentifierError | PluginUniqueIdentifierError 클래스 정의 및 추상화 | `## class PluginUniqueIdentifierError` |
| E12 | 아키텍처 | PluginNotFoundError | PluginNotFoundError 클래스 정의 및 추상화 | `## class PluginNotFoundError` |
| E13 | 아키텍처 | PluginPermissionDeniedError | PluginPermissionDeniedError 클래스 정의 및 추상화 | `## class PluginPermissionDeniedError` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[exc.py](../../../../../../99.archive/dify/api/core/plugin/impl/exc.py)
