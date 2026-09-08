# 07.debug: agy CLI 실행 트레이스 및 Vision 인지 검증 디버거

## 1. PDF 원본이 분석에 반영되는 원리

`agy -p` (Print 모드)에 프롬프트로 문서의 **절대 경로(Absolute Path)**가 주어지고 `--dangerously-skip-permissions` 플래그가 활성화되면:
1. CLI 내의 에이전트는 프롬프트에 명시된 파일 경로를 인지하고 내장 도구 **`view_file(AbsolutePath="...")`**를 자동 호출합니다.
2. PDF 및 이미지 파일의 경우 바이너리 뷰어를 통해 멀티모달 컨텍스트로 전달되어 시각적 레이아웃(헤더 밑줄, 2열 표 그리드, 서명란, 폰트 위계)을 모델이 직접 열람합니다.
3. 시각적 구조와 기하 텍스트를 결합하여 최종 JSON 구조를 도출합니다.

---

## 2. 어떻게 확인하고 디버깅할 수 있는가?

### A. Conversation ID 기반 트레이스 추적
`agy` CLI는 `--output-format json` 플래그를 주면 실행 세션의 고유 식별자인 `conversation_id`와 토큰 사용량을 반환합니다:
```json
{
  "conversation_id": "72a65aad-05a9-43d0-8a2d-f7b61218a331",
  "status": "SUCCESS",
  "response": "...",
  "duration_seconds": 15.2,
  "usage": { "input_tokens": 15000, "output_tokens": 400 }
}
```

### B. 로컬 Transcript 로그 검증
CLI의 모든 세션 로그는 다음 경로에 영구 기록됩니다:
```text
C:\Users\<USER>\.gemini\antigravity-cli\brain\<conversation_id>\.system_generated\logs\transcript.jsonl
```
이 파일 안에서:
* `Step 0`: 사용자 프롬프트 전달
* `Step 1`: 모델의 도구 호출 (`view_file(AbsolutePath=...)`)
* `Step 2`: PDF 바이너리/시각 렌더링 데이터 반환
* `Step 3`: 모델의 최종 결과 도출

---

## 3. 디버깅 스크립트 사용법

`07.debug` 디렉터리에 제공되는 디버거를 실행하면, CLI가 실제로 PDF를 열었는지(`view_file` 호출 여부), 어떤 시각적 정보를 인지했는지를 즉시 검증할 수 있습니다:

```bash
# 특정 문서에 대한 CLI 시각 인지 및 실행 트레이스 즉시 디버깅
python workbench/05.llm_tuning/01.outline_extraction/07.debug/inspect_cli_execution.py --doc 11월_디딤돌_회의록

# 임의의 PDF 파일 경로 직접 검증
python workbench/05.llm_tuning/01.outline_extraction/07.debug/inspect_cli_execution.py --pdf "C:/path/to/document.pdf"
```
