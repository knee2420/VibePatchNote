---
type: card
title: "Provider Manager (공급자 및 테넌트 관리)"
description: "테넌트(Tenant)별 모델 공급자 설정, 할당량, 로드 밸런싱 환경을 조립하여 반환하는 매니저"
resource: "../../../../99.archive/dify/api/core/provider_manager.py"
timestamp: "2026-09-02"
---

# summary
요청이 들어왔을 때, 해당 테넌트(사용자 그룹)가 **어떤 모델(System/Custom)을 우선적으로 사용할지 결정하고, 캐싱된 DB 설정(Credentials, Quota)을 조립(Assembly)하여 ProviderConfigurations 객체로 반환**한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | ProviderConfigurationCacheSource | Redis 캐시를 통해 모델 벤더, 자격 증명, 설정값 등을 로드하는 열거형 소스 | `## class ProviderConfigurationCacheSource` |
| E2 | 데이터 | ProviderConfigurations 조립 | 테넌트 ID를 기반으로 호스팅/커스텀 설정, 쿼터 상태, 로드 밸런싱 설정을 전부 긁어모아 객체화 | `## def get_configurations` |
| E3 | 규칙 | Preferred Provider 판단 로직 | System 제공 모델과 Custom 등록 모델 중 어떤 것을 우선할지(Fallback 포함) 결정하는 분기 처리 | `## if preferred_provider_type == ProviderType.SYSTEM:` |
| E4 | 최적화 | Redis 기반 DB 캐싱 | 매번 모델 호출 시 DB 조회를 막기 위해 `_ProviderConfigurationSourceCache`를 사용해 조회 및 무효화(Invalidate) | `## class _ProviderConfigurationSourceCache:` |

# 밖으로
- [E2] 이 매니저에서 조립된 `ProviderConfigurations`를 바탕으로 `[C-model_manager](C-model_manager.md)`가 실제 인스턴스를 생성한다.

# 원문
[provider_manager.py 원본](../../../../99.archive/dify/api/core/provider_manager.py)
