---
type: card
title: "Provider Entities"
description: "provider_entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/entities/provider_entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `provider_entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ProviderQuotaType | ProviderQuotaType 클래스 정의 및 추상화 | `## class ProviderQuotaType` |
| E2 | 아키텍처 | QuotaUnit | QuotaUnit 클래스 정의 및 추상화 | `## class QuotaUnit` |
| E3 | 아키텍처 | SystemConfigurationStatus | SystemConfigurationStatus 클래스 정의 및 추상화 | `## class SystemConfigurationStatus` |
| E4 | 아키텍처 | RestrictModel | RestrictModel 클래스 정의 및 추상화 | `## class RestrictModel` |
| E5 | 아키텍처 | QuotaConfiguration | QuotaConfiguration 클래스 정의 및 추상화 | `## class QuotaConfiguration` |
| E6 | 아키텍처 | CredentialConfiguration | CredentialConfiguration 클래스 정의 및 추상화 | `## class CredentialConfiguration` |
| E7 | 아키텍처 | SystemConfiguration | SystemConfiguration 클래스 정의 및 추상화 | `## class SystemConfiguration` |
| E8 | 아키텍처 | CustomProviderConfiguration | CustomProviderConfiguration 클래스 정의 및 추상화 | `## class CustomProviderConfiguration` |
| E9 | 아키텍처 | CustomModelConfiguration | CustomModelConfiguration 클래스 정의 및 추상화 | `## class CustomModelConfiguration` |
| E10 | 아키텍처 | UnaddedModelConfiguration | UnaddedModelConfiguration 클래스 정의 및 추상화 | `## class UnaddedModelConfiguration` |
| E11 | 아키텍처 | CustomConfiguration | CustomConfiguration 클래스 정의 및 추상화 | `## class CustomConfiguration` |
| E12 | 아키텍처 | ModelLoadBalancingConfiguration | ModelLoadBalancingConfiguration 클래스 정의 및 추상화 | `## class ModelLoadBalancingConfiguration` |
| E13 | 아키텍처 | ModelSettings | ModelSettings 클래스 정의 및 추상화 | `## class ModelSettings` |
| E14 | 아키텍처 | ProviderConfigType | ProviderConfigType 클래스 정의 및 추상화 | `## class ProviderConfigType` |
| E15 | 아키텍처 | BasicProviderConfig | BasicProviderConfig 클래스 정의 및 추상화 | `## class BasicProviderConfig` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[provider_entities.py](../../../../../99.archive/dify/api/core/entities/provider_entities.py)
