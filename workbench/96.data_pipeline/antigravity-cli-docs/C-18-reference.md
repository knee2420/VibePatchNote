---
type: card
title: "CLI Reference"
description: "CLI Reference 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/18-reference.md"
timestamp: "2026-09-07"
---

# summary
CLI Reference의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Scan scannable tables listing all TUI slash commands, default keyboard shortcuts, and JSON configuration parameters.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Core slash commands | Type `/` inside the prompt box to open the typeahead command selection menu. | `## Core slash commands` |
| E2 | 인터페이스 | Default keybindings | Keyboard shortcut commands mapping global, prompt, navigation, and approval operations. | `## Default keybindings` |
| E3 | 원칙 | Global controls | These hotkeys are always active regardless of which panel, overlay, or prompt is currently focused. | `### Global controls` |
| E4 | 인터페이스 | Prompt focus keys | These keys are active when writing instructions inside the prompt box. | `### Prompt focus keys` |
| E5 | 원칙 | Navigation & scrolling | Used inside select panels, menus, and scrollable text boxes. | `### Navigation & scrolling` |
| E6 | 원칙 | Tool confirmations | Active during confirmation prompts. | `### Tool confirmations` |
| E7 | 인터페이스 | Configuration keys (`settings.json`) | Primary settings key names, data types, system defaults, and expected parameters. | `## Configuration keys (`settings.json`)` |
| E8 | 인터페이스 | Example `settings.json` | Example `settings.json`에 대한 핵심 사양 및 작동 규칙 정의. | `### Example `settings.json`` |
| E9 | 절차 | Next steps | Learn how to safely deploy permission policies, sandboxes, and customize plugins: - **Permissions & Sandbox**: Enforc... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[18-reference.md](../../99.archive/antigravity-cli-docs/18-reference.md) · [공식 사이트](https://antigravity.google/docs/cli/reference/)
