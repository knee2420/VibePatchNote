---
type: card
title: "Model Context Protocol (MCP) Integration"
description: "AI 코딩 어시스턴트에게 Kibo UI 컴포넌트 명세와 지식을 직접 주입하는 MCP 프로토콜"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs/mcp.mdx"
timestamp: "2026-09-16"
---

# summary
AI 코딩 어시스턴트에게 Kibo UI 컴포넌트 명세와 지식을 직접 주입하는 MCP 프로토콜를 다루며, Kibo UI의 **설계 원칙과 개발자 경험(DX)을 최적화하기 위한 기술 규약**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | MCP 프로토콜 연동 | AI 에이전트가 Kibo UI 레지스트리를 실시간 탐색하고 컴포넌트를 조립하게 하는 규약 | `## What is MCP?` |
| E2 | 도구 | MCP 서버 설정 | Cursor, Windsurf, Claude Desktop 연동을 위한 JSON 설정 스키마 | `## Configuration` |
| E3 | 사례 | AI 프롬프트 생성 | AI가 컴포넌트 props와 사용법을 정확히 이해하고 올바른 코드를 생성하도록 보장 | `## Features` |

# 밖으로
- [E1] 아키텍처 규칙은 `[C-philosophy.md](C-philosophy.md)`의 합성 가능성 원칙과 결합한다.
- ⚠️ 설정 시 누락된 의존성은 `[C-troubleshooting.md](C-troubleshooting.md)`를 즉시 참조하여 디버깅한다.

# 원문
[mcp.mdx](../../../../../../99.archive/kiboui/apps/docs/content/docs/mcp.mdx) · [kibo-ui.com/docs](https://www.kibo-ui.com/docs)
