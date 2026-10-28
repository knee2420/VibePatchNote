---
type: card
title: "Installation & Auth"
description: "Installation & Auth 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/03-install.md"
timestamp: "2026-09-07"
---

# summary
Installation & Auth의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Install Antigravity CLI, configure enterprise requirements, and establish secure authenticated sessions.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 절차 | Installation | Antigravity CLI runs natively on macOS, Linux, and Windows. Use the platform-specific scripts below to install or upg... | `## Installation` |
| E2 | 코드 | macOS and Linux | Execute the native installer script to download and install the executable to `~/.local/bin/agy`: | `### macOS and Linux` |
| E3 | 코드 | Windows | The installation script registers the `agy` binary to your local user directory: `C:\Users\<username>\AppData\Local\a... | `### Windows` |
| E4 | 도구 | Installation flags | When executing the installation scripts, you can append the following customization flags: - `--skip-aliases`: Bypass... | `### Installation flags` |
| E5 | 사례 | Authentication workflows | Antigravity CLI uses secure credentials and token profiles to communicate with the shared agent harness. | `## Authentication workflows` |
| E6 | 인터페이스 | Local silent keyring sign-in | When launching `agy` on your local machine, the CLI attempts to access your operating system's native secure keyring ... | `### Local silent keyring sign-in` |
| E7 | 원칙 | Remote SSH OAuth flow | When running over SSH, the CLI detects the remote connection environment. Because it cannot launch a local web browse... | `### Remote SSH OAuth flow` |
| E8 | 인터페이스 | Using a Gemini API key | Run Antigravity CLI with your own Gemini API key instead of a signed-in Google account. Model requests go directly to... | `## Using a Gemini API key` |
| E9 | 인터페이스 | Enable the Gemini API key | 1. Set `modelProvider` to `gemini` in `~/.gemini/antigravity-cli/settings.json`: 2. Export your key as `GEMINI_API_KEY`: | `### Enable the Gemini API key` |
| E10 | 도구 | Point the CLI to a custom endpoint | To send model requests to a different Gemini-compatible endpoint, set the `GOOGLE_GEMINI_BASE_URL` environment variable: | `### Point the CLI to a custom endpoint` |
| E11 | 원칙 | Revert to default authentication | If you want to revert back to using the default account based authentication: 1. Remove `modelProvider` from `~/.gemi... | `### Revert to default authentication` |
| E12 | 안티패턴 | Troubleshooting | Troubleshooting에 대한 핵심 사양 및 작동 규칙 정의. | `### Troubleshooting` |
| E13 | 원칙 | Managing your session | Terminating your session clears active credentials and local cache directories. | `## Managing your session` |
| E14 | 코드 | Logging out | To disconnect your account and purge saved authentication profiles from your operating system's keyring, run the foll... | `### Logging out` |
| E15 | 절차 | Next steps | Once you complete installation and authentication, start interacting with your local agent: - **Tutorial**: Create an... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[03-install.md](../../99.archive/antigravity-cli-docs/03-install.md) · [공식 사이트](https://antigravity.google/docs/cli/install/)
