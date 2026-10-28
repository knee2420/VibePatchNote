---
type: card
title: "Runner"
description: "runner.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/workflow/generator/runner.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `runner.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | _node_builder_max_workers | _node_builder_max_workers 핵심 로직 및 프로시저 | `## def _node_builder_max_workers` |
| E2 | 아키텍처 | _StageJSONError | _StageJSONError 클래스 정의 및 추상화 | `## class _StageJSONError` |
| E3 | 아키텍처 | _StageSchemaError | _StageSchemaError 클래스 정의 및 추상화 | `## class _StageSchemaError` |
| E4 | 규칙 | _err | _err 핵심 로직 및 프로시저 | `## def _err` |
| E5 | 규칙 | _errors_to_str | _errors_to_str 핵심 로직 및 프로시저 | `## def _errors_to_str` |
| E6 | 규칙 | _empty_result | _empty_result 핵심 로직 및 프로시저 | `## def _empty_result` |
| E7 | 규칙 | _result_with_errors | _result_with_errors 핵심 로직 및 프로시저 | `## def _result_with_errors` |
| E8 | 규칙 | _with_mode | _with_mode 핵심 로직 및 프로시저 | `## def _with_mode` |
| E9 | 규칙 | _fallback_mode | _fallback_mode 핵심 로직 및 프로시저 | `## def _fallback_mode` |
| E10 | 규칙 | _planner_prompt_mode | _planner_prompt_mode 핵심 로직 및 프로시저 | `## def _planner_prompt_mode` |
| E11 | 규칙 | _resolve_generation_mode | _resolve_generation_mode 핵심 로직 및 프로시저 | `## def _resolve_generation_mode` |
| E12 | 규칙 | _build_plan_event | _build_plan_event 핵심 로직 및 프로시저 | `## def _build_plan_event` |
| E13 | 규칙 | _find_planned_tool_entry | _find_planned_tool_entry 핵심 로직 및 프로시저 | `## def _find_planned_tool_entry` |
| E14 | 규칙 | _stage_error_to_envelope_code | _stage_error_to_envelope_code 핵심 로직 및 프로시저 | `## def _stage_error_to_envelope_code` |
| E15 | 아키텍처 | WorkflowGenerator | WorkflowGenerator 클래스 정의 및 추상화 | `## class WorkflowGenerator` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[runner.py](../../../../../../99.archive/dify/api/core/workflow/generator/runner.py)
