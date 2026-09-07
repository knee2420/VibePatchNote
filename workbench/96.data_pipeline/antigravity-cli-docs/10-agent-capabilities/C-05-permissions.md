---
type: card
title: "Permissions"
description: "Permissions 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/10-agent-capabilities/05-permissions.md"
timestamp: "2026-09-07"
---

# summary
Permissions의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Secure your local workstation, restrict absolute file paths, configure custom allow/deny/ask policies, and manage interactive approvals. You can also manage these rules interact...

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | Fine-grained permissions | To secure your workstation while enabling autonomous workflows, Antigravity CLI integrates a robust **Fine-Grained Pe... | `## Fine-grained permissions` |
| E2 | 규칙 | Supported actions & matching rules | Fine-grained permissions follow a standard schema pattern: The supported actions, target format specifications, and m... | `## Supported actions & matching rules` |
| E3 | 도구 | Global wildcard syntax | Across all supported action types, passing the global wildcard `*` (such as `read_file(*)`, `command(*)`, `mcp(*)`) m... | `### Global wildcard syntax` |
| E4 | 규칙 | Implicit permission rules | - **Write implies Read**: Allowing `write_file` on a path automatically grants `read_file` on that path. - **Deny Rea... | `### Implicit permission rules` |
| E5 | 원칙 | Cross-platform path normalization | Antigravity ensures your permission rules work flawlessly whether you are developing on macOS, Linux, or Windows. On ... | `### Cross-platform path normalization` |
| E6 | 원칙 | Default system behaviors & guardrails | When an action is not explicitly listed in your `allow`, `deny`, or `ask` lists, the system falls back to secure syst... | `## Default system behaviors & guardrails` |
| E7 | 규칙 | Interactive permission prompts | When the agent encounters an operation requiring approval (**Ask** mode), an interactive prompt card appears in your ... | `## Interactive permission prompts` |
| E8 | 인터페이스 | Configuration examples | Add these rules to your `~/.gemini/antigravity-cli/settings.json` file: | `## Configuration examples` |
| E9 | 원칙 | See also | - **Permissions Command**: Manage rules interactively in the TUI. - **Sandbox Customization**: Enforce OS-level conta... | `## See also` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[05-permissions.md](../../../99.archive/antigravity-cli-docs/10-agent-capabilities/05-permissions.md) · [공식 사이트](https://antigravity.google/docs/cli/permissions/)
