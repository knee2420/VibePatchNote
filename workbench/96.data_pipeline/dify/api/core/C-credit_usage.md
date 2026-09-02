---
type: card
title: "Credit Usage"
description: "credit_usage.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../99.archive/dify/api/core/credit_usage.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `credit_usage.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | CreditUsageCreatedBy | CreditUsageCreatedBy 클래스 정의 및 추상화 | `## class CreditUsageCreatedBy` |
| E2 | 아키텍처 | CreditUsageAppType | CreditUsageAppType 클래스 정의 및 추상화 | `## class CreditUsageAppType` |
| E3 | 규칙 | normalize_credit_usage_created_by | normalize_credit_usage_created_by 핵심 로직 및 프로시저 | `## def normalize_credit_usage_created_by` |
| E4 | 규칙 | normalize_credit_usage_app_type | normalize_credit_usage_app_type 핵심 로직 및 프로시저 | `## def normalize_credit_usage_app_type` |
| E5 | 규칙 | created_by_from_app_type | created_by_from_app_type 핵심 로직 및 프로시저 | `## def created_by_from_app_type` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[credit_usage.py](../../../../99.archive/dify/api/core/credit_usage.py)
