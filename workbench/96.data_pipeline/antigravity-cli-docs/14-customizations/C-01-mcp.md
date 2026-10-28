---
type: card
title: "MCP"
description: "MCP 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/14-customizations/01-mcp.md"
timestamp: "2026-09-07"
---

# summary
MCP의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Antigravity supports the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), an open standard that lets AI agents and editors securely connect to local developer to...

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Model Context Protocol (MCP) | Antigravity supports the Model Context Protocol (MCP), an open standard that lets AI agents and editors securely conn... | `# Model Context Protocol (MCP)` |
| E2 | 원칙 | What is MCP? | MCP acts as a universal bridge between Antigravity and your broader development environment. Instead of manually copy... | `## What is MCP?` |
| E3 | 원칙 | Add Context | With MCP, Antigravity can use live data from connected MCP servers to inform its reasoning and suggestions: - When wr... | `### Add Context` |
| E4 | 원칙 | Add Custom Tools | With MCP, Antigravity can execute specific, safe actions defined by your connected servers: - Create a Linear issue f... | `### Add Custom Tools` |
| E5 | 원칙 | Antigravity 2.0 | In Antigravity 2.0, you can manage your MCP servers through the **Installed MCP Servers** section of your **Settings*... | `## Antigravity 2.0` |
| E6 | 원칙 | Antigravity IDE | In Antigravity IDE, the easiest way to manage MCP servers is through the built-in MCP Store. In the MCP Store, you ca... | `## Antigravity IDE` |
| E7 | 도구 | Antigravity CLI | Antigravity CLI supports both local `stdio` processes and remote host MCP server configurations. The simplest path to... | `## Antigravity CLI` |
| E8 | 원칙 | Interactive MCP Manager | Type `/mcp` inside the prompt panel and press `Enter` to open the interactive **MCP Manager Overlay**. This panel let... | `### Interactive MCP Manager` |
| E9 | 인터페이스 | Global and Workspace Server Configs | Unlike legacy setups, Antigravity CLI separates MCP definitions into dedicated, sparse configurations: - **Global ser... | `### Global and Workspace Server Configs` |
| E10 | 코드 | Antigravity SDK | In Python applications built using the Antigravity SDK, MCP servers (`stdio`, `SSE`, or `HTTP`) can be connected prog... | `## Antigravity SDK` |
| E11 | 인터페이스 | MCP Configuration Structure | Whether configuring custom servers for Antigravity 2.0, Antigravity IDE, or Antigravity CLI, the configuration file f... | `## MCP Configuration Structure` |
| E12 | 인터페이스 | MCP Configuration Properties | Each server entry under `mcpServers` supports the following properties: **Transport (one required):** | `### MCP Configuration Properties` |
| E13 | 원칙 | MCP Authentication | Connected MCP servers can securely authenticate against external services using built-in Google credentials, automati... | `## MCP Authentication` |
| E14 | 코드 | Google Credentials | Set `authProviderType` to `"google_credentials"` to use Google Application Default Credentials (ADC). This requires A... | `### Google Credentials` |
| E15 | 코드 | OAuth | Antigravity can automatically handle OAuth for servers that support dynamic client registration (DCR). For these serv... | `### OAuth` |
| E16 | 코드 | Custom Headers | For remote servers that require custom HTTP headers (e.g. API keys or bearer tokens), add them to the `headers` objec... | `### Custom Headers` |
| E17 | 규칙 | MCP Permissions and Access Control | Access to Model Context Protocol tools and resources is governed by Antigravity's permissions system. By default, unc... | `## MCP Permissions and Access Control` |
| E18 | 원칙 | Supported MCP Servers | The MCP Store features direct integrations for a wide variety of developer platforms, databases, and productivity ser... | `## Supported MCP Servers` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[01-mcp.md](../../../99.archive/antigravity-cli-docs/14-customizations/01-mcp.md) · [공식 사이트](https://antigravity.google/docs/cli/mcp/)
