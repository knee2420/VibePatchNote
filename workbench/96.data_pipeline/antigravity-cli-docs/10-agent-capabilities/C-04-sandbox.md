---
type: card
title: "Sandbox"
description: "Sandbox 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/10-agent-capabilities/04-sandbox.md"
timestamp: "2026-09-07"
---

# summary
Sandbox의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Run agent shell commands in an isolated environment that protects your filesystem and workstation.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | How it works | With the terminal sandbox enabled, Antigravity CLI executes commands inside an OS-level isolation boundary. Commands ... | `## How it works` |
| E2 | 인터페이스 | Configuration | Enable the sandbox in `~/.gemini/antigravity-cli/settings.json`, or interactively via `/config`: - **`enableTerminalS... | `## Configuration` |
| E3 | 도구 | CLI flags | You can also control sandboxing when launching the CLI: ```bash | `### CLI flags` |
| E4 | 코드 | Force the sandbox on for this session | antigravity --sandbox ``` | `# Force the sandbox on for this session` |
| E5 | 규칙 | Permissions integration | The sandbox derives its access boundaries from your **Permissions** configuration: - **Filesystem**: Workspace folder... | `## Permissions integration` |
| E6 | 사례 | Example | With this configuration: - `npm test` and `git diff` run inside the sandbox. | `### Example` |
| E7 | 코드 | Interactive prompts | When a command needs review, you can approve it once or turn the approval into a standing rule: When the agent asks t... | `## Interactive prompts` |
| E8 | 원칙 | See also | - **Hub Sandbox**: How sandboxing works in Antigravity 2.0. - **Permissions**: Configure allow, deny, and ask rules. | `## See also` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[04-sandbox.md](../../../99.archive/antigravity-cli-docs/10-agent-capabilities/04-sandbox.md) · [공식 사이트](https://antigravity.google/docs/cli/sandbox/)
