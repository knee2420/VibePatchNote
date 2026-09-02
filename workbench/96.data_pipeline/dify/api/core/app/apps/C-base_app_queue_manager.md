---
type: card
title: "Base App Queue Manager"
description: "base_app_queue_manager.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/apps/base_app_queue_manager.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `base_app_queue_manager.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | _is_broken_pipe_error | _is_broken_pipe_error 핵심 로직 및 프로시저 | `## def _is_broken_pipe_error` |
| E2 | 아키텍처 | PublishFrom | PublishFrom 클래스 정의 및 추상화 | `## class PublishFrom` |
| E3 | 아키텍처 | AppQueueManager | AppQueueManager 클래스 정의 및 추상화 | `## class AppQueueManager` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[base_app_queue_manager.py](../../../../../../99.archive/dify/api/core/app/apps/base_app_queue_manager.py)
