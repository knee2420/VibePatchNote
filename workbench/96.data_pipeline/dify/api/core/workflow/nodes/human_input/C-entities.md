---
type: card
title: "Entities"
description: "entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/workflow/nodes/human_input/entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | StringSource | StringSource 클래스 정의 및 추상화 | `## class StringSource` |
| E2 | 아키텍처 | StringListSource | StringListSource 클래스 정의 및 추상화 | `## class StringListSource` |
| E3 | 아키텍처 | BaseInputConfig | BaseInputConfig 클래스 정의 및 추상화 | `## class BaseInputConfig` |
| E4 | 아키텍처 | ParagraphInputConfig | ParagraphInputConfig 클래스 정의 및 추상화 | `## class ParagraphInputConfig` |
| E5 | 아키텍처 | SelectInputConfig | SelectInputConfig 클래스 정의 및 추상화 | `## class SelectInputConfig` |
| E6 | 아키텍처 | _FileInputCommonConfig | _FileInputCommonConfig 클래스 정의 및 추상화 | `## class _FileInputCommonConfig` |
| E7 | 아키텍처 | FileInputConfig | FileInputConfig 클래스 정의 및 추상화 | `## class FileInputConfig` |
| E8 | 아키텍처 | FileListInputConfig | FileListInputConfig 클래스 정의 및 추상화 | `## class FileListInputConfig` |
| E9 | 아키텍처 | UserActionConfig | UserActionConfig 클래스 정의 및 추상화 | `## class UserActionConfig` |
| E10 | 아키텍처 | HumanInputNodeData | HumanInputNodeData 클래스 정의 및 추상화 | `## class HumanInputNodeData` |
| E11 | 아키텍처 | FormDefinition | FormDefinition 클래스 정의 및 추상화 | `## class FormDefinition` |
| E12 | 아키텍처 | HumanInputSubmissionValidationError | HumanInputSubmissionValidationError 클래스 정의 및 추상화 | `## class HumanInputSubmissionValidationError` |
| E13 | 규칙 | validate_human_input_submission | validate_human_input_submission 핵심 로직 및 프로시저 | `## def validate_human_input_submission` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[entities.py](../../../../../../../99.archive/dify/api/core/workflow/nodes/human_input/entities.py)
