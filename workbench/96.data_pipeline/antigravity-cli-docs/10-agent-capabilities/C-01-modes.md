---
type: card
title: "Choose an execution mode"
description: "Choose an execution mode 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/10-agent-capabilities/01-modes.md"
timestamp: "2026-09-07"
---

# summary
Choose an execution mode의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Control whether Antigravity CLI pauses to ask before modifying files or executing commands during a session.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Before you begin | - Install Antigravity CLI - Have an active project repository with source code to edit | `## Before you begin` |
| E2 | 원칙 | Available modes | Each execution mode makes a different tradeoff between conversational autonomy and developer oversight. The table bel... | `## Available modes` |
| E3 | 원칙 | Cycle execution modes during a session | You can switch execution modes mid-session without interrupting active tasks or restarting the terminal. 1. Press `Sh... | `## Cycle execution modes during a session` |
| E4 | 코드 | Review modifications in default mode | In `default` mode (`request-review`), Antigravity CLI pauses before applying any file writes to disk and renders an i... | `## Review modifications in default mode` |
| E5 | 코드 | Launch in default interactive review mode | agy ``` | `# Launch in default interactive review mode` |
| E6 | 코드 | New file creation previews | When Antigravity CLI creates a brand-new file, the confirmation panel displays an addition-only diff preview with a d... | `### New file creation previews` |
| E7 | 코드 | Auto-approve edits with accept-edits mode | Select `accept-edits` mode when you want Antigravity CLI to work in longer, uninterrupted stretches across your files... | `## Auto-approve edits with accept-edits mode` |
| E8 | 코드 | Launch directly in accept-edits mode | agy --mode=accept-edits ``` | `# Launch directly in accept-edits mode` |
| E9 | 코드 | Analyze tasks before editing with plan mode | Use `plan` mode when taking on complex refactoring, multi-file architectural changes, or unfamiliar codebase investig... | `## Analyze tasks before editing with plan mode` |
| E10 | 코드 | Launch directly in planning mode | agy --mode=plan ``` | `# Launch directly in planning mode` |
| E11 | 원칙 | Persist or override your default mode | You can set your preferred startup execution mode permanently across sessions or override it for specific invocations. | `## Persist or override your default mode` |
| E12 | 인터페이스 | Using the interactive settings panel | Open the interactive settings panel mid-session to inspect or update your default configuration. Navigate to **Agent ... | `### Using the interactive settings panel` |
| E13 | 인터페이스 | Setting `agentMode` in `settings.json` | Set `agentMode` directly inside your user or project configuration file: The CLI loads this file from `~/.gemini/anti... | `### Setting `agentMode` in `settings.json`` |
| E14 | 도구 | Command-line flag overrides | Pass the `--mode` flag to temporarily override your persistent default mode for a single terminal run: ```bash | `### Command-line flag overrides` |
| E15 | 도구 | Override settings.json to run in planning mode | agy --mode=plan ``` | `# Override settings.json to run in planning mode` |
| E16 | 원칙 | Common mistakes | Common mistakes에 대한 핵심 사양 및 작동 규칙 정의. | `## Common mistakes` |
| E17 | 절차 | Next steps | - Permissions: Configure fine-grained tool approval rules and wildcard matching - Settings, Rendering & Keybindings: ... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[01-modes.md](../../../99.archive/antigravity-cli-docs/10-agent-capabilities/01-modes.md) · [공식 사이트](https://antigravity.google/docs/cli/modes/)
