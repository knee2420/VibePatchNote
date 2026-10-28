---
type: card
title: "Auth Flow"
description: "auth_flow.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/mcp/auth/auth_flow.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `auth_flow.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | generate_pkce_challenge | generate_pkce_challenge 핵심 로직 및 프로시저 | `## def generate_pkce_challenge` |
| E2 | 규칙 | build_protected_resource_metadata_discovery_urls | build_protected_resource_metadata_discovery_urls 핵심 로직 및 프로시저 | `## def build_protected_resource_metadata_discovery_urls` |
| E3 | 규칙 | build_oauth_authorization_server_metadata_discovery_urls | build_oauth_authorization_server_metadata_discovery_urls 핵심 로직 및 프로시저 | `## def build_oauth_authorization_server_metadata_discovery_urls` |
| E4 | 규칙 | discover_protected_resource_metadata | discover_protected_resource_metadata 핵심 로직 및 프로시저 | `## def discover_protected_resource_metadata` |
| E5 | 규칙 | discover_oauth_authorization_server_metadata | discover_oauth_authorization_server_metadata 핵심 로직 및 프로시저 | `## def discover_oauth_authorization_server_metadata` |
| E6 | 규칙 | get_effective_scope | get_effective_scope 핵심 로직 및 프로시저 | `## def get_effective_scope` |
| E7 | 규칙 | _create_secure_redis_state | _create_secure_redis_state 핵심 로직 및 프로시저 | `## def _create_secure_redis_state` |
| E8 | 규칙 | _retrieve_redis_state | _retrieve_redis_state 핵심 로직 및 프로시저 | `## def _retrieve_redis_state` |
| E9 | 규칙 | handle_callback | handle_callback 핵심 로직 및 프로시저 | `## def handle_callback` |
| E10 | 규칙 | check_support_resource_discovery | check_support_resource_discovery 핵심 로직 및 프로시저 | `## def check_support_resource_discovery` |
| E11 | 규칙 | discover_oauth_metadata | discover_oauth_metadata 핵심 로직 및 프로시저 | `## def discover_oauth_metadata` |
| E12 | 규칙 | start_authorization | start_authorization 핵심 로직 및 프로시저 | `## def start_authorization` |
| E13 | 규칙 | _parse_token_response | _parse_token_response 핵심 로직 및 프로시저 | `## def _parse_token_response` |
| E14 | 규칙 | exchange_authorization | exchange_authorization 핵심 로직 및 프로시저 | `## def exchange_authorization` |
| E15 | 규칙 | refresh_authorization | refresh_authorization 핵심 로직 및 프로시저 | `## def refresh_authorization` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[auth_flow.py](../../../../../../99.archive/dify/api/core/mcp/auth/auth_flow.py)
