---
type: card
title: "Settings, Rendering & Keybindings"
description: "Settings, Rendering & Keybindings 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/12-settings/01-settings.md"
timestamp: "2026-09-07"
---

# summary
Settings, Rendering & Keybindings의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Configure persistent preferences, customize keyboard shortcuts, toggle terminal display buffers, and manage runtime CLI parameter overrides.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Setting up preferences | Antigravity CLI stores user preferences in a minimal, forward-compatible JSON configuration profile. | `## Setting up preferences` |
| E2 | 인터페이스 | Configuration file location | The persistent settings are saved in a plain JSON format: The CLI leverages **sparse persistence** by writing only va... | `### Configuration file location` |
| E3 | 인터페이스 | The interactive settings panel | To edit settings directly inside your active terminal session without opening raw JSON files: 1. Type `/config` (or i... | `### The interactive settings panel` |
| E4 | 도구 | Command-line overrides | You can temporarily override persistent preferences for individual terminal sessions using CLI command flags: When an... | `## Command-line overrides` |
| E5 | 원칙 | Visual rendering modes | The TUI operates in one of two visual rendering modes depending on your terminal capability and connection latency. | `## Visual rendering modes` |
| E6 | 원칙 | Alt-screen mode (`always`) | This mode opens a dedicated display screen using the terminal's alternate buffer, creating an immersive, standalone a... | `### Alt-screen mode (`always`)` |
| E7 | 원칙 | Inline mode (`never`) | This mode renders output sequentially directly within your terminal's standard stdout pipeline. - **Key features**: P... | `### Inline mode (`never`)` |
| E8 | 도구 | Configuration options reference | The interactive settings panel (`/config`) and `settings.json` allow you to customize the CLI's behavior across sever... | `## Configuration options reference` |
| E9 | 규칙 | Safety & permissions | Manage how the agent interacts with your system and codebase: - **Tool Permission (`toolPermission`)**: Controls the ... | `### Safety & permissions` |
| E10 | 규칙 | Display & rendering | Customize the visual experience of the TUI: - **Rendering Mode (`altScreenMode`)**: Controls how the TUI utilizes you... | `### Display & rendering` |
| E11 | 원칙 | Editor & notifications | Configure integrations with your host environment: - **Editor (`editor`)**: The text editor used to view artifacts or... | `### Editor & notifications` |
| E12 | 원칙 | AI Credits & Feedback | Manage usage, tips, and telemetry: - **Use AI Credits (`useG1Credits`)**: *External builds only.* When enabled (`on`)... | `### AI Credits & Feedback` |
| E13 | 원칙 | Custom status lines & terminal titles | For advanced TUI environment integrations, you can toggle active metrics or deploy custom scripts to generate dynamic... | `## Custom status lines & terminal titles` |
| E14 | 인터페이스 | Keybindings configuration | You can customize almost all keyboard shortcuts in the TUI by mapping keys to specific workspace commands. | `## Keybindings configuration` |
| E15 | 인터페이스 | Keybindings file location | Custom maps are stored alongside your primary settings profile: | `### Keybindings file location` |
| E16 | 도구 | Format and customization | The JSON structure maps a single TUI command action to an array of hotkey sequences: To completely disable a default ... | `### Format and customization` |
| E17 | 코드 | Restoring defaults | To revert all keys back to system defaults, delete the keybindings profile: | `### Restoring defaults` |
| E18 | 절차 | Next steps | Now that you have configured your environment, review security controls and extensibility options: - **Permissions & ... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[01-settings.md](../../../99.archive/antigravity-cli-docs/12-settings/01-settings.md) · [공식 사이트](https://antigravity.google/docs/cli/settings/)
