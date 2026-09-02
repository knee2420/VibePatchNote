---
type: card
title: "Ops Trace Manager"
description: "ops_trace_manager.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/ops/ops_trace_manager.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `ops_trace_manager.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | _dump_parent_trace_context | _dump_parent_trace_context 핵심 로직 및 프로시저 | `## def _dump_parent_trace_context` |
| E2 | 규칙 | _get_trace_session_id | _get_trace_session_id 핵심 로직 및 프로시저 | `## def _get_trace_session_id` |
| E3 | 아키텍처 | _AppTracingConfig | _AppTracingConfig 클래스 정의 및 추상화 | `## class _AppTracingConfig` |
| E4 | 규칙 | _lookup_app_and_workspace_names | _lookup_app_and_workspace_names 핵심 로직 및 프로시저 | `## def _lookup_app_and_workspace_names` |
| E5 | 규칙 | _lookup_credential_name | _lookup_credential_name 핵심 로직 및 프로시저 | `## def _lookup_credential_name` |
| E6 | 규칙 | _lookup_llm_credential_info | _lookup_llm_credential_info 핵심 로직 및 프로시저 | `## def _lookup_llm_credential_info` |
| E7 | 아키텍처 | TracingProviderConfigEntry | TracingProviderConfigEntry 클래스 정의 및 추상화 | `## class TracingProviderConfigEntry` |
| E8 | 아키텍처 | OpsTraceProviderConfigMap | OpsTraceProviderConfigMap 클래스 정의 및 추상화 | `## class OpsTraceProviderConfigMap` |
| E9 | 아키텍처 | OpsTraceManager | OpsTraceManager 클래스 정의 및 추상화 | `## class OpsTraceManager` |
| E10 | 아키텍처 | TraceTask | TraceTask 클래스 정의 및 추상화 | `## class TraceTask` |
| E11 | 아키텍처 | TraceQueueManager | TraceQueueManager 클래스 정의 및 추상화 | `## class TraceQueueManager` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[ops_trace_manager.py](../../../../../99.archive/dify/api/core/ops/ops_trace_manager.py)
