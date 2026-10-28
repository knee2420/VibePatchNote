---
type: card
title: "Tool Entities"
description: "tool_entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/tools/entities/tool_entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `tool_entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | EmojiIconDict | EmojiIconDict 클래스 정의 및 추상화 | `## class EmojiIconDict` |
| E2 | 아키텍처 | ToolLabelEnum | ToolLabelEnum 클래스 정의 및 추상화 | `## class ToolLabelEnum` |
| E3 | 아키텍처 | ToolProviderType | ToolProviderType 클래스 정의 및 추상화 | `## class ToolProviderType` |
| E4 | 아키텍처 | ApiProviderSchemaType | ApiProviderSchemaType 클래스 정의 및 추상화 | `## class ApiProviderSchemaType` |
| E5 | 아키텍처 | ApiProviderAuthType | ApiProviderAuthType 클래스 정의 및 추상화 | `## class ApiProviderAuthType` |
| E6 | 아키텍처 | ToolInvokeMessage | ToolInvokeMessage 클래스 정의 및 추상화 | `## class ToolInvokeMessage` |
| E7 | 아키텍처 | ToolInvokeMessageBinary | ToolInvokeMessageBinary 클래스 정의 및 추상화 | `## class ToolInvokeMessageBinary` |
| E8 | 아키텍처 | ToolParameter | ToolParameter 클래스 정의 및 추상화 | `## class ToolParameter` |
| E9 | 아키텍처 | ToolProviderIdentity | ToolProviderIdentity 클래스 정의 및 추상화 | `## class ToolProviderIdentity` |
| E10 | 아키텍처 | ToolIdentity | ToolIdentity 클래스 정의 및 추상화 | `## class ToolIdentity` |
| E11 | 아키텍처 | ToolDescription | ToolDescription 클래스 정의 및 추상화 | `## class ToolDescription` |
| E12 | 아키텍처 | ToolEntity | ToolEntity 클래스 정의 및 추상화 | `## class ToolEntity` |
| E13 | 아키텍처 | ToolProviderEntity | ToolProviderEntity 클래스 정의 및 추상화 | `## class ToolProviderEntity` |
| E14 | 아키텍처 | ToolProviderEntityWithPlugin | ToolProviderEntityWithPlugin 클래스 정의 및 추상화 | `## class ToolProviderEntityWithPlugin` |
| E15 | 아키텍처 | WorkflowToolParameterConfiguration | WorkflowToolParameterConfiguration 클래스 정의 및 추상화 | `## class WorkflowToolParameterConfiguration` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[tool_entities.py](../../../../../../99.archive/dify/api/core/tools/entities/tool_entities.py)
