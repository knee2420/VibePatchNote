---
type: card
title: "Voice Dictation (/voice)"
description: "Voice Dictation (/voice) 핵심 기능 및 아키텍처 가이드"
resource: "../../../99.archive/antigravity-cli-docs/15-commands/12-voice.md"
timestamp: "2026-09-07"
---

# summary
Voice Dictation (/voice)의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Speak your prompt instead of typing it.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Overview | The `/voice` command (alias `/record`) records audio from your microphone and streams real-time transcripts directly ... | `## Overview` |
| E2 | 코드 | Dictating a prompt | To dictate a prompt into the terminal, follow these steps: 1. Press `F5`, or type `/voice` in the prompt box and pres... | `## Dictating a prompt` |
| E3 | 원칙 | Dictation controls | The following keyboard shortcuts control active dictation sessions. All other keystrokes are ignored during recording... | `### Dictation controls` |
| E4 | 원칙 | Availability | Voice dictation is subject to the following operating constraints: - Dictation requires an interactive TUI session an... | `### Availability` |
| E5 | 규칙 | Voice over SSH | When the CLI runs on a remote machine over Secure Shell (SSH), the remote environment lacks direct access to your loc... | `## Voice over SSH` |
| E6 | 코드 | 1. Serve your local microphone | Start the microphone server on your local machine: Keep this process running while dictating. By default, `mic-serve`... | `### 1. Serve your local microphone` |
| E7 | 코드 | 2. Open a reverse tunnel | From your local machine, forward the local audio port to the remote machine by opening a reverse SSH tunnel: The tunn... | `### 2. Open a reverse tunnel` |
| E8 | 도구 | 3. Start the CLI with `ANTIGRAVITY_MIC` | In your remote SSH session, launch the CLI with the `ANTIGRAVITY_MIC` environment variable set to the forwarded tunne... | `### 3. Start the CLI with `ANTIGRAVITY_MIC`` |
| E9 | 코드 | 4. Verify the tunnel connection | If no connection log appears in the `mic-serve` output when dictating, test whether the forwarded port is reachable b... | `### 4. Verify the tunnel connection` |
| E10 | 안티패턴 | Troubleshooting | - **Transcription fails with a permissions message**: Your stored credentials predate voice dictation support. Execut... | `## Troubleshooting` |
| E11 | 절차 | Next steps | - **CLI Reference**: See all available slash commands and keybindings. - **Prompting & Interaction**: Multiline editi... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[12-voice.md](../../../99.archive/antigravity-cli-docs/15-commands/12-voice.md) · [공식 사이트](https://antigravity.google/docs/cli/commands/voice/)
