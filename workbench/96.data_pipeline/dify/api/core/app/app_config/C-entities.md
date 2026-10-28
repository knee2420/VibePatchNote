---
type: card
title: "Entities"
description: "entities.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/app/app_config/entities.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `entities.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ModelConfigEntity | ModelConfigEntity 클래스 정의 및 추상화 | `## class ModelConfigEntity` |
| E2 | 아키텍처 | AdvancedChatMessageEntity | AdvancedChatMessageEntity 클래스 정의 및 추상화 | `## class AdvancedChatMessageEntity` |
| E3 | 아키텍처 | AdvancedChatPromptTemplateEntity | AdvancedChatPromptTemplateEntity 클래스 정의 및 추상화 | `## class AdvancedChatPromptTemplateEntity` |
| E4 | 아키텍처 | AdvancedCompletionPromptTemplateEntity | AdvancedCompletionPromptTemplateEntity 클래스 정의 및 추상화 | `## class AdvancedCompletionPromptTemplateEntity` |
| E5 | 아키텍처 | PromptTemplateEntity | PromptTemplateEntity 클래스 정의 및 추상화 | `## class PromptTemplateEntity` |
| E6 | 아키텍처 | RagPipelineVariableEntity | RagPipelineVariableEntity 클래스 정의 및 추상화 | `## class RagPipelineVariableEntity` |
| E7 | 아키텍처 | ExternalDataVariableEntity | ExternalDataVariableEntity 클래스 정의 및 추상화 | `## class ExternalDataVariableEntity` |
| E8 | 아키텍처 | ModelConfig | ModelConfig 클래스 정의 및 추상화 | `## class ModelConfig` |
| E9 | 아키텍처 | DatasetRetrieveConfigEntity | DatasetRetrieveConfigEntity 클래스 정의 및 추상화 | `## class DatasetRetrieveConfigEntity` |
| E10 | 아키텍처 | DatasetEntity | DatasetEntity 클래스 정의 및 추상화 | `## class DatasetEntity` |
| E11 | 아키텍처 | SensitiveWordAvoidanceEntity | SensitiveWordAvoidanceEntity 클래스 정의 및 추상화 | `## class SensitiveWordAvoidanceEntity` |
| E12 | 아키텍처 | TextToSpeechEntity | TextToSpeechEntity 클래스 정의 및 추상화 | `## class TextToSpeechEntity` |
| E13 | 아키텍처 | TracingConfigEntity | TracingConfigEntity 클래스 정의 및 추상화 | `## class TracingConfigEntity` |
| E14 | 아키텍처 | AppAdditionalFeatures | AppAdditionalFeatures 클래스 정의 및 추상화 | `## class AppAdditionalFeatures` |
| E15 | 아키텍처 | AppConfig | AppConfig 클래스 정의 및 추상화 | `## class AppConfig` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[entities.py](../../../../../../99.archive/dify/api/core/app/app_config/entities.py)
