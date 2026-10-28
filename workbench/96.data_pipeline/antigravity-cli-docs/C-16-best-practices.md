---
type: card
title: "Best Practices"
description: "Best Practices 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/16-best-practices.md"
timestamp: "2026-09-07"
---

# summary
Best Practices의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Master the workflows, prompt architectures, and local configuration choices to maximize agent velocity while maintaining robust control.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Best practices for Antigravity CLI | Master the workflows, prompt architectures, and local configuration choices to maximize agent velocity while maintain... | `# Best practices for Antigravity CLI` |
| E2 | 코드 | Establish verification loops | The single most effective way to ensure reliable, correct modifications from an autonomous agent is to provide the ag... | `## Establish verification loops` |
| E3 | 코드 | Explore, plan, then execute | Autonomous local agents operate with highest accuracy when complex changes are partitioned into distinct exploration,... | `## Explore, plan, then execute` |
| E4 | 원칙 | Enrich your prompting context | Give local agents high-fidelity indicators to narrow down reasoning boundaries and minimize token overhead. | `## Enrich your prompting context` |
| E5 | 원칙 | Target file autocompletion | Type `@` within your prompt box to trigger the **Interactive Path Suggestion** overlay. Highlighting and selecting a ... | `### Target file autocompletion` |
| E6 | 원칙 | Attaching visual evidence | If debugging visual UI issues, rendering bugs, or frontend layout inconsistencies, capture a screenshot or video reco... | `### Attaching visual evidence` |
| E7 | 인터페이스 | Configure your workspace environment | Optimize your local workstation rules and security boundaries to match your engineering flow. | `## Configure your workspace environment` |
| E8 | 규칙 | Write a codebase rule file | Create a `GEMINI.md` or `AGENTS.md` file at your workspace root to outline specific directory standards, styling para... | `### Write a codebase rule file` |
| E9 | 규칙 | Establish structured permissions | Tune your safety barriers in `~/.gemini/antigravity-cli/settings.json` based on your project risk level: - **`request... | `### Establish structured permissions` |
| E10 | 원칙 | Manage TUI sessions proactively | Use active session navigation tools to recover from engineering dead-ends or course-correct intermediate agent loops. | `## Manage TUI sessions proactively` |
| E11 | 원칙 | Course-correct early (esc) | If you watch an agent execute an incorrect search pattern or write code that deviates from your intentions, press the... | `### Course-correct early (esc)` |
| E12 | 원칙 | Rewind history with /rewind | If an agent has made several successive changes that introduce build errors, you do not need to discard the session. ... | `### Rewind history with /rewind` |
| E13 | 원칙 | Branch experiments with /fork | If you are unsure of the best implementation path: 1. Reach a stable baseline thread. | `### Branch experiments with /fork` |
| E14 | 원칙 | Automate and script | Antigravity CLI is designed to operate seamlessly within standard shell pipeline tools. | `## Automate and script` |
| E15 | 도구 | Run non-interactive commands (-p) | To automate quick queries or integrate agents into git hooks, use the one-shot prompt flag `-p`: | `### Run non-interactive commands (-p)` |
| E16 | 원칙 | Fan out using parallel subagents | For large-scale sweeps or multi-file refactoring, direct the primary agent to spawn concurrent background subagents. ... | `### Fan out using parallel subagents` |
| E17 | 원칙 | Related resources | Learn how to configure settings and customize visual layouts: - **Settings, Rendering & Keybindings**: Customize keyb... | `## Related resources` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[16-best-practices.md](../../99.archive/antigravity-cli-docs/16-best-practices.md) · [공식 사이트](https://antigravity.google/docs/cli/best-practices/)
