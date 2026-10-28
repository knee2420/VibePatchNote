---
type: card
title: "Model Quotas (/usage)"
description: "Model Quotas (/usage) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/11-usage.md"
timestamp: "2026-09-07"
---

# summary
Model Quotas (/usage)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
View your active model quota usage and refresh your configuration.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | Antigravity CLI provides the `/usage` command (alias `/quota`) to help you monitor your resource consumption. When ru... | `## Overview` |
| E2 | 도구 | Viewing your usage | To open the Model Quotas panel: 1. Type `/usage` (or `/quota`) in the prompt box. | `## Viewing your usage` |
| E3 | 원칙 | Interactive Panel Features | The panel displays: - **Model Quotas**: A breakdown of your usage limits and remaining requests/tokens for each suppo... | `### Interactive Panel Features` |
| E4 | 원칙 | Navigation Controls | Use the following keyboard shortcuts to navigate the panel: | `### Navigation Controls` |
| E5 | 절차 | Next steps | - **CLI Reference**: See all available slash commands and keybindings. - **Settings & Rendering**: Configure your def... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[11-usage.md](../../../99.archive/antigravity-cli-docs/15-commands/11-usage.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/usage/)
