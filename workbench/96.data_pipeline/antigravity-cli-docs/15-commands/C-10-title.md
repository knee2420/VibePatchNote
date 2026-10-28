---
type: card
title: "Window Title Command (/title)"
description: "Window Title Command (/title) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/10-title.md"
timestamp: "2026-09-07"
---

# summary
Window Title Command (/title)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Configure dynamic terminal window titles interactively.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | The `/title` command allows you to toggle the terminal window title feature on and off, or set its state explicitly. ... | `## Overview` |
| E2 | 코드 | Interactive Toggling | You can control the window title feature by running the `/title` command. To toggle the feature on and off: | `## Interactive Toggling` |
| E3 | 절차 | Next steps | - **Terminal Title Guide**: Learn how to write custom scripts to format the window title. - **Status Line Command**: ... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[10-title.md](../../../99.archive/antigravity-cli-docs/15-commands/10-title.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/title/)
