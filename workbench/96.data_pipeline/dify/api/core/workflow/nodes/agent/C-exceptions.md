---
type: card
title: "Exceptions"
description: "exceptions.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/agent/exceptions.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `exceptions.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | AgentNodeError | AgentNodeError 클래스 정의 및 추상화 | `## class AgentNodeError` |
| E2 | 아키텍처 | AgentStrategyError | AgentStrategyError 클래스 정의 및 추상화 | `## class AgentStrategyError` |
| E3 | 아키텍처 | AgentStrategyNotFoundError | AgentStrategyNotFoundError 클래스 정의 및 추상화 | `## class AgentStrategyNotFoundError` |
| E4 | 아키텍처 | AgentInvocationError | AgentInvocationError 클래스 정의 및 추상화 | `## class AgentInvocationError` |
| E5 | 아키텍처 | AgentParameterError | AgentParameterError 클래스 정의 및 추상화 | `## class AgentParameterError` |
| E6 | 아키텍처 | AgentVariableError | AgentVariableError 클래스 정의 및 추상화 | `## class AgentVariableError` |
| E7 | 아키텍처 | AgentVariableNotFoundError | AgentVariableNotFoundError 클래스 정의 및 추상화 | `## class AgentVariableNotFoundError` |
| E8 | 아키텍처 | AgentInputTypeError | AgentInputTypeError 클래스 정의 및 추상화 | `## class AgentInputTypeError` |
| E9 | 아키텍처 | ToolFileError | ToolFileError 클래스 정의 및 추상화 | `## class ToolFileError` |
| E10 | 아키텍처 | ToolFileNotFoundError | ToolFileNotFoundError 클래스 정의 및 추상화 | `## class ToolFileNotFoundError` |
| E11 | 아키텍처 | AgentMessageTransformError | AgentMessageTransformError 클래스 정의 및 추상화 | `## class AgentMessageTransformError` |
| E12 | 아키텍처 | AgentModelError | AgentModelError 클래스 정의 및 추상화 | `## class AgentModelError` |
| E13 | 아키텍처 | AgentMemoryError | AgentMemoryError 클래스 정의 및 추상화 | `## class AgentMemoryError` |
| E14 | 아키텍처 | AgentVariableTypeError | AgentVariableTypeError 클래스 정의 및 추상화 | `## class AgentVariableTypeError` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[exceptions.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/agent/exceptions.py)
