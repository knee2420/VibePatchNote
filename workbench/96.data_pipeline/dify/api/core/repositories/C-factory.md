---
type: card
title: "Factory"
description: "factory.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/repositories/factory.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `factory.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | OrderConfig | OrderConfig 클래스 정의 및 추상화 | `## class OrderConfig` |
| E2 | 아키텍처 | WorkflowExecutionRepository | WorkflowExecutionRepository 클래스 정의 및 추상화 | `## class WorkflowExecutionRepository` |
| E3 | 아키텍처 | WorkflowNodeExecutionRepository | WorkflowNodeExecutionRepository 클래스 정의 및 추상화 | `## class WorkflowNodeExecutionRepository` |
| E4 | 아키텍처 | RepositoryImportError | RepositoryImportError 클래스 정의 및 추상화 | `## class RepositoryImportError` |
| E5 | 아키텍처 | DifyCoreRepositoryFactory | DifyCoreRepositoryFactory 클래스 정의 및 추상화 | `## class DifyCoreRepositoryFactory` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[factory.py](../../../../../99.archive/dify/api/core/repositories/factory.py)
