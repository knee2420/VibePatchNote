---
type: card
title: "Provider Encryption"
description: "provider_encryption.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/helper/provider_encryption.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `provider_encryption.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ProviderConfigCache | ProviderConfigCache 클래스 정의 및 추상화 | `## class ProviderConfigCache` |
| E2 | 아키텍처 | ProviderConfigEncrypter | ProviderConfigEncrypter 클래스 정의 및 추상화 | `## class ProviderConfigEncrypter` |
| E3 | 규칙 | create_provider_encrypter | create_provider_encrypter 핵심 로직 및 프로시저 | `## def create_provider_encrypter` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[provider_encryption.py](../../../../../99.archive/dify/api/core/helper/provider_encryption.py)
