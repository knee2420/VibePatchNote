---
type: card
title: "Boost Command (/boost)"
description: "Boost Command (/boost) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/02-boost.md"
timestamp: "2026-09-07"
---

# summary
Boost Command (/boost)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
The `/boost` slash command activates an on-demand multi-agent reasoning pipeline designed for challenging software engineering tasks. When standard single-turn coding assistance...

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Boost deep reasoning (/boost) | The `/boost` slash command activates an on-demand multi-agent reasoning pipeline designed for challenging software en... | `# Boost deep reasoning (/boost)` |
| E2 | 아키텍처 | Overview | Modern software development involves problems spanning a wide spectrum of complexity: 1. **Everyday engineering**: In... | `## Overview` |
| E3 | 원칙 | How Boost works | When you invoke `/boost`, Antigravity initiates a three-phase multi-agent reasoning pipeline that decouples strategy ... | `## How Boost works` |
| E4 | 규칙 | Phase 1: Goal & strategy formulation | The Primary Orchestrator receives your prompt, inspects workspace context, and formulates an execution strategy. It b... | `### Phase 1: Goal & strategy formulation` |
| E5 | 원칙 | Phase 2: Parallel execution & verification | The Orchestrator dispatches focused subtasks to specialized subagents operating in clean, isolated scopes: - **Implem... | `### Phase 2: Parallel execution & verification` |
| E6 | 원칙 | Phase 3: Synthesis & delivery | Before presenting the final outcome, the reasoning pipeline aggregates findings and runs regression checks: - The Orc... | `### Phase 3: Synthesis & delivery` |
| E7 | 원칙 | When to use /boost | The following table compares the three primary execution modes in Antigravity: --- | `## When to use /boost` |
| E8 | 절차 | How to use /boost | You can invoke Boost across all Antigravity surfaces. | `## How to use /boost` |
| E9 | 코드 | In Antigravity 2.0 | Type `/boost` followed by your task prompt in any conversation turn: | `### In Antigravity 2.0` |
| E10 | 도구 | In Antigravity CLI | Type `/boost` directly into the terminal user interface (TUI) prompt box: --- | `### In Antigravity CLI` |
| E11 | 인터페이스 | Key use cases | Key use cases에 대한 핵심 사양 및 작동 규칙 정의. | `## Key use cases` |
| E12 | 코드 | 1. Concurrency and race conditions | Debugging multithreaded timing issues, deadlocks, and cache synchronization bugs where reproduction requires careful ... | `### 1. Concurrency and race conditions` |
| E13 | 코드 | 2. Algorithmic problem solving | Implementing high-performance algorithms, custom data structures, graph traversals, or mathematical routines with rig... | `### 2. Algorithmic problem solving` |
| E14 | 코드 | 3. Non-trivial refactoring | Refactoring tightly coupled modules, modernizing legacy interfaces, or migrating synchronous APIs to asynchronous pat... | `### 3. Non-trivial refactoring` |
| E15 | 코드 | 4. Deep root-cause investigation | Tracing execution paths across unfamiliar or large codebases to isolate the exact origin of an unexpected failure: --- | `### 4. Deep root-cause investigation` |
| E16 | 규칙 | Safety and permissions | Boost respects all standard Antigravity security policies: - **Scoped permissions**: "Subagents inherit file access r... | `## Safety and permissions` |
| E17 | 절차 | Next steps | Explore related documentation and guides: - Slash commands catalog: Review all available slash commands across Antigr... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[02-boost.md](../../../99.archive/antigravity-cli-docs/15-commands/02-boost.md) · [공식 사이트](https://antigravity.google/docs/boost/)
