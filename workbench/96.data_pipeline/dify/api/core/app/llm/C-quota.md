---
type: card
title: "Quota"
description: "quota.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/llm/quota.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `quota.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ModelQuotaReservationState | ModelQuotaReservationState 클래스 정의 및 추상화 | `## class ModelQuotaReservationState` |
| E2 | 아키텍처 | ModelQuotaReservation | ModelQuotaReservation 클래스 정의 및 추상화 | `## class ModelQuotaReservation` |
| E3 | 규칙 | _get_provider_configuration | _get_provider_configuration 핵심 로직 및 프로시저 | `## def _get_provider_configuration` |
| E4 | 규칙 | _get_current_quota_configuration | _get_current_quota_configuration 핵심 로직 및 프로시저 | `## def _get_current_quota_configuration` |
| E5 | 규칙 | reserve_model_quota_for_model | reserve_model_quota_for_model 핵심 로직 및 프로시저 | `## def reserve_model_quota_for_model` |
| E6 | 규칙 | reserve_llm_quota_for_model | reserve_llm_quota_for_model 핵심 로직 및 프로시저 | `## def reserve_llm_quota_for_model` |
| E7 | 규칙 | ensure_llm_quota_available_for_model | ensure_llm_quota_available_for_model 핵심 로직 및 프로시저 | `## def ensure_llm_quota_available_for_model` |
| E8 | 규칙 | _resolve_model_used_quota | _resolve_model_used_quota 핵심 로직 및 프로시저 | `## def _resolve_model_used_quota` |
| E9 | 규칙 | _resolve_llm_used_quota | _resolve_llm_used_quota 핵심 로직 및 프로시저 | `## def _resolve_llm_used_quota` |
| E10 | 규칙 | _deduct_free_model_quota | _deduct_free_model_quota 핵심 로직 및 프로시저 | `## def _deduct_free_model_quota` |
| E11 | 규칙 | _deduct_used_model_quota | _deduct_used_model_quota 핵심 로직 및 프로시저 | `## def _deduct_used_model_quota` |
| E12 | 규칙 | deduct_llm_quota_for_model | deduct_llm_quota_for_model 핵심 로직 및 프로시저 | `## def deduct_llm_quota_for_model` |
| E13 | 규칙 | _require_llm_model_instance | _require_llm_model_instance 핵심 로직 및 프로시저 | `## def _require_llm_model_instance` |
| E14 | 규칙 | ensure_llm_quota_available | ensure_llm_quota_available 핵심 로직 및 프로시저 | `## def ensure_llm_quota_available` |
| E15 | 규칙 | deduct_llm_quota | deduct_llm_quota 핵심 로직 및 프로시저 | `## def deduct_llm_quota` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[quota.py](../../../../../../99.archive/dify/api/core/app/llm/quota.py)
