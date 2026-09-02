---
type: card
title: "Data Post Processor"
description: "data_post_processor.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/rag/data_post_processor/data_post_processor.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `data_post_processor.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | RerankingModelDict | RerankingModelDict 클래스 정의 및 추상화 | `## class RerankingModelDict` |
| E2 | 아키텍처 | VectorSettingDict | VectorSettingDict 클래스 정의 및 추상화 | `## class VectorSettingDict` |
| E3 | 아키텍처 | KeywordSettingDict | KeywordSettingDict 클래스 정의 및 추상화 | `## class KeywordSettingDict` |
| E4 | 아키텍처 | WeightsDict | WeightsDict 클래스 정의 및 추상화 | `## class WeightsDict` |
| E5 | 아키텍처 | DataPostProcessor | DataPostProcessor 클래스 정의 및 추상화 | `## class DataPostProcessor` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[data_post_processor.py](../../../../../../99.archive/dify/api/core/rag/data_post_processor/data_post_processor.py)
