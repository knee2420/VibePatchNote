---
type: card
title: "Tutorial"
description: "Tutorial 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/04-tutorial.md"
timestamp: "2026-09-07"
---

# summary
Tutorial의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Learn how to launch Antigravity CLI, collaborate with an autonomous local agent, review generated files, and execute terminal test commands.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Antigravity CLI Tutorial | Learn how to launch Antigravity CLI, collaborate with an autonomous local agent, review generated files, and execute ... | `# Antigravity CLI Tutorial` |
| E2 | 아키텍처 | Overview | This guide walks you through a rapid onboarding exercise. You will direct an autonomous agent to create a Python util... | `## Overview` |
| E3 | 절차 | Step-by-step | 1. **Create a clean project directory and launch the Antigravity TUI** 2. **Prompt the agent to generate a Python scr... | `## Step-by-step` |
| E4 | 절차 | Next steps | Now that you have executed your first agent-assisted workflow, learn how to configure the CLI and master core concept... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[04-tutorial.md](../../99.archive/antigravity-cli-docs/04-tutorial.md) · [공식 사이트](https://antigravity.google/docs/cli/tutorial/)
