---
type: card
title: "Agents Command (/agents)"
description: "Agents Command (/agents) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/01-agents.md"
timestamp: "2026-09-07"
---

# summary
Agents Command (/agents)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Browse, select, and switch between custom agents, or monitor active and completed background subagents directly inside an interactive TUI panel.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Before you begin | - Install Antigravity CLI - Understand the Asynchronous execution model | `## Before you begin` |
| E2 | 아키텍처 | Overview | The `/agents` command opens the interactive **Agent Manager Panel**. This interface serves two distinct purposes: 1. ... | `## Overview` |
| E3 | 원칙 | Custom Agent Selection & Discovery | Antigravity CLI supports loading custom agent definitions with specialized system instructions and tool permissions. ... | `## Custom Agent Selection & Discovery` |
| E4 | 원칙 | 1. Switching between agents | - **Select**: Use `↑`/`↓` to highlight an agent (`Default agent` or a custom agent) under **Available Agents**, then ... | `### 1. Switching between agents` |
| E5 | 코드 | 2. Creating custom agents | The header of the `/agents` panel displays exact template locations for creating new custom agents: To create a custo... | `### 2. Creating custom agents` |
| E6 | 원칙 | Subagent Monitoring & Control | When your primary agent delegates tasks (such as running tests or querying large codebases), the spawned threads appe... | `## Subagent Monitoring & Control` |
| E7 | 원칙 | 1. Inspecting subagent progress | - **Group Toggling**: Press `Enter` on a subagent group header (`▸ Subagents (1 running, 2 done)`) to expand or colla... | `### 1. Inspecting subagent progress` |
| E8 | 원칙 | 2. Terminating active subagents | If a background subagent loops or runs longer than needed, you can kill it immediately without leaving your session: ... | `### 2. Terminating active subagents` |
| E9 | 원칙 | 3. Inline tool approvals | If a subagent attempts a protected operation (such as modifying a file or running a shell command in a sandboxed envi... | `### 3. Inline tool approvals` |
| E10 | 인터페이스 | Panel Keybindings Reference | When focused inside the `/agents` panel, the following keyboard shortcuts apply: --- | `## Panel Keybindings Reference` |
| E11 | 원칙 | Common mistakes | --- | `## Common mistakes` |
| E12 | 절차 | Next steps | - Background tasks & subagents: Learn more about the multi-threaded asynchronous execution architecture. - Plugins & ... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[01-agents.md](../../../99.archive/antigravity-cli-docs/15-commands/01-agents.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/agents/)
