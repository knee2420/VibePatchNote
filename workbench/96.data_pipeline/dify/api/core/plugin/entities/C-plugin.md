---
type: card
title: "Plugin"
description: "plugin.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/plugin/entities/plugin.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `plugin.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | PluginInstallationSource | PluginInstallationSource 클래스 정의 및 추상화 | `## class PluginInstallationSource` |
| E2 | 아키텍처 | PluginResourceRequirements | PluginResourceRequirements 클래스 정의 및 추상화 | `## class PluginResourceRequirements` |
| E3 | 아키텍처 | PluginCategory | PluginCategory 클래스 정의 및 추상화 | `## class PluginCategory` |
| E4 | 아키텍처 | PluginDeclaration | PluginDeclaration 클래스 정의 및 추상화 | `## class PluginDeclaration` |
| E5 | 아키텍처 | PluginInstallation | PluginInstallation 클래스 정의 및 추상화 | `## class PluginInstallation` |
| E6 | 아키텍처 | PluginEntity | PluginEntity 클래스 정의 및 추상화 | `## class PluginEntity` |
| E7 | 아키텍처 | PluginDependencyType | PluginDependencyType 클래스 정의 및 추상화 | `## class PluginDependencyType` |
| E8 | 아키텍처 | PluginDependency | PluginDependency 클래스 정의 및 추상화 | `## class PluginDependency` |
| E9 | 아키텍처 | MissingPluginDependency | MissingPluginDependency 클래스 정의 및 추상화 | `## class MissingPluginDependency` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[plugin.py](../../../../../../99.archive/dify/api/core/plugin/entities/plugin.py)
