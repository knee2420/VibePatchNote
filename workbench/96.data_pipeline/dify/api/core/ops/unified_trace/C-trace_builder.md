---
type: card
title: "Trace Builder"
description: "trace_builder.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/ops/unified_trace/trace_builder.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `trace_builder.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | RepositoryWorkflowExecutionLoader | RepositoryWorkflowExecutionLoader 클래스 정의 및 추상화 | `## class RepositoryWorkflowExecutionLoader` |
| E2 | 규칙 | _read_attribute | _read_attribute 핵심 로직 및 프로시저 | `## def _read_attribute` |
| E3 | 규칙 | _retry_metadata | _retry_metadata 핵심 로직 및 프로시저 | `## def _retry_metadata` |
| E4 | 규칙 | resolve_session_id | resolve_session_id 핵심 로직 및 프로시저 | `## def resolve_session_id` |
| E5 | 규칙 | _status | _status 핵심 로직 및 프로시저 | `## def _status` |
| E6 | 규칙 | _external_parent | _external_parent 핵심 로직 및 프로시저 | `## def _external_parent` |
| E7 | 규칙 | _started_at | _started_at 핵심 로직 및 프로시저 | `## def _started_at` |
| E8 | 규칙 | _single_session_id | _single_session_id 핵심 로직 및 프로시저 | `## def _single_session_id` |
| E9 | 아키텍처 | CanonicalTraceBuilder | CanonicalTraceBuilder 클래스 정의 및 추상화 | `## class CanonicalTraceBuilder` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[trace_builder.py](../../../../../../99.archive/dify/api/core/ops/unified_trace/trace_builder.py)
