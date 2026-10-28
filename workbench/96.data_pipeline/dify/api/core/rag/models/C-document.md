---
type: card
title: "Document"
description: "document.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/rag/models/document.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `document.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ChildDocument | ChildDocument 클래스 정의 및 추상화 | `## class ChildDocument` |
| E2 | 아키텍처 | AttachmentDocument | AttachmentDocument 클래스 정의 및 추상화 | `## class AttachmentDocument` |
| E3 | 아키텍처 | Document | Document 클래스 정의 및 추상화 | `## class Document` |
| E4 | 아키텍처 | GeneralChunk | GeneralChunk 클래스 정의 및 추상화 | `## class GeneralChunk` |
| E5 | 아키텍처 | MultimodalGeneralStructureChunk | MultimodalGeneralStructureChunk 클래스 정의 및 추상화 | `## class MultimodalGeneralStructureChunk` |
| E6 | 아키텍처 | GeneralStructureChunk | GeneralStructureChunk 클래스 정의 및 추상화 | `## class GeneralStructureChunk` |
| E7 | 아키텍처 | ParentChildChunk | ParentChildChunk 클래스 정의 및 추상화 | `## class ParentChildChunk` |
| E8 | 아키텍처 | ParentChildStructureChunk | ParentChildStructureChunk 클래스 정의 및 추상화 | `## class ParentChildStructureChunk` |
| E9 | 아키텍처 | QAChunk | QAChunk 클래스 정의 및 추상화 | `## class QAChunk` |
| E10 | 아키텍처 | QAStructureChunk | QAStructureChunk 클래스 정의 및 추상화 | `## class QAStructureChunk` |
| E11 | 아키텍처 | BaseDocumentTransformer | BaseDocumentTransformer 클래스 정의 및 추상화 | `## class BaseDocumentTransformer` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[document.py](../../../../../../99.archive/dify/api/core/rag/models/document.py)
