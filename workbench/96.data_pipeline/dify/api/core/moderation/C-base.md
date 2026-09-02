---
type: card
title: "Base"
description: "base.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/moderation/base.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `base.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ModerationAction | ModerationAction 클래스 정의 및 추상화 | `## class ModerationAction` |
| E2 | 아키텍처 | ModerationInputsResult | ModerationInputsResult 클래스 정의 및 추상화 | `## class ModerationInputsResult` |
| E3 | 아키텍처 | ModerationOutputsResult | ModerationOutputsResult 클래스 정의 및 추상화 | `## class ModerationOutputsResult` |
| E4 | 아키텍처 | Moderation | Moderation 클래스 정의 및 추상화 | `## class Moderation` |
| E5 | 아키텍처 | ModerationError | ModerationError 클래스 정의 및 추상화 | `## class ModerationError` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[base.py](../../../../../99.archive/dify/api/core/moderation/base.py)
