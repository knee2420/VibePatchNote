---
type: card
title: "Jieba"
description: "jieba.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../../99.archive/dify/api/core/rag/datasource/keyword/jieba/jieba.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `jieba.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | PreSegmentData | PreSegmentData 클래스 정의 및 추상화 | `## class PreSegmentData` |
| E2 | 아키텍처 | KeywordTableConfig | KeywordTableConfig 클래스 정의 및 추상화 | `## class KeywordTableConfig` |
| E3 | 아키텍처 | Jieba | Jieba 클래스 정의 및 추상화 | `## class Jieba` |
| E4 | 규칙 | set_orjson_default | set_orjson_default 핵심 로직 및 프로시저 | `## def set_orjson_default` |
| E5 | 규칙 | dumps_with_sets | dumps_with_sets 핵심 로직 및 프로시저 | `## def dumps_with_sets` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[jieba.py](../../../../../../../../99.archive/dify/api/core/rag/datasource/keyword/jieba/jieba.py)
