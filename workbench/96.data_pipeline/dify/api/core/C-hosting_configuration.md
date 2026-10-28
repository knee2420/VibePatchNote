---
type: card
title: "Hosting Configuration"
description: "hosting_configuration.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../99.archive/dify/api/core/hosting_configuration.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `hosting_configuration.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | HostingQuota | HostingQuota 클래스 정의 및 추상화 | `## class HostingQuota` |
| E2 | 아키텍처 | TrialHostingQuota | TrialHostingQuota 클래스 정의 및 추상화 | `## class TrialHostingQuota` |
| E3 | 아키텍처 | PaidHostingQuota | PaidHostingQuota 클래스 정의 및 추상화 | `## class PaidHostingQuota` |
| E4 | 아키텍처 | FreeHostingQuota | FreeHostingQuota 클래스 정의 및 추상화 | `## class FreeHostingQuota` |
| E5 | 아키텍처 | HostingProvider | HostingProvider 클래스 정의 및 추상화 | `## class HostingProvider` |
| E6 | 아키텍처 | HostedModerationConfig | HostedModerationConfig 클래스 정의 및 추상화 | `## class HostedModerationConfig` |
| E7 | 아키텍처 | HostingConfiguration | HostingConfiguration 클래스 정의 및 추상화 | `## class HostingConfiguration` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[hosting_configuration.py](../../../../99.archive/dify/api/core/hosting_configuration.py)
