---
type: card
title: "Projects"
description: "Projects 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/11-projects.md"
timestamp: "2026-09-07"
---

# summary
Projects의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Manage projects and organize conversation sessions in the Antigravity CLI.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Launching sessions with projects | Launching sessions with projects에 대한 핵심 사양 및 작동 규칙 정의. | `## Launching sessions with projects` |
| E2 | 코드 | 1. Default project execution | When starting the CLI without any project flags, all conversations in the session will be in the `default-cli-project`: | `### 1. Default project execution` |
| E3 | 코드 | 2. Opening a session in a specific project | If you want to open a session attached to a specific existing project, pass the `--project` flag with the target proj... | `### 2. Opening a session in a specific project` |
| E4 | 코드 | 3. Creating a new project on startup | If you want to create a brand new project and initialize your CLI session inside it, pass the `--new-project` flag: | `### 3. Creating a new project on startup` |
| E5 | 원칙 | 4. Resuming an existing conversation | If you resume a conversation (whether on startup via `--conversation=<conv_id>` or during a session using `/resume`),... | `### 4. Resuming an existing conversation` |
| E6 | 코드 | Moving conversations between projects (`/fork`) | While interacting in an active session, you can copy and continue your current conversation to a different project us... | `## Moving conversations between projects (`/fork`)` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[11-projects.md](../../99.archive/antigravity-cli-docs/11-projects.md) · [공식 사이트](https://antigravity.google/docs/cli/projects/)
