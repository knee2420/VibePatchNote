---
type: card
title: "Errors"
description: "errors.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/datasource/errors.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `errors.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | DatasourceProviderNotFoundError | DatasourceProviderNotFoundError 클래스 정의 및 추상화 | `## class DatasourceProviderNotFoundError` |
| E2 | 아키텍처 | DatasourceNotFoundError | DatasourceNotFoundError 클래스 정의 및 추상화 | `## class DatasourceNotFoundError` |
| E3 | 아키텍처 | DatasourceParameterValidationError | DatasourceParameterValidationError 클래스 정의 및 추상화 | `## class DatasourceParameterValidationError` |
| E4 | 아키텍처 | DatasourceProviderCredentialValidationError | DatasourceProviderCredentialValidationError 클래스 정의 및 추상화 | `## class DatasourceProviderCredentialValidationError` |
| E5 | 아키텍처 | DatasourceNotSupportedError | DatasourceNotSupportedError 클래스 정의 및 추상화 | `## class DatasourceNotSupportedError` |
| E6 | 아키텍처 | DatasourceInvokeError | DatasourceInvokeError 클래스 정의 및 추상화 | `## class DatasourceInvokeError` |
| E7 | 아키텍처 | DatasourceApiSchemaError | DatasourceApiSchemaError 클래스 정의 및 추상화 | `## class DatasourceApiSchemaError` |
| E8 | 아키텍처 | DatasourceEngineInvokeError | DatasourceEngineInvokeError 클래스 정의 및 추상화 | `## class DatasourceEngineInvokeError` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[errors.py](../../../../../99.archive/dify/api/core/datasource/errors.py)
