---
type: card
title: "Status Line Customization"
description: "Status Line Customization 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/14-customizations/03-statusline.md"
timestamp: "2026-09-07"
---

# summary
Status Line Customization의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Define custom scripting configurations and format dynamic JSON state payloads to customize your TUI status line.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | The status line is positioned at the bottom of the TUI prompt panel. It provides at-a-glance context regarding active... | `## Overview` |
| E2 | 원칙 | Custom status line scripting | For advanced terminal layouts or custom status bar displays, you can route active agent metadata into a custom script. | `## Custom status line scripting` |
| E3 | 인터페이스 | Configuration | Add a `statusLine` configuration block to your `~/.gemini/antigravity-cli/settings.json` file: Whenever the agent sta... | `### Configuration` |
| E4 | 인터페이스 | Available JSON fields | The JSON payload piped to your script contains the following top-level fields: | `### Available JSON fields` |
| E5 | 인터페이스 | JSON payload example | Here is a fully sanitized, typical JSON payload piped to your status line script: | `### JSON payload example` |
| E6 | 사례 | Example script | You can download a complete, layout-adaptive script from the official statusline.sh example on GitHub. This script re... | `### Example script` |
| E7 | 원칙 | See also | - **Status Line Command**: Toggle status line elements interactively. - **Terminal Title Customization**: Configure d... | `## See also` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[03-statusline.md](../../../99.archive/antigravity-cli-docs/14-customizations/03-statusline.md) · [공식 사이트](https://antigravity.google/docs/cli/statusline/)
