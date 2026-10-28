---
type: card
title: "AI Credits"
description: "AI Credits 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/13-credits.md"
timestamp: "2026-09-07"
---

# summary
AI Credits의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
The Antigravity CLI integrates with your subscription to monitor and manage your AI Premium credits and usage quotas.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Managing AI Credits & Quotas | The Antigravity CLI integrates with your subscription to monitor and manage your AI Premium credits and usage quotas.... | `# Managing AI Credits & Quotas` |
| E2 | 원칙 | Quota Tracking | You can monitor your active quota and credit consumption directly inside the CLI: - **Statusline Indicator**: The rig... | `## Quota Tracking` |
| E3 | 도구 | Slash Commands & Managing Balance | You can query your credits or buy additional quota directly from the CLI: - **Query Balance**: Run the **AI Credits C... | `## Slash Commands & Managing Balance` |
| E4 | 인터페이스 | Settings Configuration | To control when and how your AI credits are used, you can toggle credit settings in your `settings.json` file: - **Us... | `## Settings Configuration` |
| E5 | 원칙 | See also | - **AI Credits Command**: View and manage your credits interactively in the TUI. - **Model Quotas Command**: Monitor ... | `## See also` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[13-credits.md](../../99.archive/antigravity-cli-docs/13-credits.md) · [공식 사이트](https://antigravity.google/docs/cli/credits/)
