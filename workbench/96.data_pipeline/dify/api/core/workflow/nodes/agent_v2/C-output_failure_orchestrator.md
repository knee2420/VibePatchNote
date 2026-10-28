---
type: card
title: "Output Failure Orchestrator"
description: "output_failure_orchestrator.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/agent_v2/output_failure_orchestrator.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `output_failure_orchestrator.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | OutputFailureKind | OutputFailureKind 클래스 정의 및 추상화 | `## class OutputFailureKind` |
| E2 | 아키텍처 | OutputFailureDecision | OutputFailureDecision 클래스 정의 및 추상화 | `## class OutputFailureDecision` |
| E3 | 아키텍처 | FailedOutput | FailedOutput 클래스 정의 및 추상화 | `## class FailedOutput` |
| E4 | 아키텍처 | OutputFailureOutcome | OutputFailureOutcome 클래스 정의 및 추상화 | `## class OutputFailureOutcome` |
| E5 | 아키텍처 | OutputFailureOrchestrator | OutputFailureOrchestrator 클래스 정의 및 추상화 | `## class OutputFailureOrchestrator` |
| E6 | 규칙 | retry_idempotency_key | retry_idempotency_key 핵심 로직 및 프로시저 | `## def retry_idempotency_key` |
| E7 | 규칙 | build_failure_strategy_for | build_failure_strategy_for 핵심 로직 및 프로시저 | `## def build_failure_strategy_for` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[output_failure_orchestrator.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/agent_v2/output_failure_orchestrator.py)
