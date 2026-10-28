---
type: card
title: "Resume Command (/resume)"
description: "Resume Command (/resume) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/07-resume.md"
timestamp: "2026-09-07"
---

# summary
Resume Command (/resume)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Browse, search, and resume past conversation threads, or recover your last session instantly from the command line.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | Antigravity CLI allows you to maintain multiple ongoing development threads. The `/resume` command opens an interacti... | `## Overview` |
| E2 | 코드 | Interactive Session Picker | To open the Session Picker inside the TUI: 1. Type `/resume` (or aliases `/switch`, `/conversation`) in the prompt box. | `## Interactive Session Picker` |
| E3 | 원칙 | 1. Navigating and Searching Conversations | The Session Picker displays a list of past conversations sorted by recency (newest first). - **Search**: Start typing... | `### 1. Navigating and Searching Conversations` |
| E4 | 원칙 | 2. Renaming a Conversation | To keep your history organized, you can rename conversations directly within the picker: 1. Use `↑`/`↓` to highlight ... | `### 2. Renaming a Conversation` |
| E5 | 원칙 | 3. Deleting a Conversation | To clean up obsolete threads: 1. Highlight the target conversation in the list. | `### 3. Deleting a Conversation` |
| E6 | 원칙 | 4. Importing from Antigravity 2.0 | You can import and resume active threads initiated in the Antigravity 2.0 desktop application: 1. With the Session Pi... | `### 4. Importing from Antigravity 2.0` |
| E7 | 도구 | Command-Line Shortcuts | You can bypass the TUI picker and resume sessions directly when launching `agy` from your host shell. | `## Command-Line Shortcuts` |
| E8 | 코드 | Quick Resume Last Session (`-c` / `--continue`) | To instantly resume the single most recent conversation associated with your active workspace: *(Alternative: `agy --... | `### Quick Resume Last Session (`-c` / `--continue`)` |
| E9 | 코드 | Resume Specific Session (`--conversation`) | To load a specific conversation directly by its unique ID: --- | `### Resume Specific Session (`--conversation`)` |
| E10 | 코드 | Under the Hood: The Session Cache | When you use the `-c` / `--continue` flag, the CLI resolves the target session using a local workspace-keyed cache. | `## Under the Hood: The Session Cache` |
| E11 | 코드 | The Cache File | - **Location**: `~/.gemini/antigravity-cli/cache/last_conversations.json` - **Format**: A JSON map associating absolu... | `### The Cache File` |
| E12 | 사례 | Resolution Workflow | 1. **Launch**: You run `agy -c` from `/path/to/workspace`. 2. **Lookup**: The CLI reads `last_conversations.json` and... | `### Resolution Workflow` |
| E13 | 원칙 | See also | - **Managing Conversations**: Learn about workspace scoping and branching with `/fork`. - **CLI Reference**: See all ... | `## See also` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[07-resume.md](../../../99.archive/antigravity-cli-docs/15-commands/07-resume.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/resume/)
