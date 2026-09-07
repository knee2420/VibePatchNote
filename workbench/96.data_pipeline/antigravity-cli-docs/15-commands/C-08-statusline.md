---
type: card
title: "Status Line Command (/statusline)"
description: "Status Line Command (/statusline) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/08-statusline.md"
timestamp: "2026-09-07"
---

# summary
Status Line Command (/statusline)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Toggle the TUI status line or configure a custom rendering command.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | The `/statusline` command allows you to quickly enable or disable the status line at the bottom of your TUI, or confi... | `## Overview` |
| E2 | 도구 | Usage | Run the `/statusline` command with the following arguments to control its behavior: | `## Usage` |
| E3 | 코드 | Toggle Status Line | Type `/statusline` with no arguments to toggle the status line on and off: | `### Toggle Status Line` |
| E4 | 코드 | Enable or Disable Explicitly | You can explicitly enable or disable the status line: - **Enable**: `/statusline on` or `/statusline enable` | `### Enable or Disable Explicitly` |
| E5 | 도구 | Configure a Custom Command | To route the agent state JSON payload to a custom script and render its output in the status line, pass the command a... | `### Configure a Custom Command` |
| E6 | 코드 | Revert to Default | To delete your custom command configuration and revert to the built-in default status line: *(Note: `/statusline rese... | `### Revert to Default` |
| E7 | 코드 | Show Help | To view the quick command reference: | `### Show Help` |
| E8 | 절차 | Next steps | - **Status Line Guide**: Learn how to write custom scripts and handle the JSON payload. - **Window Title Command**: C... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[08-statusline.md](../../../99.archive/antigravity-cli-docs/15-commands/08-statusline.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/statusline/)
