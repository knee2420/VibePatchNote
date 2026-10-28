---
type: card
title: "System Variables"
description: "system_variables.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/workflow/system_variables.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `system_variables.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | SystemVariableKey | SystemVariableKey 클래스 정의 및 추상화 | `## class SystemVariableKey` |
| E2 | 아키텍처 | _VariablePoolReader | _VariablePoolReader 클래스 정의 및 추상화 | `## class _VariablePoolReader` |
| E3 | 아키텍처 | _VariablePoolWriter | _VariablePoolWriter 클래스 정의 및 추상화 | `## class _VariablePoolWriter` |
| E4 | 아키텍처 | _VariableLoader | _VariableLoader 클래스 정의 및 추상화 | `## class _VariableLoader` |
| E5 | 규칙 | system_variable_name | system_variable_name 핵심 로직 및 프로시저 | `## def system_variable_name` |
| E6 | 규칙 | system_variable_selector | system_variable_selector 핵심 로직 및 프로시저 | `## def system_variable_selector` |
| E7 | 규칙 | _normalize_system_variable_values | _normalize_system_variable_values 핵심 로직 및 프로시저 | `## def _normalize_system_variable_values` |
| E8 | 규칙 | build_system_variables | build_system_variables 핵심 로직 및 프로시저 | `## def build_system_variables` |
| E9 | 규칙 | default_system_variables | default_system_variables 핵심 로직 및 프로시저 | `## def default_system_variables` |
| E10 | 규칙 | system_variables_to_mapping | system_variables_to_mapping 핵심 로직 및 프로시저 | `## def system_variables_to_mapping` |
| E11 | 규칙 | _with_selector | _with_selector 핵심 로직 및 프로시저 | `## def _with_selector` |
| E12 | 규칙 | build_bootstrap_variables | build_bootstrap_variables 핵심 로직 및 프로시저 | `## def build_bootstrap_variables` |
| E13 | 규칙 | get_system_segment | get_system_segment 핵심 로직 및 프로시저 | `## def get_system_segment` |
| E14 | 규칙 | get_system_value | get_system_value 핵심 로직 및 프로시저 | `## def get_system_value` |
| E15 | 규칙 | get_system_text | get_system_text 핵심 로직 및 프로시저 | `## def get_system_text` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[system_variables.py](../../../../../99.archive/dify/api/core/workflow/system_variables.py)
