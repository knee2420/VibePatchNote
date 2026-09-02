---
type: card
title: "Retrieval"
description: "retrieval.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/knowledge_retrieval/retrieval.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `retrieval.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | SourceChildChunk | SourceChildChunk 클래스 정의 및 추상화 | `## class SourceChildChunk` |
| E2 | 아키텍처 | SourceMetadata | SourceMetadata 클래스 정의 및 추상화 | `## class SourceMetadata` |
| E3 | 아키텍처 | Source | Source 클래스 정의 및 추상화 | `## class Source` |
| E4 | 아키텍처 | KnowledgeRetrievalRequest | KnowledgeRetrievalRequest 클래스 정의 및 추상화 | `## class KnowledgeRetrievalRequest` |
| E5 | 아키텍처 | RAGRetrievalProtocol | RAGRetrievalProtocol 클래스 정의 및 추상화 | `## class RAGRetrievalProtocol` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[retrieval.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/knowledge_retrieval/retrieval.py)
