---
type: card
title: "Tool Catalogue"
description: "tool_catalogue.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/workflow/generator/tool_catalogue.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `tool_catalogue.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ToolCatalogueEntry | ToolCatalogueEntry 클래스 정의 및 추상화 | `## class ToolCatalogueEntry` |
| E2 | 아키텍처 | ToolCapabilityQuery | ToolCapabilityQuery 클래스 정의 및 추상화 | `## class ToolCapabilityQuery` |
| E3 | 아키텍처 | ToolCandidateSelection | ToolCandidateSelection 클래스 정의 및 추상화 | `## class ToolCandidateSelection` |
| E4 | 규칙 | build_tool_catalogue | build_tool_catalogue 핵심 로직 및 프로시저 | `## def build_tool_catalogue` |
| E5 | 규칙 | installed_tool_keys | installed_tool_keys 핵심 로직 및 프로시저 | `## def installed_tool_keys` |
| E6 | 규칙 | format_tool_catalogue | format_tool_catalogue 핵심 로직 및 프로시저 | `## def format_tool_catalogue` |
| E7 | 규칙 | find_tool_entry | find_tool_entry 핵심 로직 및 프로시저 | `## def find_tool_entry` |
| E8 | 규칙 | text_mentions_tool_identifier | text_mentions_tool_identifier 핵심 로직 및 프로시저 | `## def text_mentions_tool_identifier` |
| E9 | 규칙 | select_tool_candidates | select_tool_candidates 핵심 로직 및 프로시저 | `## def select_tool_candidates` |
| E10 | 규칙 | select_legacy_fallback_tools | select_legacy_fallback_tools 핵심 로직 및 프로시저 | `## def select_legacy_fallback_tools` |
| E11 | 규칙 | _find_explicit_tool_keys | _find_explicit_tool_keys 핵심 로직 및 프로시저 | `## def _find_explicit_tool_keys` |
| E12 | 규칙 | _find_current_graph_tool_keys | _find_current_graph_tool_keys 핵심 로직 및 프로시저 | `## def _find_current_graph_tool_keys` |
| E13 | 규칙 | _rank_tools_for_query | _rank_tools_for_query 핵심 로직 및 프로시저 | `## def _rank_tools_for_query` |
| E14 | 규칙 | _normalize_search_text | _normalize_search_text 핵심 로직 및 프로시저 | `## def _normalize_search_text` |
| E15 | 규칙 | _search_tokens | _search_tokens 핵심 로직 및 프로시저 | `## def _search_tokens` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[tool_catalogue.py](../../../../../../99.archive/dify/api/core/workflow/generator/tool_catalogue.py)
