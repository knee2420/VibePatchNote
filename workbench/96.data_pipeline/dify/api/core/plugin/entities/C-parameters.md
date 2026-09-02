---
type: card
title: "Parameters"
description: "parameters.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/plugin/entities/parameters.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `parameters.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | PluginParameterOption | PluginParameterOption 클래스 정의 및 추상화 | `## class PluginParameterOption` |
| E2 | 아키텍처 | PluginParameterType | PluginParameterType 클래스 정의 및 추상화 | `## class PluginParameterType` |
| E3 | 아키텍처 | MCPServerParameterType | MCPServerParameterType 클래스 정의 및 추상화 | `## class MCPServerParameterType` |
| E4 | 아키텍처 | PluginParameterAutoGenerateType | PluginParameterAutoGenerateType 클래스 정의 및 추상화 | `## class PluginParameterAutoGenerateType` |
| E5 | 아키텍처 | PluginParameterAutoGenerate | PluginParameterAutoGenerate 클래스 정의 및 추상화 | `## class PluginParameterAutoGenerate` |
| E6 | 아키텍처 | PluginParameterTemplate | PluginParameterTemplate 클래스 정의 및 추상화 | `## class PluginParameterTemplate` |
| E7 | 아키텍처 | PluginParameter | PluginParameter 클래스 정의 및 추상화 | `## class PluginParameter` |
| E8 | 규칙 | as_normal_type | as_normal_type 핵심 로직 및 프로시저 | `## def as_normal_type` |
| E9 | 규칙 | _validate_date | _validate_date 핵심 로직 및 프로시저 | `## def _validate_date` |
| E10 | 규칙 | cast_parameter_value | cast_parameter_value 핵심 로직 및 프로시저 | `## def cast_parameter_value` |
| E11 | 규칙 | init_frontend_parameter | init_frontend_parameter 핵심 로직 및 프로시저 | `## def init_frontend_parameter` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[parameters.py](../../../../../../99.archive/dify/api/core/plugin/entities/parameters.py)
