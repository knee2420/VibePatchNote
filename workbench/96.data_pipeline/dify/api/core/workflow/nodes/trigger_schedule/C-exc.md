---
type: card
title: "Exc"
description: "exc.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/trigger_schedule/exc.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `exc.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ScheduleNodeError | ScheduleNodeError 클래스 정의 및 추상화 | `## class ScheduleNodeError` |
| E2 | 아키텍처 | ScheduleNotFoundError | ScheduleNotFoundError 클래스 정의 및 추상화 | `## class ScheduleNotFoundError` |
| E3 | 아키텍처 | ScheduleConfigError | ScheduleConfigError 클래스 정의 및 추상화 | `## class ScheduleConfigError` |
| E4 | 아키텍처 | ScheduleExecutionError | ScheduleExecutionError 클래스 정의 및 추상화 | `## class ScheduleExecutionError` |
| E5 | 아키텍처 | TenantOwnerNotFoundError | TenantOwnerNotFoundError 클래스 정의 및 추상화 | `## class TenantOwnerNotFoundError` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[exc.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/trigger_schedule/exc.py)
