---
type: card
title: "Reviewing Artifacts"
description: "Reviewing Artifacts 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/09-artifacts/01-artifacts.md"
timestamp: "2026-09-07"
---

# summary
Reviewing Artifacts의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Audit generated code, review implementation proposals, attach line-level feedback comments, and verify visual media assets before applying edits to your local filesystem.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Collaboration and co-steering | An **Artifact** is a structured deliverable created by the agent to accomplish its task and communicate its progress ... | `## Collaboration and co-steering` |
| E2 | 아키텍처 | Overview of /artifact | When the agent produces or modifies files, a notification updates in your TUI status bar (`/artifact to review`). Pre... | `## Overview of /artifact` |
| E3 | 인터페이스 | Interaction keybindings | Audit the file checklist using the following dedicated panel controls: | `### Interaction keybindings` |
| E4 | 비교 | Code files vs visual media | To organize workspace assets, the picker separates files by format types: - **Actionable Code Files**: Standard progr... | `### Code files vs visual media` |
| E5 | 코드 | Viewing an artifact | To launch a close audit of a file's code structure or proposed logic, select `open` (or press `Enter` directly on a h... | `## Viewing an artifact` |
| E6 | 원칙 | Auditing & navigation | - **Scrolling**: Scroll page-by-page or line-by-line using `j`/`k` (or standard arrow keys). - **Boundary Jump**: Pre... | `### Auditing & navigation` |
| E7 | 원칙 | Granular line commenting | If a specific block of code requires correction: 1. Navigate and position your cursor on the target line. | `### Granular line commenting` |
| E8 | 원칙 | Custom Mermaid diagram rendering | If the active document contains structured system flowcharts, database relationships, or architectural layouts: - **C... | `### Custom Mermaid diagram rendering` |
| E9 | 절차 | Next steps | Configure settings preferences and review agent autonomy parameters: - **Managing Conversations**: Resume prior sessi... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[01-artifacts.md](../../../99.archive/antigravity-cli-docs/09-artifacts/01-artifacts.md) · [공식 사이트](https://antigravity.google/docs/cli/artifacts/)
