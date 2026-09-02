---
type: card
title: "Scope"
description: "scope.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/file_access/scope.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `scope.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | FileAccessScope | FileAccessScope 클래스 정의 및 추상화 | `## class FileAccessScope` |
| E2 | 규칙 | get_current_file_access_scope | get_current_file_access_scope 핵심 로직 및 프로시저 | `## def get_current_file_access_scope` |
| E3 | 규칙 | grant_upload_file_access | grant_upload_file_access 핵심 로직 및 프로시저 | `## def grant_upload_file_access` |
| E4 | 규칙 | grant_retriever_segment_access | grant_retriever_segment_access 핵심 로직 및 프로시저 | `## def grant_retriever_segment_access` |
| E5 | 규칙 | is_retriever_segment_access_granted | is_retriever_segment_access_granted 핵심 로직 및 프로시저 | `## def is_retriever_segment_access_granted` |
| E6 | 규칙 | bind_file_access_scope | bind_file_access_scope 핵심 로직 및 프로시저 | `## def bind_file_access_scope` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[scope.py](../../../../../../99.archive/dify/api/core/app/file_access/scope.py)
