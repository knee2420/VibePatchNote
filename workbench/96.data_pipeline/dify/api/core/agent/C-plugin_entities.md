---
type: card
title: "Plugin Entities"
description: "plugin_entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/agent/plugin_entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `plugin_entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | AgentStrategyProviderIdentity | AgentStrategyProviderIdentity 클래스 정의 및 추상화 | `## class AgentStrategyProviderIdentity` |
| E2 | 아키텍처 | AgentStrategyParameter | AgentStrategyParameter 클래스 정의 및 추상화 | `## class AgentStrategyParameter` |
| E3 | 아키텍처 | AgentStrategyProviderEntity | AgentStrategyProviderEntity 클래스 정의 및 추상화 | `## class AgentStrategyProviderEntity` |
| E4 | 아키텍처 | AgentStrategyIdentity | AgentStrategyIdentity 클래스 정의 및 추상화 | `## class AgentStrategyIdentity` |
| E5 | 아키텍처 | AgentFeature | AgentFeature 클래스 정의 및 추상화 | `## class AgentFeature` |
| E6 | 아키텍처 | AgentStrategyEntity | AgentStrategyEntity 클래스 정의 및 추상화 | `## class AgentStrategyEntity` |
| E7 | 아키텍처 | AgentProviderEntityWithPlugin | AgentProviderEntityWithPlugin 클래스 정의 및 추상화 | `## class AgentProviderEntityWithPlugin` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[plugin_entities.py](../../../../../99.archive/dify/api/core/agent/plugin_entities.py)
