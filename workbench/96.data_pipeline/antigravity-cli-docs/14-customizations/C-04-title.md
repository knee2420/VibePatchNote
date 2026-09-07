---
type: card
title: "Terminal Title Customization"
description: "Terminal Title Customization 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/14-customizations/04-title.md"
timestamp: "2026-09-07"
---

# summary
Terminal Title Customization의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Configure dynamic window titles, map custom scripting configurations, and format JSON state outputs to customize terminal headers.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | The terminal window title feature displays agent details, active workspace basenames, and active conversation paramet... | `## Overview` |
| E2 | 원칙 | Custom title scripting | For customized window title formatting, you can route active TUI state details into a custom shell script. | `## Custom title scripting` |
| E3 | 인터페이스 | Configuration | Add a `title` configuration block to your `~/.gemini/antigravity-cli/settings.json` file: Whenever the agent state ch... | `### Configuration` |
| E4 | 인터페이스 | JSON state payload schema | The JSON state payload is the same as the one sent to the custom status line script. It includes detailed properties ... | `### JSON state payload schema` |
| E5 | 사례 | Example script | You can download a complete, layout-adaptive script from the official title.sh example on GitHub. This script extract... | `### Example script` |
| E6 | 원칙 | See also | - **Window Title Command**: Toggle or set the terminal title interactively. - **Status Line Customization**: Customiz... | `## See also` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[04-title.md](../../../99.archive/antigravity-cli-docs/14-customizations/04-title.md) · [공식 사이트](https://antigravity.google/docs/cli/title/)
