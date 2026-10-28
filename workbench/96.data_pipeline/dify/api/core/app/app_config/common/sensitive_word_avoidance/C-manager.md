---
type: card
title: "Manager"
description: "manager.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../../99.archive/dify/api/core/app/app_config/common/sensitive_word_avoidance/manager.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `manager.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | SensitiveWordAvoidanceDisabledConfig | SensitiveWordAvoidanceDisabledConfig 클래스 정의 및 추상화 | `## class SensitiveWordAvoidanceDisabledConfig` |
| E2 | 아키텍처 | SensitiveWordAvoidanceKeywordsConfig | SensitiveWordAvoidanceKeywordsConfig 클래스 정의 및 추상화 | `## class SensitiveWordAvoidanceKeywordsConfig` |
| E3 | 아키텍처 | SensitiveWordAvoidanceOpenAIConfig | SensitiveWordAvoidanceOpenAIConfig 클래스 정의 및 추상화 | `## class SensitiveWordAvoidanceOpenAIConfig` |
| E4 | 아키텍처 | SensitiveWordAvoidanceAPIConfig | SensitiveWordAvoidanceAPIConfig 클래스 정의 및 추상화 | `## class SensitiveWordAvoidanceAPIConfig` |
| E5 | 규칙 | _normalize_raw | _normalize_raw 핵심 로직 및 프로시저 | `## def _normalize_raw` |
| E6 | 아키텍처 | SensitiveWordAvoidanceConfigManager | SensitiveWordAvoidanceConfigManager 클래스 정의 및 추상화 | `## class SensitiveWordAvoidanceConfigManager` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[manager.py](../../../../../../../../99.archive/dify/api/core/app/app_config/common/sensitive_word_avoidance/manager.py)
