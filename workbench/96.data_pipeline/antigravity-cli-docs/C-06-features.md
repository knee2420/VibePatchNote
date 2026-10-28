---
type: card
title: "Features"
description: "Features 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/06-features.md"
timestamp: "2026-09-07"
---

# summary
Features의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
**How Plugins Work** Plugins are namespaced bundles that can contain skills, agents, rules, MCP servers, and hooks as a single deployable unit.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Antigravity CLI Features | Antigravity CLI Features에 대한 핵심 사양 및 작동 규칙 정의. | `# Antigravity CLI Features` |
| E2 | 코드 | Plugins | **How Plugins Work** Plugins are namespaced bundles that can contain skills, agents, rules, MCP servers, and hooks as... | `## Plugins` |
| E3 | 코드 | Terminal Sandbox | The Terminal Sandbox is a lightweight security isolation mechanism that protects your host system from potentially de... | `## Terminal Sandbox` |
| E4 | 도구 | CLI Slash Commands Reference | The Antigravity CLI supports a variety of slash commands typed directly into the prompt box to manage conversations, ... | `## CLI Slash Commands Reference` |
| E5 | 아키텍처 | Core Slash Commands | Core Slash Commands에 대한 핵심 사양 및 작동 규칙 정의. | `## Core Slash Commands` |
| E6 | 인터페이스 | Advanced Customization via `settings.json` | For power users, several slash commands support deep customization via your `~/.gemini/antigravity-cli/settings.json`... | `## Advanced Customization via `settings.json`` |
| E7 | 도구 | Subagents in Antigravity CLI | Antigravity CLI features an asynchronous subagents framework that allows the main agent to delegate parallel work, pe... | `## Subagents in Antigravity CLI` |
| E8 | 원칙 | Managing Agents: The `/agents` Panel | Antigravity CLI provides an interactive terminal UI to view, manage, and approve actions for running subagents. - **A... | `## Managing Agents: The `/agents` Panel` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[06-features.md](../../99.archive/antigravity-cli-docs/06-features.md) · [공식 사이트](https://antigravity.google/docs/cli/features/)
