---
type: card
title: "Model Access"
description: "model_access.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/llm/model_access.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `model_access.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | DifyCredentialsProvider | DifyCredentialsProvider 클래스 정의 및 추상화 | `## class DifyCredentialsProvider` |
| E2 | 아키텍처 | DifyModelFactory | DifyModelFactory 클래스 정의 및 추상화 | `## class DifyModelFactory` |
| E3 | 규칙 | build_dify_model_access | build_dify_model_access 핵심 로직 및 프로시저 | `## def build_dify_model_access` |
| E4 | 규칙 | resolve_model_context_window | resolve_model_context_window 핵심 로직 및 프로시저 | `## def resolve_model_context_window` |
| E5 | 규칙 | _normalize_completion_params | _normalize_completion_params 핵심 로직 및 프로시저 | `## def _normalize_completion_params` |
| E6 | 규칙 | fetch_model_config | fetch_model_config 핵심 로직 및 프로시저 | `## def fetch_model_config` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[model_access.py](../../../../../../99.archive/dify/api/core/app/llm/model_access.py)
