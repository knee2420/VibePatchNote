---
type: card
title: "Prompting & Interaction"
description: "Prompting & Interaction 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/08-prompting.md"
timestamp: "2026-09-07"
---

# summary
Prompting & Interaction의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Master primary interaction patterns, multiline composition workflows, session interruption controls, and terminal media pasting.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 코드 | The prompt box | Antigravity CLI features a sticky prompt panel positioned at the bottom of your terminal screen. This panel handles s... | `## The prompt box` |
| E2 | 규칙 | Submitting prompts | To initiate an agent turn, type your instruction into the prompt panel and press `Enter`. The agent immediately analy... | `### Submitting prompts` |
| E3 | 원칙 | Interrupting active sessions | If the agent initiates an undesired task or loops during command execution, press `Esc` to immediately halt the session. | `### Interrupting active sessions` |
| E4 | 원칙 | Multiline composition | For complex directives, structured test scenarios, or multi-paragraph instructions, use the built-in multiline features. | `## Multiline composition` |
| E5 | 원칙 | Shorthand newline insertions | - **Standard**: Press `Shift+Enter` or `ctrl+j` to insert a clean newline within your active prompt window without su... | `### Shorthand newline insertions` |
| E6 | 원칙 | Editing prompts in `$EDITOR` | To draft or edit extensive prompt structures in your primary development editor: 1. Press `ctrl+g` inside the empty p... | `### Editing prompts in `$EDITOR`` |
| E7 | 원칙 | Attaching media | Antigravity CLI supports pasting rich media formats directly from your system clipboard. Press `ctrl+v` (or native te... | `## Attaching media` |
| E8 | 원칙 | Supported file types | - **Images**: PNG, JPEG, GIF, WebP, BMP, TIFF, and SVG. - **Videos**: MP4, MOV, WebM, and AVI. | `### Supported file types` |
| E9 | 절차 | Next steps | After mastering interaction patterns, explore how the agent presents actions and requests verification: - **Reviewing... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[08-prompting.md](../../99.archive/antigravity-cli-docs/08-prompting.md) · [공식 사이트](https://antigravity.google/docs/cli/prompting/)
