---
type: card
title: "Errors"
description: "errors.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/tools/errors.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `errors.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ToolProviderNotFoundError | ToolProviderNotFoundError 클래스 정의 및 추상화 | `## class ToolProviderNotFoundError` |
| E2 | 아키텍처 | ToolNotFoundError | ToolNotFoundError 클래스 정의 및 추상화 | `## class ToolNotFoundError` |
| E3 | 아키텍처 | ToolParameterValidationError | ToolParameterValidationError 클래스 정의 및 추상화 | `## class ToolParameterValidationError` |
| E4 | 아키텍처 | ToolProviderCredentialValidationError | ToolProviderCredentialValidationError 클래스 정의 및 추상화 | `## class ToolProviderCredentialValidationError` |
| E5 | 아키텍처 | ToolNotSupportedError | ToolNotSupportedError 클래스 정의 및 추상화 | `## class ToolNotSupportedError` |
| E6 | 아키텍처 | ToolInvokeError | ToolInvokeError 클래스 정의 및 추상화 | `## class ToolInvokeError` |
| E7 | 아키텍처 | ToolApiSchemaError | ToolApiSchemaError 클래스 정의 및 추상화 | `## class ToolApiSchemaError` |
| E8 | 아키텍처 | ToolSSRFError | ToolSSRFError 클래스 정의 및 추상화 | `## class ToolSSRFError` |
| E9 | 아키텍처 | ToolCredentialPolicyViolationError | ToolCredentialPolicyViolationError 클래스 정의 및 추상화 | `## class ToolCredentialPolicyViolationError` |
| E10 | 아키텍처 | ApiToolProviderNotFoundError | ApiToolProviderNotFoundError 클래스 정의 및 추상화 | `## class ApiToolProviderNotFoundError` |
| E11 | 아키텍처 | WorkflowToolHumanInputNotSupportedError | WorkflowToolHumanInputNotSupportedError 클래스 정의 및 추상화 | `## class WorkflowToolHumanInputNotSupportedError` |
| E12 | 아키텍처 | ToolEngineInvokeError | ToolEngineInvokeError 클래스 정의 및 추상화 | `## class ToolEngineInvokeError` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[errors.py](../../../../../99.archive/dify/api/core/tools/errors.py)
