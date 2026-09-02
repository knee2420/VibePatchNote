---
type: card
title: "Gateway"
description: "gateway.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/telemetry/gateway.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `gateway.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | is_enterprise_telemetry_enabled | is_enterprise_telemetry_enabled 핵심 로직 및 프로시저 | `## def is_enterprise_telemetry_enabled` |
| E2 | 규칙 | _handle_payload_sizing | _handle_payload_sizing 핵심 로직 및 프로시저 | `## def _handle_payload_sizing` |
| E3 | 규칙 | emit | emit 핵심 로직 및 프로시저 | `## def emit` |
| E4 | 규칙 | _emit_trace | _emit_trace 핵심 로직 및 프로시저 | `## def _emit_trace` |
| E5 | 규칙 | _emit_metric_log | _emit_metric_log 핵심 로직 및 프로시저 | `## def _emit_metric_log` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[gateway.py](../../../../../99.archive/dify/api/core/telemetry/gateway.py)
