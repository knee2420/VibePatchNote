---
type: card
title: "Troubleshooting"
description: "Troubleshooting 핵심 기능 및 아키텍처 가이드"
resource: "../../99.archive/antigravity-cli-docs/17-troubleshooting.md"
timestamp: "2026-09-07"
---

# summary
Troubleshooting의 핵심 엔지니어링 사양을 정의하며, **터미널 환경에서 고속 에이전트 오케스트레이션 및 무인 자동화 파이프라인을 구축하기 위한 표준 인터페이스와 작동 제약**을 다룬다.
Diagnose and resolve common anomalies with installation PATHs, local self-updating locks, keyring access permissions, and SSH clipboard forwarding.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | Quick reference | Scan the lookup table below to identify symptoms and access immediate solutions: --- | `## Quick reference` |
| E2 | 인터페이스 | Configure your shell PATH | Configure your shell PATH에 대한 핵심 사양 및 작동 규칙 정의. | `## Configure your shell PATH` |
| E3 | 코드 | Symptom | Executing `agy` returns a shell terminal error: | `### Symptom` |
| E4 | 원칙 | Cause | The installation utility downloads the binary to `~/.local/bin` (or `C:\Users\<username>\AppData\Local\agy\bin`), but... | `### Cause` |
| E5 | 코드 | Resolution | Ensure your terminal session loads the binary path. **macOS & Linux**: | `### Resolution` |
| E6 | 규칙 | Authorize keyring permissions | Authorize keyring permissions에 대한 핵심 사양 및 작동 규칙 정의. | `## Authorize keyring permissions` |
| E7 | 코드 | Symptom | When launching, the CLI hangs, prints DBUS warnings, or throws keyring access exceptions: | `### Symptom` |
| E8 | 원칙 | Cause | Antigravity CLI utilizes secure keychain libraries (Apple Keychain, Linux secret-service via dbus, or Windows Credent... | `### Cause` |
| E9 | 코드 | Resolution | **macOS**: 1. Open **Keychain Access** app. | `### Resolution` |
| E10 | 도구 | Enable emulator clipboard forwarding | Enable emulator clipboard forwarding에 대한 핵심 사양 및 작동 규칙 정의. | `## Enable emulator clipboard forwarding` |
| E11 | 코드 | Symptom | Pasting screenshots or media files via `Ctrl+V` within an SSH terminal returns a failure notification: | `### Symptom` |
| E12 | 원칙 | Cause | Standard SSH streams do not forward graphical clipboards. Graphic uploads require specific terminal multiplexer proto... | `### Cause` |
| E13 | 코드 | Resolution | Verify that you are utilizing supported terminal emulators and configurations. 1. **Use iTerm2 or Ghostty**: These em... | `### Resolution` |
| E14 | 안티패턴 | Resolve self-updater locks and failures | Resolve self-updater locks and failures에 대한 핵심 사양 및 작동 규칙 정의. | `## Resolve self-updater locks and failures` |
| E15 | 코드 | Symptom | Launching `agy` hangs, fails to apply upgrades, or returns an advisory lock warning: | `### Symptom` |
| E16 | 원칙 | Cause | Antigravity CLI contains a native, statically linked self-updater that runs in the background. It uses a 15-minute Ti... | `### Cause` |
| E17 | 코드 | Resolution | - **Release the advisory lock**: Purge the background lock file manually: - **Opt-out/Disable auto-updates**: Set the... | `### Resolution` |
| E18 | 절차 | Next steps | Access our quick reference sheets or configure advanced permissions: - **CLI Reference**: Dense tables listing all sl... | `## Next steps` |

# 밖으로
- [E1] 요소는 에이전트 하네스 코어와 연동되며 상위 실행 정책을 공유한다.
- ⚠️ CLI 업데이트(v1.1.25 기준) 시 플래그 명칭이나 기본 세션 타임아웃 변경 여부를 상시 점검할 것.

# 원문
[17-troubleshooting.md](../../99.archive/antigravity-cli-docs/17-troubleshooting.md) · [공식 사이트](https://antigravity.google/docs/cli/troubleshooting/)
