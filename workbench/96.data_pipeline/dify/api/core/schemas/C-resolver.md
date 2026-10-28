---
type: card
title: "Resolver"
description: "resolver.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/schemas/resolver.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `resolver.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | SchemaResolutionError | SchemaResolutionError 클래스 정의 및 추상화 | `## class SchemaResolutionError` |
| E2 | 아키텍처 | CircularReferenceError | CircularReferenceError 클래스 정의 및 추상화 | `## class CircularReferenceError` |
| E3 | 아키텍처 | MaxDepthExceededError | MaxDepthExceededError 클래스 정의 및 추상화 | `## class MaxDepthExceededError` |
| E4 | 아키텍처 | SchemaNotFoundError | SchemaNotFoundError 클래스 정의 및 추상화 | `## class SchemaNotFoundError` |
| E5 | 아키텍처 | QueueItem | QueueItem 클래스 정의 및 추상화 | `## class QueueItem` |
| E6 | 아키텍처 | SchemaResolver | SchemaResolver 클래스 정의 및 추상화 | `## class SchemaResolver` |
| E7 | 규칙 | resolve_dify_schema_refs | resolve_dify_schema_refs 핵심 로직 및 프로시저 | `## def resolve_dify_schema_refs` |
| E8 | 규칙 | _remove_metadata_fields | _remove_metadata_fields 핵심 로직 및 프로시저 | `## def _remove_metadata_fields` |
| E9 | 규칙 | _is_dify_schema_ref | _is_dify_schema_ref 핵심 로직 및 프로시저 | `## def _is_dify_schema_ref` |
| E10 | 규칙 | _has_dify_refs_recursive | _has_dify_refs_recursive 핵심 로직 및 프로시저 | `## def _has_dify_refs_recursive` |
| E11 | 규칙 | _has_dify_refs_hybrid | _has_dify_refs_hybrid 핵심 로직 및 프로시저 | `## def _has_dify_refs_hybrid` |
| E12 | 규칙 | _has_dify_refs | _has_dify_refs 핵심 로직 및 프로시저 | `## def _has_dify_refs` |
| E13 | 규칙 | parse_dify_schema_uri | parse_dify_schema_uri 핵심 로직 및 프로시저 | `## def parse_dify_schema_uri` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[resolver.py](../../../../../99.archive/dify/api/core/schemas/resolver.py)
