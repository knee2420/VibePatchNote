---
type: card
title: "App Generator"
description: "app_generator.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../../99.archive/dify/api/core/app/apps/agent_app/app_generator.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `app_generator.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | _append_prompt_file_mappings | _append_prompt_file_mappings 핵심 로직 및 프로시저 | `## def _append_prompt_file_mappings` |
| E2 | 규칙 | _prompt_file_locators | _prompt_file_locators 핵심 로직 및 프로시저 | `## def _prompt_file_locators` |
| E3 | 규칙 | _prompt_file_locator | _prompt_file_locator 핵심 로직 및 프로시저 | `## def _prompt_file_locator` |
| E4 | 규칙 | _canonical_file_reference | _canonical_file_reference 핵심 로직 및 프로시저 | `## def _canonical_file_reference` |
| E5 | 규칙 | _string_value | _string_value 핵심 로직 및 프로시저 | `## def _string_value` |
| E6 | 아키텍처 | AgentAppGenerator | AgentAppGenerator 클래스 정의 및 추상화 | `## class AgentAppGenerator` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[app_generator.py](../../../../../../../99.archive/dify/api/core/app/apps/agent_app/app_generator.py)
