---
type: card
title: "Exc"
description: "exc.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/knowledge_retrieval/exc.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `exc.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | KnowledgeRetrievalNodeError | KnowledgeRetrievalNodeError 클래스 정의 및 추상화 | `## class KnowledgeRetrievalNodeError` |
| E2 | 아키텍처 | ModelNotExistError | ModelNotExistError 클래스 정의 및 추상화 | `## class ModelNotExistError` |
| E3 | 아키텍처 | ModelCredentialsNotInitializedError | ModelCredentialsNotInitializedError 클래스 정의 및 추상화 | `## class ModelCredentialsNotInitializedError` |
| E4 | 아키텍처 | ModelNotSupportedError | ModelNotSupportedError 클래스 정의 및 추상화 | `## class ModelNotSupportedError` |
| E5 | 아키텍처 | ModelQuotaExceededError | ModelQuotaExceededError 클래스 정의 및 추상화 | `## class ModelQuotaExceededError` |
| E6 | 아키텍처 | InvalidModelTypeError | InvalidModelTypeError 클래스 정의 및 추상화 | `## class InvalidModelTypeError` |
| E7 | 아키텍처 | RateLimitExceededError | RateLimitExceededError 클래스 정의 및 추상화 | `## class RateLimitExceededError` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[exc.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/knowledge_retrieval/exc.py)
