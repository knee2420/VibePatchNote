---
type: card
title: "Migration"
description: "Migration 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/07-gcli-migration.md"
timestamp: "2026-09-07"
---

# summary
Migration의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Convert your legacy configurations, import Gemini CLI extensions as native plugins, adapt custom skills paths, and reformat Model Context Protocol configurations.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Migrating from Gemini CLI | Convert your legacy configurations, import Gemini CLI extensions as native plugins, adapt custom skills paths, and re... | `# Migrating from Gemini CLI` |
| E2 | 아키텍처 | Overview | Antigravity CLI preserves backward compatibility with the core developer-experience constructs popularized by Gemini ... | `## Overview` |
| E3 | 원칙 | First-launch onboarding | When you execute `agy` for the first time in an environment containing legacy configurations, the CLI automatically d... | `## First-launch onboarding` |
| E4 | 코드 | Converting extensions to plugins | Since Gemini CLI launched, the industry has standardized on the term **plugins**. You can manually convert your legac... | `## Converting extensions to plugins` |
| E5 | 코드 | Expected import output | Expected import output에 대한 핵심 사양 및 작동 규칙 정의. | `### Expected import output` |
| E6 | 규칙 | Context files and workspace rules | Both CLI platforms utilize identical workspace context rules. No modifications are needed to your existing rule docum... | `## Context files and workspace rules` |
| E7 | 규칙 | Updated skills paths | While global shared skills remain in your user home directory, the target folder path for local workspace-specific sk... | `## Updated skills paths` |
| E8 | 도구 | MCP config formatting changes | Antigravity CLI separates Model Context Protocol servers into dedicated, lightweight JSON profiles instead of nesting... | `## MCP config formatting changes` |
| E9 | 원칙 | Directory mapping | - **Legacy Gemini Config**: Servers were declared inline within `~/.gemini/settings.json`. - **Antigravity CLI Config... | `### Directory mapping` |
| E10 | 인터페이스 | Required schema updates | When manually migrating remote websocket or SSE server definitions, update the URI key parameter to match the current... | `### Required schema updates` |
| E11 | 절차 | Next steps | Begin configuring your new visual parameters and troubleshooting any setup anomalies: - **Settings, Rendering & Keybi... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[07-gcli-migration.md](../../99.archive/antigravity-cli-docs/07-gcli-migration.md) · [공식 사이트](https://antigravity.google/docs/cli/gcli-migration/)
