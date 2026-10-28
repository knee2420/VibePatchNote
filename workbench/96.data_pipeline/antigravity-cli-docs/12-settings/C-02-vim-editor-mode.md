---
type: card
title: "Vim Editor Mode"
description: "Vim Editor Mode 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/12-settings/02-vim-editor-mode.md"
timestamp: "2026-09-07"
---

# summary
Vim Editor Mode의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Edit prompts with modal Vim keybindings instead of the default flat text editor.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Enable Vim editor mode | Vim editor mode is off by default. Turn it on from the interactive settings panel or directly in `settings.json`. | `## Enable Vim editor mode` |
| E2 | 인터페이스 | Using the settings panel | 1. Type `/settings` inside the prompt panel and press `Enter`. 2. Navigate to **Editor Mode** using `↑`/`↓`. | `### Using the settings panel` |
| E3 | 인터페이스 | Using `settings.json` | Set `editorMode` in your configuration profile: The CLI loads this file from `~/.gemini/antigravity-cli/settings.json... | `### Using `settings.json`` |
| E4 | 원칙 | Switch between modes | Vim editor mode starts in NORMAL. Press `i` to type, and `Esc` to return to NORMAL. The status line reports the curre... | `## Switch between modes` |
| E5 | 원칙 | Submit your prompt | Enter behaves differently in each mode, so you can compose multi-line prompts without accidental submits. `ZZ` submit... | `## Submit your prompt` |
| E6 | 코드 | Start in Insert mode | Set `vimInsertFirst` when you want each new prompt to begin in INSERT mode with a bare `Enter` that submits. This kee... | `### Start in Insert mode` |
| E7 | 원칙 | Move the cursor | All motions work on their own in NORMAL and VISUAL mode, and as targets for an operator. | `## Move the cursor` |
| E8 | 원칙 | Edit text | Editing commands fall into three groups: single keys that act immediately, operators that wait for a motion, and text... | `## Edit text` |
| E9 | 도구 | Single-key commands | Commands take no count prefix, so `3dd` deletes one line. To act on several lines at once, select them with `V` and p... | `### Single-key commands` |
| E10 | 코드 | Operators and motions | Combine an operator with any motion to act on the span it covers. `cw` changes to the end of the current word, matchi... | `### Operators and motions` |
| E11 | 코드 | Text objects | Pair an operator with `i` (inside) or `a` (around) and a delimiter. Backticks work the same way: pair `i` or `a` with... | `### Text objects` |
| E12 | 원칙 | Work with selections | Press `v` or `V` to select, move with any motion, then apply a command. Press `v` or `V` again, or `Esc`, to leave. | `## Work with selections` |
| E13 | 도구 | Run slash and shell commands | Press `/` or `!` in NORMAL mode. The CLI inserts the character and switches to INSERT mode, so slash commands and she... | `## Run slash and shell commands` |
| E14 | 인터페이스 | Customize the submit and newline keys | Three Vim actions are remappable in `~/.gemini/antigravity-cli/keybindings.json`. These are the defaults: Motions, op... | `## Customize the submit and newline keys` |
| E15 | 코드 | Submit with Enter in NORMAL mode only | This is the default. `Enter` submits from NORMAL mode and inserts a newline in INSERT mode, so you can type freely an... | `### Submit with Enter in NORMAL mode only` |
| E16 | 코드 | Submit with Enter in INSERT mode too | Move `enter` out of `vim.insert.insert_newline` and into `vim.insert.submit`. `Shift+Enter`, `Alt+Enter`, and `Ctrl+J... | `### Submit with Enter in INSERT mode too` |
| E17 | 코드 | Show the mode in a custom status line | A custom status line replaces the built-in one, and the mode badge goes with it. You have two ways to get the mode ba... | `## Show the mode in a custom status line` |
| E18 | 절차 | Next steps | - **Settings, Rendering & Keybindings**: Configure the rest of your preferences and remap keys. - **Status Line Custo... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[02-vim-editor-mode.md](../../../99.archive/antigravity-cli-docs/12-settings/02-vim-editor-mode.md) · [공식 사이트](https://antigravity.google/docs/cli/vim-editor-mode/)
