# 🛡️ Obsidian Note Syntax & Frontmatter Validator (`.agents/tools/obsidian/validator`)

이 도구는 **외부 옵시디언 볼트(`What-s-in-my-head`)의 마크다운 카드를 기계적으로 검증하여 문법 오류, Electron 렌더링 결함(빨간 박스 크래시), 속성 누락, 거버넌스 규칙 위반을 스스로 탐지하고 교정하는 독립 실행형 CLI 린터 엔진**입니다.

---

## 🏷️ 아키텍처 및 룰 엔진 구조

`validate_obsidian_note.py`는 단일 실행 엔트리포인트이며, 실제 검증 규칙은 `rules/` 패키지에 레이어별로 모듈화되어 있습니다:

```text
.agents/tools/obsidian/validator/
├── validate_obsidian_note.py       # 🚀 CLI 엔트리포인트
├── README.md                       # 📖 도구 설명서
└── rules/                          # ⚙️ 모듈화된 린트 엔진
    ├── base.py                     # LintRule 추상 베이스 클래스 & LintContext / LintViolation 정의
    ├── layer1_syntax.py            # [Layer 1] 옵시디언 Electron 렌더링 문법 (비따옴표 콜론, CRLF, float 방지 등)
    ├── layer2_classification.py    # [Layer 2] 볼트 경로 기반 단일 분류 원칙 (Single Class Policy)
    ├── layer3_decisions.py         # [Layer 3] 결정 카드 상태 무결성 및 원본 링크 혈통 추적
    └── layer3_system_ground_rules.py # [Layer 3] 시스템 그라운드 룰 (버그 칩 무결성 등)
```

---

## 🔍 핵심 린팅 항목 (The Core Linter Checks)

| 레이어 | 린팅 항목 | 결함 조건 | 자동/권고 교정 행동 |
| :--- | :--- | :--- | :--- |
| **Layer 1** | **비따옴표 콜론 공백** | 큰따옴표 없이 `: `가 포함되어 키 매핑 오류 유발 | 문자열 전체를 큰따옴표(`"..."`)로 감싸고 내부 콜론을 대시(`—`) 치환 |
| **Layer 1** | **줄끝 LF 검사 (CRLF)** | 윈도우 `\r\n`(CRLF)이 검출될 때 | 줄바꿈을 `\n`(LF)으로 정규화 |
| **Layer 1** | **YAML 기본 구문** | `yaml.safe_load` 구문 에러 | 들여쓰기 2칸 정렬 및 따옴표 닫힘 교정 |
| **Layer 1** | **리스트 위키링크 안전성** | `- [[이름]]` (비따옴표 리스트 링크) | `- "[[이름]]"` 형태로 큰따옴표 감싸기 |
| **Layer 1** | **multitext float 캐스팅 방지** | `분류`, `주제`에 따옴표 없는 마침표 숫자(`- 09.30`) | 큰따옴표 감싸 문자열(`- "09.30"`)로 작성 |
| **Layer 2** | **단일 분류 정책 (Single Class)** | `1.project`에서 하위 서브폴더명이 다중 침범했을 때 | 최상위 1레벨 프로젝트 관리 폴더명 단 1개만 유지 |
| **Layer 3** | **결정 카드 상태 무결성** | `discussions/*/decisions/` 카드가 `결정 사항`이 아닐 때 | 상태를 `결정 사항`으로 통일 |
| **Layer 3** | **데이터 혈통 추적** | `Decision N` 카드의 `링크:`에 원본 회의록 위키링크 누락 | 원천 회의록/공유회 아웃풋의 `[[D{N}_...]]` 필수 바인딩 |
| **Layer 3** | **버그 칩 무결성** | `🐛 버그 리포트` 카드의 `작성자`에 `[[bug]]` 누락 | 칸반 보드 식별을 위해 `작성자`에 `[[bug]]` 추가 |

---

## 🚀 빠른 실행 가이드 (Quick CLI Usage)

### 1. 단일 마크다운 노트 검증
```bash
python .agents/tools/obsidian/validator/validate_obsidian_note.py "<파일경로.md>"
```

### 2. 특정 디렉터리 내 전체 노트 일괄 검증
```bash
python .agents/tools/obsidian/validator/validate_obsidian_note.py --dir "<폴더경로>"
```

### 3. Excalidraw 마크다운 도면 검증
Excalidraw 도면(`.md`) 상단의 Frontmatter 무결성 및 줄끝 LF 검사에도 동일하게 사용할 수 있습니다:
```bash
python .agents/tools/obsidian/validator/validate_obsidian_note.py "<Excalidraw도면.md>"
```
