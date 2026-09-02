---
title: "agy-cli Python Subprocess 연동 가이드 (Headless & Encoding)"
description: "agy-cli를 파이썬 스크립트에서 호출할 때 발생하는 권한 거부 및 윈도우 인코딩 문제 해결 규칙"
---

# Rule: agy-cli Python Subprocess 연동 가이드

## 1. 목적
에이전트나 시스템이 `agy-cli`를 백그라운드 스크립트(Python `subprocess` 등)에서 호출하여 파일 분석/자동화 작업을 수행할 때 흔히 발생하는 권한 차단 및 인코딩 이슈를 원천 차단한다.

## 2. 필수 규칙 (Troubleshooting)

### A. Headless 환경에서의 권한 우회 (`--dangerously-skip-permissions`)
- `agy-cli`를 스크립트에서 자동 실행할 때(예: 파일 읽기 도구 사용), CLI는 사용자에게 권한 승인 프롬프트를 띄울 수 없어(Headless) **자동 거부(Auto-denied)** 처리 후 빈 응답을 반환한다.
- **해결책**: 스크립트에서 CLI 호출 시 **반드시 `--dangerously-skip-permissions` 플래그를 추가**해야 한다.
- 예시: 
  ```python
  cmd = ["agy", "-p", prompt, "--dangerously-skip-permissions"]
  ```

### B. 윈도우 콘솔 UTF-8 인코딩 (cp949 에러 방지)
- 윈도우 환경에서 `subprocess.run` 캡처 후 `print(result.stdout)` 수행 시, 이모지(📋)나 특수문자가 포함된 AI의 출력이 `cp949` 코덱으로 인코딩을 시도하다가 `UnicodeEncodeError`를 뱉고 강제 종료되는 현상이 잦다.
- **해결책 1 (Python 전역 설정)**: 스크립트 최상단에 `sys.stdout.reconfigure(encoding='utf-8')` 추가.
- **해결책 2 (파일로 직접 쓰기 - 권장)**: `subprocess` 결과를 화면에 `print()` 하지 말고, `encoding="utf-8"` 옵션을 적용한 파일 객체에 직접 `write()` 하라.
  ```python
  with open("output.md", "w", encoding="utf-8") as f:
      f.write(result.stdout)
  ```

### C. 프로그래밍 연동 시 구조화된 데이터 파싱 (`--output-format json`)
- 텍스트 응답 대신 CLI 호출 결과를 Python 내에서 객체로 쉽게 다루려면, 파이프라인에서 텍스트 기반 `-p` 대신 아래 조합을 사용하라.
- **해결책**: `--output-format json` 플래그를 추가하고, `stdin=subprocess.PIPE`를 통해 프롬프트를 주입한 뒤 결과의 `stdout`을 `json.loads()`로 파싱한다. (참조: `obsidian_tuning/scripts/ai_indexer.py`)
