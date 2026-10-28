---
type: card
title: "Diff Command (/diff)"
description: "Diff Command (/diff) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/05-diff.md"
timestamp: "2026-09-07"
---

# summary
Diff Command (/diff)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
View and review workspace changes, commit history, and agent turn diffs interactively within the TUI.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | The `/diff` command opens the **Interactive Diff Viewer**, a full-screen panel that allows you to inspect changes in ... | `## Overview` |
| E2 | 코드 | Interactive Diff Viewer Panels | To open the Diff Viewer: 1. Type `/diff` in the prompt box. | `## Interactive Diff Viewer Panels` |
| E3 | 원칙 | Navigation and Controls | The Diff Viewer operates in three modes, which you can cycle through using `Tab` (or `→` / `←` arrow keys): - **VCS M... | `### Navigation and Controls` |
| E4 | 절차 | Step-by-Step Walkthrough | Here is how to use the Diff Viewer to review changes, add comments, and steer the agent. | `## Step-by-Step Walkthrough` |
| E5 | 원칙 | 1. Reviewing Workspace Changes (VCS Mode) | When you run `/diff`, it opens in **VCS Mode** by default (if you have uncommitted changes). You will see a list of m... | `### 1. Reviewing Workspace Changes (VCS Mode)` |
| E6 | 원칙 | 2. Adding Comments and Steering the Agent | While in the Detail View, you can review the code and write feedback directly onto specific lines. **Step 1: Locate t... | `### 2. Adding Comments and Steering the Agent` |
| E7 | 원칙 | 3. Reviewing Turn History (Turn Mode) | Press `Tab` to switch to **Turn Mode**. This groups changes by the conversation turn in which they were introduced, a... | `### 3. Reviewing Turn History (Turn Mode)` |
| E8 | 원칙 | 4. Navigating the Commit Tree (Commit Mode) | Press `Tab` again to switch to **Commit Mode**. This renders the repository's commit history as an interactive graph.... | `### 4. Navigating the Commit Tree (Commit Mode)` |
| E9 | 인터페이스 | Keyboard Shortcuts Reference | Keyboard Shortcuts Reference에 대한 핵심 사양 및 작동 규칙 정의. | `## Keyboard Shortcuts Reference` |
| E10 | 원칙 | File List View (VCS & Turn Modes) | File List View (VCS & Turn Modes)에 대한 핵심 사양 및 작동 규칙 정의. | `### File List View (VCS & Turn Modes)` |
| E11 | 원칙 | File Detail View | File Detail View에 대한 핵심 사양 및 작동 규칙 정의. | `### File Detail View` |
| E12 | 원칙 | Commit Tree View (Commit Mode) | Commit Tree View (Commit Mode)에 대한 핵심 사양 및 작동 규칙 정의. | `### Commit Tree View (Commit Mode)` |
| E13 | 원칙 | Exit Confirmation Screen | Exit Confirmation Screen에 대한 핵심 사양 및 작동 규칙 정의. | `### Exit Confirmation Screen` |
| E14 | 원칙 | See also | - **Settings & Keybindings**: Customize your TUI theme, alt-screen preferences, and keybindings. - **Conversations**:... | `## See also` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[05-diff.md](../../../99.archive/antigravity-cli-docs/15-commands/05-diff.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/diff/)
