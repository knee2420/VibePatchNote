---
type: card
title: "Background Tasks & Subagents"
description: "Background Tasks & Subagents 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/10-agent-capabilities/03-subagents.md"
timestamp: "2026-09-07"
---

# summary
Background Tasks & Subagents의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Delegate slow builds, multi-file code generation, and research sweeps to parallel background agents while maintaining your active programming flow.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Asynchronous execution model | To maximize developer velocity, Antigravity CLI leverages a multi-threaded asynchronous execution architecture. Inste... | `## Asynchronous execution model` |
| E2 | 원칙 | Managing agents: The `/agents` panel | The active agent-hierarchy and custom agent selection menu are fully transparent and manageable through the interacti... | `## Managing agents: The `/agents` panel` |
| E3 | 원칙 | Opening the panel | Type `/agents` in the prompt and press `Enter` to open the interactive **Agent Manager Panel**. | `### Opening the panel` |
| E4 | 아키텍처 | Panel overview | The panel displays a live checklist of all active, completed, killed, or failed background agents: - **Identifier**: ... | `### Panel overview` |
| E5 | 도구 | Custom Agents (Markdown Format) | In addition to built-in agents, the CLI automatically discovers custom agents defined in Markdown format (`.md`) with... | `## Custom Agents (Markdown Format)` |
| E6 | 원칙 | Deep-dive monitoring | To inspect the inner reasoning, thoughts, and logs of a specific background agent: 1. Open the `/agents` panel and hi... | `## Deep-dive monitoring` |
| E7 | 코드 | Monitoring background tasks with `/tasks` | For non-agentic background operations, such as direct shell commands, testing suites, or simple background queries in... | `## Monitoring background tasks with `/tasks`` |
| E8 | 인터페이스 | Keyboard ergonomics | To reduce context-switching friction when subagents require manual interaction or tool authorizations, Antigravity CL... | `## Keyboard ergonomics` |
| E9 | 원칙 | Detailed "Teleport" navigation (`Alt+J`) | When a subagent encounters a tool requiring approval (e.g. writing a file or running a database migration), a status ... | `### Detailed "Teleport" navigation (`Alt+J`)` |
| E10 | 원칙 | "Fast-Path" confirmations (`Ctrl+K`) | To authorize an agent action instantly without leaving your active workspace: 1. Look at the inline status notificati... | `### "Fast-Path" confirmations (`Ctrl+K`)` |
| E11 | 절차 | Next steps | Configure the visual shell behavior and customize your configuration profiles: - **Teamwork agent teams (`/teamwork-p... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[03-subagents.md](../../../99.archive/antigravity-cli-docs/10-agent-capabilities/03-subagents.md) · [공식 사이트](https://antigravity.google/docs/cli/subagents/)
