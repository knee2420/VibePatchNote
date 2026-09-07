---
type: card
title: "AI Credits Command (/credits)"
description: "AI Credits Command (/credits) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/04-credits.md"
timestamp: "2026-09-07"
---

# summary
AI Credits Command (/credits)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
View and manage your AI Premium credits interactively.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | The `/credits` command opens a dedicated panel in the TUI that displays your current AI Premium credit balance, consu... | `## Overview` |
| E2 | 도구 | Using the Credits Command | To view your credit status: 1. Type `/credits` in the prompt box. | `## Using the Credits Command` |
| E3 | 절차 | Next steps | - **AI Credits Guide**: Learn about credit consumption, alerts, and settings. - **Model Quotas Command**: Monitor you... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[04-credits.md](../../../99.archive/antigravity-cli-docs/15-commands/04-credits.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/credits/)
