---
type: card
title: "Error"
description: "error.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/errors/error.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `error.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | LLMError | LLMError 클래스 정의 및 추상화 | `## class LLMError` |
| E2 | 아키텍처 | LLMBadRequestError | LLMBadRequestError 클래스 정의 및 추상화 | `## class LLMBadRequestError` |
| E3 | 아키텍처 | ProviderTokenNotInitError | ProviderTokenNotInitError 클래스 정의 및 추상화 | `## class ProviderTokenNotInitError` |
| E4 | 아키텍처 | QuotaExceededError | QuotaExceededError 클래스 정의 및 추상화 | `## class QuotaExceededError` |
| E5 | 아키텍처 | AppInvokeQuotaExceededError | AppInvokeQuotaExceededError 클래스 정의 및 추상화 | `## class AppInvokeQuotaExceededError` |
| E6 | 아키텍처 | ModelCurrentlyNotSupportError | ModelCurrentlyNotSupportError 클래스 정의 및 추상화 | `## class ModelCurrentlyNotSupportError` |
| E7 | 아키텍처 | InvokeRateLimitError | InvokeRateLimitError 클래스 정의 및 추상화 | `## class InvokeRateLimitError` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[error.py](../../../../../99.archive/dify/api/core/errors/error.py)
