---
type: card
title: "Plugins & Skills"
description: "Plugins & Skills 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/14-customizations/02-plugins.md"
timestamp: "2026-09-07"
---

# summary
Plugins & Skills의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Extend agent capabilities, install third-party extension bundles, package custom workflow skills, and interface with Model Context Protocol (MCP) servers.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | The extensibility model | Antigravity CLI is designed for limitless customization. You can augment the shared agent harness by installing struc... | `## The extensibility model` |
| E2 | 원칙 | Antigravity plugins | Plugins are namespaced bundles that package custom skills, background subagents, linting rules, Model Context Protoco... | `## Antigravity plugins` |
| E3 | 코드 | Plugin filesystem structure | When you install or import a plugin, the CLI stages the bundle files within your global configuration path: A complia... | `### Plugin filesystem structure` |
| E4 | 인터페이스 | The plugin manifest (plugin.json) | The `plugin.json` file is a mandatory manifest located at the root of your plugin directory. It defines the plugin's ... | `### The plugin manifest (plugin.json)` |
| E5 | 도구 | Managing plugins via CLI subcommands | The CLI exposes a `plugin` (or plural `plugins`) subcommand pipeline to manage your extensions: - **List installed pl... | `### Managing plugins via CLI subcommands` |
| E6 | 원칙 | Agent skills | Skills are declarative, human-readable markdown files that outline explicit instruction protocols, scripts, and targe... | `## Agent skills` |
| E7 | 코드 | Creating local workspace skills | To deploy workspace-specific skills that stay with your git repository: 1. Create a directory named `.agents/skills/`... | `### Creating local workspace skills` |
| E8 | 코드 | Sharing global skills | To share skills across all workspaces on your workstation, place the target markdown files inside your global configu... | `### Sharing global skills` |
| E9 | 코드 | Managing hooks | Hooks intercept agent actions right before or immediately after execution. They are useful for running automated pre-... | `## Managing hooks` |
| E10 | 아키텍처 | Model Context Protocol (MCP) | Model Context Protocol is an open standard enabling foundation models to interface securely with local APIs, file par... | `## Model Context Protocol (MCP)` |
| E11 | 절차 | Next steps | Learn how to migrate your existing configurations from Gemini CLI and troubleshoot connection anomalies: - **Migratio... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[02-plugins.md](../../../99.archive/antigravity-cli-docs/14-customizations/02-plugins.md) · [공식 사이트](https://antigravity.google/docs/cli/plugins/)
