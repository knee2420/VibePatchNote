---
type: card
title: "Config Entity"
description: "config_entity.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/ops/entities/config_entity.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `config_entity.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | TracingProviderEnum | TracingProviderEnum 클래스 정의 및 추상화 | `## class TracingProviderEnum` |
| E2 | 아키텍처 | BaseTracingConfig | BaseTracingConfig 클래스 정의 및 추상화 | `## class BaseTracingConfig` |
| E3 | 규칙 | ops_trace_payload_path | ops_trace_payload_path 핵심 로직 및 프로시저 | `## def ops_trace_payload_path` |
| E4 | 규칙 | workflow_final_trace_file_id | workflow_final_trace_file_id 핵심 로직 및 프로시저 | `## def workflow_final_trace_file_id` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[config_entity.py](../../../../../../99.archive/dify/api/core/ops/entities/config_entity.py)
