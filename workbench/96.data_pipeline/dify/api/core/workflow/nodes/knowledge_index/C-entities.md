---
type: card
title: "Entities"
description: "entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/knowledge_index/entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | RetrievalSetting | RetrievalSetting 클래스 정의 및 추상화 | `## class RetrievalSetting` |
| E2 | 아키텍처 | FileInfo | FileInfo 클래스 정의 및 추상화 | `## class FileInfo` |
| E3 | 아키텍처 | OnlineDocumentIcon | OnlineDocumentIcon 클래스 정의 및 추상화 | `## class OnlineDocumentIcon` |
| E4 | 아키텍처 | OnlineDocumentInfo | OnlineDocumentInfo 클래스 정의 및 추상화 | `## class OnlineDocumentInfo` |
| E5 | 아키텍처 | WebsiteInfo | WebsiteInfo 클래스 정의 및 추상화 | `## class WebsiteInfo` |
| E6 | 아키텍처 | GeneralStructureChunk | GeneralStructureChunk 클래스 정의 및 추상화 | `## class GeneralStructureChunk` |
| E7 | 아키텍처 | ParentChildChunk | ParentChildChunk 클래스 정의 및 추상화 | `## class ParentChildChunk` |
| E8 | 아키텍처 | ParentChildStructureChunk | ParentChildStructureChunk 클래스 정의 및 추상화 | `## class ParentChildStructureChunk` |
| E9 | 아키텍처 | KnowledgeIndexNodeData | KnowledgeIndexNodeData 클래스 정의 및 추상화 | `## class KnowledgeIndexNodeData` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[entities.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/knowledge_index/entities.py)
