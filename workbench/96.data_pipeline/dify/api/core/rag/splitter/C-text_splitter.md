---
type: card
title: "Text Splitter"
description: "text_splitter.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/rag/splitter/text_splitter.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `text_splitter.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | _split_text_with_regex | _split_text_with_regex 핵심 로직 및 프로시저 | `## def _split_text_with_regex` |
| E2 | 아키텍처 | TextSplitter | TextSplitter 클래스 정의 및 추상화 | `## class TextSplitter` |
| E3 | 아키텍처 | Tokenizer | Tokenizer 클래스 정의 및 추상화 | `## class Tokenizer` |
| E4 | 규칙 | split_text_on_tokens | split_text_on_tokens 핵심 로직 및 프로시저 | `## def split_text_on_tokens` |
| E5 | 아키텍처 | TokenTextSplitter | TokenTextSplitter 클래스 정의 및 추상화 | `## class TokenTextSplitter` |
| E6 | 아키텍처 | RecursiveCharacterTextSplitter | RecursiveCharacterTextSplitter 클래스 정의 및 추상화 | `## class RecursiveCharacterTextSplitter` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[text_splitter.py](../../../../../../99.archive/dify/api/core/rag/splitter/text_splitter.py)
