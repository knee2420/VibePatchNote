---
type: card
title: "Overview"
description: "Overview 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/01-overview.md"
timestamp: "2026-09-07"
---

# summary
Overview의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
The Antigravity CLI is the lightweight Terminal User Interface (TUI) surface of Antigravity. It brings the same core agentic capabilities as Antigravity 2.0 (such as multi-step ...

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Why Antigravity CLI? | Antigravity CLI brings the reasoning, execution, and orchestration capabilities of our shared agent harness directly ... | `## Why Antigravity CLI?` |
| E2 | 아키텍처 | Platform comparison | Platform comparison에 대한 핵심 사양 및 작동 규칙 정의. | `### Platform comparison` |
| E3 | 원칙 | Integration features | Antigravity CLI operates in tandem with Antigravity 2.0, sharing configurations and enabling frictionless transitions... | `## Integration features` |
| E4 | 도구 | Migrating from Gemini CLI | If you are transitioning from Gemini CLI, the onboarding process supports a one-time import to automatically migrate ... | `## Migrating from Gemini CLI` |
| E5 | 절차 | Next steps | Explore the guides below to set up your environment and begin working with autonomous agents: - **Installation & Auth... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[01-overview.md](../../99.archive/antigravity-cli-docs/01-overview.md) · [공식 사이트](https://antigravity.google/docs/cli/overview/)
