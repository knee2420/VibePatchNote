---
type: card
title: "Streamable Client"
description: "streamable_client.py 모듈의 1:1 매핑 지식 카드"
resource: "../../../../../../99.archive/dify/api/core/mcp/client/streamable_client.py"
timestamp: "2026-09-02"
---

# summary
이 카드는 `streamable_client.py` 원문의 핵심 아키텍처와 인터페이스를 1:1로 매핑하여 캡슐화한다. 원문의 클래스와 함수 구조를 분석하여 요소화했다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | StreamableHTTPError | StreamableHTTPError 클래스 정의 및 추상화 | `## class StreamableHTTPError` |
| E2 | 아키텍처 | ResumptionError | ResumptionError 클래스 정의 및 추상화 | `## class ResumptionError` |
| E3 | 아키텍처 | RequestContext | RequestContext 클래스 정의 및 추상화 | `## class RequestContext` |
| E4 | 아키텍처 | StreamableHTTPTransport | StreamableHTTPTransport 클래스 정의 및 추상화 | `## class StreamableHTTPTransport` |
| E5 | 규칙 | streamablehttp_client | streamablehttp_client 핵심 로직 및 프로시저 | `## def streamablehttp_client` |

# 밖으로
- ⚠️ 이 카드는 기계적으로 1:1 매핑된 뼈대 카드이며, 상세 맥락은 원문을 참조.

# 원문
[streamable_client.py](../../../../../../99.archive/dify/api/core/mcp/client/streamable_client.py)
