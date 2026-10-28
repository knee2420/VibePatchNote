---
type: card
title: "Teamwork Command (/teamwork-preview)"
description: "Teamwork Command (/teamwork-preview) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/09-teamwork.md"
timestamp: "2026-09-07"
---

# summary
Teamwork Command (/teamwork-preview)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
The `/teamwork-preview` command runs a collaborative multi-agent team designed for large software projects, complex simulations, and deep research tasks. When work spans multipl...

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Teamwork agent teams (/teamwork-preview) | The `/teamwork-preview` command runs a collaborative multi-agent team designed for large software projects, complex s... | `# Teamwork agent teams (/teamwork-preview)` |
| E2 | 아키텍처 | Overview | Software engineering and scientific research often run into problems that are simply too large or complex for a singl... | `## Overview` |
| E3 | 아키텍처 | Multi-agent architecture and roles | Teamwork organizes multi-agent collaboration into clear orchestration, implementation, and verification tiers. | `## Multi-agent architecture and roles` |
| E4 | 아키텍처 | Core orchestration and execution roles | - **Sentinel**: The coordinator that takes over once you approve the prompt. Sentinel records your request, routes ta... | `### Core orchestration and execution roles` |
| E5 | 규칙 | Adversarial verification gates | To catch bugs early and ensure code actually works, candidate changes must pass independent verification checks befor... | `### Adversarial verification gates` |
| E6 | 원칙 | Execution paths | Teamwork automatically adjusts team composition, verification depth, and agent roles based on the task and your promp... | `## Execution paths` |
| E7 | 사례 | Two-phase workflow | To ensure alignment before writing code and avoid constant back-and-forth interruptions, Teamwork splits every projec... | `## Two-phase workflow` |
| E8 | 원칙 | Phase 1: Prompt crafting (scoping interview) | During Phase 1, the main Antigravity agent conducts a structured interview with you. The interview follows a simple p... | `### Phase 1: Prompt crafting (scoping interview)` |
| E9 | 원칙 | Phase 2: Autonomous execution (structured handoffs) | Once approved, Sentinel hands off the project to the Project Orchestrator, which coordinates the team autonomously wi... | `### Phase 2: Autonomous execution (structured handoffs)` |
| E10 | 코드 | Integrity modes | Teamwork uses three internal integrity modes to align verification depth with project requirements. During the Phase ... | `## Integrity modes` |
| E11 | 규칙 | Safety, workspaces, and isolation | Teamwork includes built-in safeguards to ensure parallel agent work remains safe, predictable, and easy to audit: - *... | `## Safety, workspaces, and isolation` |
| E12 | 절차 | How to use /teamwork-preview | How to use /teamwork-preview에 대한 핵심 사양 및 작동 규칙 정의. | `## How to use /teamwork-preview` |
| E13 | 코드 | In Antigravity 2.0 (Desktop & Web) | Start a new conversation and invoke `/teamwork-preview` with your goal: Your agent will start the Phase 1 scoping int... | `### In Antigravity 2.0 (Desktop & Web)` |
| E14 | 도구 | In Antigravity CLI | In the terminal interface, run `/teamwork-preview` at the prompt: You can monitor active subagents, jump directly to ... | `### In Antigravity CLI` |
| E15 | 절차 | Next steps | Explore related documentation and guides: - Boost deep reasoning (`/boost`): Explore on-demand deep reasoning for int... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[09-teamwork.md](../../../99.archive/antigravity-cli-docs/15-commands/09-teamwork.md) · [공식 사이트](https://antigravity.google/docs/teamwork/)
