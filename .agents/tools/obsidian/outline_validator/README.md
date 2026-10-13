# 🛡️ Outline Schema & Integrity Validator

옵시디언 아웃라이너 플러그인(`@vibe/outliner-obsidian`)이 열 수 있는 `.outline` 파일의 **Zod 런타임 스키마(`projectSchema`) 호환성**, **노드 고유 ID 무결성**, **트리 순환 참조 여부**, **줄끝 규격(LF)**을 기계적으로 자동 검증하는 전용 린터 도구입니다.

---

## 🎯 설계 목적

1. **런타임 크래시 원천 차단**:
   - `version: "1.0.0"` 문자열 누락, 최상위 `id` 누락 등 옵시디언 화면에서 `"아웃라인 파일 규격이 아니라서 열 수 없습니다"` 에러를 유발하는 요소를 저장 전/후에 기계적으로 사전 탐지합니다.
2. **규칙 확장성 보장 (Layered Architecture)**:
   - `validator`와 동일한 다층 레이어 구조(`rules/layer1_*.py`, `rules/layer2_*.py`, `rules/layer3_*.py`)를 채택하여, 향후 체크 항목이 늘어나도 규칙 클래스만 추가하면 즉시 통합 검사에 반영됩니다.
3. **원클릭 자동 수복 (`--fix`)**:
   - 누락된 `id` 자동 발급, 버전 문자열(`"1.0.0"`) 보정, `defaultView: "bullets"` 삽입, CRLF ➔ LF 정규화를 자동으로 고쳐줍니다.

---

## 📋 검증 규칙 카탈로그 (Rule Catalog)

| 레이어 | 규칙 ID | 검사 항목 | 설명 |
| :--- | :--- | :--- | :--- |
| **Layer 1** | `OUT-SPEC-000` | 유효한 JSON 객체 | 파일이 올바른 JSON 파싱 구조인지 검사 |
| (최상위 스키마) | `OUT-SPEC-001` | 스키마 버전 문자열 | `version`이 반드시 문자열 `"1.0.0"`인지 검사 (숫자 `1` 차단) |
| | `OUT-SPEC-002` | 최상위 프로젝트 ID | 최상위 `id`가 1자 이상의 고유 문자열인지 검사 |
| | `OUT-SPEC-003` | 최상위 Title | 최상위 `title` 문자열 필드 존재 여부 검사 |
| | `OUT-SPEC-004` | rootNodes 배열 | `rootNodes`가 리스트(배열) 형태인지 검사 |
| | `OUT-SPEC-005` | defaultView 허용값 | `defaultView`가 `'bullets'` 또는 `'board'`인지 검사 |
| | `OUT-SPEC-006` | 타임스탬프 규격 | `createdAt`, `updatedAt`이 숫자 밀리초인지 검사 |
| **Layer 2** | `OUT-NODE-001` | 노드 필수 필드 | 모든 노드에 `id`, `text`, `children`이 존재하는지 검사 |
| (노드 트리 무결성) | `OUT-NODE-002` | 노드 ID 고유성 | 트리 내 모든 노드의 `id` 중복 여부 검사 |
| | `OUT-NODE-003` | 노드 자식 배열 | `children`이 리스트 형태인지 검사 |
| | `OUT-NODE-004` | 순환 참조 탐지 | 부모-자식 트리 간의 순환 참조(Cycle)를 탐지 |
| | `OUT-NODE-005` | nodeType 규격 | 지원되는 9대 노드 타입(`bullet`, `h1`, `h2`, `h3`, `todo` 등)인지 검사 |
| | `OUT-NODE-006` | 딸린 파일 스키마 | `file` 속성이 있을 때 `target` 경로가 존재하는지 검사 |
| **Layer 3** | `OUT-LNK-001` | 위키링크 괄호 정합성 | 노드 텍스트 내 `[[`와 `]]` 짝이 맞는지 검사 |
| (거버넌스) | `OUT-GOV-001` | LF 줄끝 규격 | CRLF(`\r\n`) 오염을 차단하고 LF(`\n`) 강제 |

---

## 💻 사용법 (CLI Usage)

### ① 단일 .outline 파일 검증
```bash
python .agents/tools/obsidian/outline_validator/validate_outline.py "c:\경로\파일.outline"
```

### ② 디렉토리 내 모든 .outline 파일 일괄 검사
```bash
python .agents/tools/obsidian/outline_validator/validate_outline.py --dir "c:\망고독 관련 자료\프로젝트_매니지먼트\What-s-in-my-head"
```

### ③ 스키마 결함 자동 수복 (Auto-fix)
```bash
python .agents/tools/obsidian/outline_validator/validate_outline.py "c:\경로\파일.outline" --fix
```
