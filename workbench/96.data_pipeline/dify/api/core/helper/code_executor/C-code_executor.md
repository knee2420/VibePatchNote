---
type: card
title: "Code Executor"
description: "code_executor.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/helper/code_executor/code_executor.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `code_executor.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | CodeExecutionError | CodeExecutionError 클래스 정의 및 추상화 | `## class CodeExecutionError` |
| E2 | 아키텍처 | CodeExecutionResponse | CodeExecutionResponse 클래스 정의 및 추상화 | `## class CodeExecutionResponse` |
| E3 | 규칙 | _build_code_executor_client | _build_code_executor_client 핵심 로직 및 프로시저 | `## def _build_code_executor_client` |
| E4 | 아키텍처 | CodeExecutor | CodeExecutor 클래스 정의 및 추상화 | `## class CodeExecutor` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[code_executor.py](../../../../../../99.archive/dify/api/core/helper/code_executor/code_executor.py)
