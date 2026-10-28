---
title: "agy-cli Python Subprocess 연동 가이드 (Headless & Encoding)"
description: "agy-cli를 파이썬 스크립트에서 호출할 때 발생하는 권한 거부 및 윈도우 인코딩 문제 해결 규칙"
---

# Rule: agy-cli Python Subprocess 연동 가이드

## 1. 목적
에이전트나 시스템이 `agy-cli`를 백그라운드 스크립트(Python `subprocess` 등)에서 호출하여 파일 분석/자동화 작업을 수행할 때 흔히 발생하는 권한 차단 및 인코딩 이슈를 원천 차단한다.

## 2. 필수 규칙 (Troubleshooting & Core Policy)

### A. 절대 TUI 모드 및 stream-json 사용 금지 — 헤드리스 `--output-format json` 강제
- 플래그 없이 CLI를 실행하면 인터랙티브 TUI 화면이 떠서 백그라운드 프로세스가 무한 대기(Hang) 상태에 빠진다.
- 백그라운드 및 파이프라인 연동 시 **TUI 모드와 `stream-json`을 절대 사용하지 않는다.**
- CLI 호출 표준 플래그:
  - `--output-format json` (단일 JSON 결과 엔벨로프로 즉시 파싱)
  - `--dangerously-skip-permissions`
  - `--disable-slash-commands`
  - 필요 시 `--json-schema <경로>`

### B. 입력 내용은 무조건 텍스트 파일(txt, md)로 만들어 stdin 스트림 전달
- 프롬프트를 명령줄 인자(`-p "<프롬프트>"`)로 직접 길게 넘기는 행위를 금지한다. (윈도우 32KB 한계 및 `WinError 206` 방지)
- 복잡한 JSON 이스케이프가 필요한 `stream-json` 대신:
  - **순수 텍스트/마크다운 파일(.txt / .md)로 입력 내용을 디스크에 작성**한 뒤,
  - `subprocess.run(..., stdin=open(prompt_file, 'r', encoding='utf-8'))`로 깔끔하게 공급한다.

### C. Headless 환경에서의 권한 우회 (`--dangerously-skip-permissions`)
- `agy-cli`를 스크립트에서 자동 실행할 때(예: 파일 읽기 도구 사용), CLI는 사용자에게 권한 승인 프롬프트를 띄울 수 없어(Headless) **자동 거부(Auto-denied)** 처리 후 빈 응답을 반환한다.
- **해결책**: 스크립트에서 CLI 호출 시 **반드시 `--dangerously-skip-permissions` 플래그를 추가**해야 한다.

### D. 윈도우 콘솔 UTF-8 인코딩 (cp949 에러 방지)
- 윈도우 환경에서 `subprocess.run` 캡처 후 `print(result.stdout)` 수행 시, 이모지(📋)나 특수문자가 포함된 AI의 출력이 `cp949` 코덱으로 인코딩을 시도하다가 `UnicodeEncodeError`를 뱉고 강제 종료되는 현상이 잦다.
- **해결책 1 (Python 전역 설정)**: 스크립트 최상단에 `sys.stdout.reconfigure(encoding='utf-8')` 추가.
- **해결책 2 (파일로 직접 쓰기 - 권장)**: `subprocess` 결과를 화면에 `print()` 하지 말고, `encoding="utf-8"` 옵션을 적용한 파일 객체에 직접 `write()` 하라.

### E. 작업 디렉터리 오염 및 치팅 방지 (`--add-dir` 오남용 금지)
- 산출물(`artifacts/`)이나 기존 데이터가 존재하는 상위 폴더를 임의로 `--add-dir`로 워크스페이스에 추가하지 않는다.
- 디렉터리 전체가 워크스페이스로 개방되면 CLI 에이전트가 기존 산출물을 스캔하여 답을 베끼는 치팅이 발생하거나, 인풋 토큰이 비정상적으로 폭증한다.
- 분석 대상 파일의 기하 메타데이터와 본문 텍스트를 파일 스트림 프롬프트로 공급하여 격리된 순수 추론을 보장해야 한다.
