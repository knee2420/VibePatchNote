---
type: card
title: "Ssrf Proxy"
description: "ssrf_proxy.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../99.archive/dify/api/core/helper/ssrf_proxy.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `ssrf_proxy.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | MaxRetriesExceededError | MaxRetriesExceededError 클래스 정의 및 추상화 | `## class MaxRetriesExceededError` |
| E2 | 아키텍처 | ResponseLimitError | ResponseLimitError 클래스 정의 및 추상화 | `## class ResponseLimitError` |
| E3 | 아키텍처 | ResponseTooLargeError | ResponseTooLargeError 클래스 정의 및 추상화 | `## class ResponseTooLargeError` |
| E4 | 아키텍처 | UnsupportedResponseEncodingError | UnsupportedResponseEncodingError 클래스 정의 및 추상화 | `## class UnsupportedResponseEncodingError` |
| E5 | 규칙 | _create_proxy_mounts | _create_proxy_mounts 핵심 로직 및 프로시저 | `## def _create_proxy_mounts` |
| E6 | 규칙 | _build_ssrf_client | _build_ssrf_client 핵심 로직 및 프로시저 | `## def _build_ssrf_client` |
| E7 | 규칙 | _get_ssrf_client | _get_ssrf_client 핵심 로직 및 프로시저 | `## def _get_ssrf_client` |
| E8 | 규칙 | _get_user_provided_host_header | _get_user_provided_host_header 핵심 로직 및 프로시저 | `## def _get_user_provided_host_header` |
| E9 | 규칙 | _inject_trace_headers | _inject_trace_headers 핵심 로직 및 프로시저 | `## def _inject_trace_headers` |
| E10 | 규칙 | make_request | make_request 핵심 로직 및 프로시저 | `## def make_request` |
| E11 | 규칙 | buffer_response | buffer_response 핵심 로직 및 프로시저 | `## def buffer_response` |
| E12 | 규칙 | get | get 핵심 로직 및 프로시저 | `## def get` |
| E13 | 규칙 | post | post 핵심 로직 및 프로시저 | `## def post` |
| E14 | 규칙 | put | put 핵심 로직 및 프로시저 | `## def put` |
| E15 | 규칙 | patch | patch 핵심 로직 및 프로시저 | `## def patch` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[ssrf_proxy.py](../../../../../99.archive/dify/api/core/helper/ssrf_proxy.py)
