---
type: card
title: "Using AGY CLI"
description: "Using AGY CLI 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/05-using.md"
timestamp: "2026-09-07"
---

# summary
Using AGY CLI의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Antigravity CLI provides a flexible configuration system to customize workspace behavior, safety restrictions, editor preferences, visual style, and performance.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Settings | Antigravity CLI provides a flexible configuration system to customize workspace behavior, safety restrictions, editor... | `## Settings` |
| E2 | 원칙 | Quick Tips | Quick Tips에 대한 핵심 사양 및 작동 규칙 정의. | `## Quick Tips` |
| E3 | 인터페이스 | Keybindings | AGY CLI allows for custom keybindings. You can edit them by typing `/keybindings` or modifying the JSON file directly... | `## Keybindings` |
| E4 | 인터페이스 | Default Keybindings | You can map a single action to many keybindings in the JSON file. To disable keybindings, set the list to empty (e.g.... | `### Default Keybindings` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[05-using.md](../../99.archive/antigravity-cli-docs/05-using.md) · [공식 사이트](https://antigravity.google/docs/cli/using/)
