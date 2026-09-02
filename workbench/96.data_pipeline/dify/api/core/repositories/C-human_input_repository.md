---
type: card
title: "Human Input Repository"
description: "human_input_repository.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/repositories/human_input_repository.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `human_input_repository.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | _DeliveryAndRecipients | _DeliveryAndRecipients 클래스 정의 및 추상화 | `## class _DeliveryAndRecipients` |
| E2 | 아키텍처 | _WorkspaceMemberInfo | _WorkspaceMemberInfo 클래스 정의 및 추상화 | `## class _WorkspaceMemberInfo` |
| E3 | 아키텍처 | FormNotFoundError | FormNotFoundError 클래스 정의 및 추상화 | `## class FormNotFoundError` |
| E4 | 아키텍처 | FormCreateParams | FormCreateParams 클래스 정의 및 추상화 | `## class FormCreateParams` |
| E5 | 아키텍처 | HumanInputFormRecipientEntity | HumanInputFormRecipientEntity 클래스 정의 및 추상화 | `## class HumanInputFormRecipientEntity` |
| E6 | 아키텍처 | HumanInputFormEntity | HumanInputFormEntity 클래스 정의 및 추상화 | `## class HumanInputFormEntity` |
| E7 | 아키텍처 | HumanInputFormRepository | HumanInputFormRepository 클래스 정의 및 추상화 | `## class HumanInputFormRepository` |
| E8 | 아키텍처 | _HumanInputFormRecipientEntityImpl | _HumanInputFormRecipientEntityImpl 클래스 정의 및 추상화 | `## class _HumanInputFormRecipientEntityImpl` |
| E9 | 아키텍처 | _HumanInputFormEntityImpl | _HumanInputFormEntityImpl 클래스 정의 및 추상화 | `## class _HumanInputFormEntityImpl` |
| E10 | 아키텍처 | HumanInputFormRecord | HumanInputFormRecord 클래스 정의 및 추상화 | `## class HumanInputFormRecord` |
| E11 | 아키텍처 | _InvalidTimeoutStatusError | _InvalidTimeoutStatusError 클래스 정의 및 추상화 | `## class _InvalidTimeoutStatusError` |
| E12 | 아키텍처 | HumanInputFormRepositoryImpl | HumanInputFormRepositoryImpl 클래스 정의 및 추상화 | `## class HumanInputFormRepositoryImpl` |
| E13 | 아키텍처 | HumanInputFormSubmissionRepository | HumanInputFormSubmissionRepository 클래스 정의 및 추상화 | `## class HumanInputFormSubmissionRepository` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[human_input_repository.py](../../../../../99.archive/dify/api/core/repositories/human_input_repository.py)
