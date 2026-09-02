---
type: card
title: "Execution Coordinator"
description: "execution_coordinator.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/apps/execution_coordinator.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `execution_coordinator.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | AppExecutionState | AppExecutionState 클래스 정의 및 추상화 | `## class AppExecutionState` |
| E2 | 규칙 | app_task_command_channel_key | app_task_command_channel_key 핵심 로직 및 프로시저 | `## def app_task_command_channel_key` |
| E3 | 규칙 | app_task_stop_flag_key | app_task_stop_flag_key 핵심 로직 및 프로시저 | `## def app_task_stop_flag_key` |
| E4 | 규칙 | set_app_task_stop_flag | set_app_task_stop_flag 핵심 로직 및 프로시저 | `## def set_app_task_stop_flag` |
| E5 | 규칙 | is_app_task_stop_flag_set | is_app_task_stop_flag_set 핵심 로직 및 프로시저 | `## def is_app_task_stop_flag_set` |
| E6 | 규칙 | clear_app_task_cancellation_signals | clear_app_task_cancellation_signals 핵심 로직 및 프로시저 | `## def clear_app_task_cancellation_signals` |
| E7 | 아키텍처 | AppExecutionCoordinator | AppExecutionCoordinator 클래스 정의 및 추상화 | `## class AppExecutionCoordinator` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[execution_coordinator.py](../../../../../../99.archive/dify/api/core/app/apps/execution_coordinator.py)
