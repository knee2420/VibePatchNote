---
type: card
title: "Permissions Command (/permissions)"
description: "Permissions Command (/permissions) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/06-permissions.md"
timestamp: "2026-09-07"
---

# summary
Permissions Command (/permissions)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Manage your fine-grained agent permission rules interactively within the TUI.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | Antigravity CLI uses a fine-grained permissions engine to secure your workstation. While you can configure these rule... | `## Overview` |
| E2 | 규칙 | Managing permissions interactively | To open the Permissions Manager: 1. Type `/permissions` in the prompt box. | `## Managing permissions interactively` |
| E3 | 규칙 | Navigation and controls | The Permissions Manager operates in three panels: 1. **Scope Picker**: Select the configuration scope you want to edit: | `### Navigation and controls` |
| E4 | 절차 | Step-by-step walkthrough | Here is how to view, add, edit, and delete rules live in the TUI. | `## Step-by-step walkthrough` |
| E5 | 규칙 | 1. Selecting a scope and viewing rules | When you run `/permissions`, you first see the **Scope Picker**. Select **Global** to manage your global rules. Press... | `### 1. Selecting a scope and viewing rules` |
| E6 | 규칙 | 2. Adding a permission rule | To allow the agent to run `git` commands automatically without prompting: 1. In the Rule Viewer, press `A`. The **Add... | `### 2. Adding a permission rule` |
| E7 | 규칙 | 3. Editing a permission rule | If you want to restrict the agent so it can only run `git diff` automatically, you can edit the rule: 1. In the Rule ... | `### 3. Editing a permission rule` |
| E8 | 규칙 | 4. Deleting a permission rule | To remove a rule and revert to prompting for those actions: 1. In the Rule Viewer, highlight the rule you want to del... | `### 4. Deleting a permission rule` |
| E9 | 절차 | Next steps | - **Permissions Guide**: Learn about the security model, action types, and wildcard matching. - **Sandbox & Security*... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[06-permissions.md](../../../99.archive/antigravity-cli-docs/15-commands/06-permissions.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/permissions/)
