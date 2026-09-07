---
type: card
title: "Code Search Command (/codesearch)"
description: "Code Search Command (/codesearch) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/03-codesearch.md"
timestamp: "2026-09-07"
---

# summary
Code Search Command (/codesearch)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Interactively search the code in your workspace from inside the TUI, without leaving your session or interrupting the agent.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | The `/codesearch` command opens a fullscreen **Code Search** panel that runs a search across your current workspace a... | `## Overview` |
| E2 | 도구 | Running a search | 1. Type `/codesearch` followed by your query in the prompt box. 2. Press `Enter`. | `## Running a search` |
| E3 | 원칙 | Navigation and controls | The panel is fully keyboard driven: | `### Navigation and controls` |
| E4 | 도구 | Query syntax | By default, queries are interpreted as **regular expressions** and matching is case-insensitive unless your query con... | `## Query syntax` |
| E5 | 코드 | Literal (fixed-string) matching | Add `-F` (or `--literal`) anywhere in the query to disable regex and match the text literally. This is useful when yo... | `### Literal (fixed-string) matching` |
| E6 | 코드 | Filtering by file path | Restrict a search to certain files with `f:` (aliases `file:` and `path:`) followed by a glob. Prefix the filter with... | `### Filtering by file path` |
| E7 | 원칙 | Opening a file and commenting on lines | Code Search is more than a viewer — you can open any result and give the agent precise, line-level feedback without l... | `## Opening a file and commenting on lines` |
| E8 | 코드 | Open a result | Highlight a match with `↑` / `↓` and press `Enter` to open that file in the built-in file viewer, scrolled to the mat... | `### Open a result` |
| E9 | 원칙 | Comment on a specific line | 1. Move the cursor (`↑` / `↓`) to the line you want to annotate. 2. Press `C` to open the inline comment editor for t... | `### Comment on a specific line` |
| E10 | 원칙 | Send your comments to the agent | When you leave the file viewer with `Esc`, any pending comments are collected and the CLI asks whether to send them: ... | `### Send your comments to the agent` |
| E11 | 절차 | Next steps | - **CLI Features**: Explore the rest of the interactive TUI capabilities. - **Prompting Guide**: Learn how to direct ... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[03-codesearch.md](../../../99.archive/antigravity-cli-docs/15-commands/03-codesearch.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/codesearch/)
