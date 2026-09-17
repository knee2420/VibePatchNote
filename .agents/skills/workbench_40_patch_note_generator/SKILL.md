---
name: patch_note_generator
description: "사용자가 '/patch_note_generator'를 호출하거나 '패치노트 작성해줘', '방금 작업 결과 이력 남겨줘'라고 지시할 때 발동합니다. [요청 내용(첨부 파일 포함) -> agent 수행 내용 요약 -> 수행 결과 요약] 구성의 불변 패치노트 카드를 workbench/03.patch_note/YYYY-MM-DD/에 자동 생성하고 README.md 인덱스를 현행화합니다."
---

# Skill: Patch Note Generator

## 1. 목적
대화 및 작업 세션 중 사용자가 원할 때 명시적으로 호출하여, 직전 작업(또는 세션 전체)의 맥락을 **`[사용자 요청(첨부 파일 포함)] ➔ [Agent 수행 내용 요약] ➔ [수행 결과 요약]`** 구조로 완벽히 정리된 독립 패치노트 카드(Immutable Patch Card)로 `workbench/03.patch_note/YYYY-MM-DD/` 하위에 자동 생성하고 아카이브 인덱스를 현행화합니다.

## 2. 트리거 조건
사용자가 다음과 같은 의도로 지시할 때 발동합니다:
- `/patch_note_generator` 또는 `/patch` 슬래시 커맨드 입력
- "방금 작업 패치노트에 남겨줘"
- "이 작업 내용 이력 카드로 정리해줘"
- "지금까지 한 거 03.patch_note에 기록해줘"

---

## 3. 핵심 원칙 (Core Principles)

### 1) 1작업 = 1카드 불변성 원칙 (Immutable Patch Card)
- 기존에 작성된 패치노트 파일을 **절대 덮어쓰거나 수정하지 않습니다**.
- 새로운 작업 단위마다 반드시 독립된 새 카드 파일(`patch_note_{주제}.md`)을 생성합니다.
- 동일한 주제로 추가 패치를 진행한 경우 파일명 뒤에 `_02`, `_03` 등의 순번을 부여합니다.

### 2) 날짜 기반 폴더 단일화 (`YYYY-MM-DD`)
- 모든 카드는 당일 날짜 폴더(`workbench/03.patch_note/YYYY-MM-DD/`) 내부에 배치합니다.
- 폴더가 없으면 에이전트가 자동으로 생성합니다.

### 3) 3대 필수 섹션 누락 금지
- **섹션 1: 사용자 요청 내용 (User Request & Assets)**
  - 사용자 프롬프트 텍스트를 인용 블록(`>`)으로 보존.
  - 사용자가 첨부한 이미지(`.user_uploaded/media_xxx.png`)나 파일이 있을 경우 시스템 로컬 절대 경로를 마크다운 이미지/링크로 필히 삽입.
- **섹션 2: Agent 수행 내용 요약 (Execution Summary)**
  - 문제 발생 근본 원인(Root Cause), 코드 수정 내역(Core Changes), 품질 게이트 검증 결과(`typecheck`, `oxlint`, `build` 등) 포함.
- **섹션 3: 수행 결과 요약 (Result Summary & Outcome)**
  - 최종 반영 상태 및 추천 Git Conventional Commits 명령어 제공.

---

## 4. 실행 4단계 워크플로우

### Step 1: 컨텍스트 및 에셋 수집 (Context Extraction)
1. 최근 대화의 `USER_INPUT`에서 사용자 요청 텍스트 및 첨부 미디어 파일(`.user_uploaded/media_*.png` 등) 경로를 추출합니다.
2. 에이전트가 실제로 수정한 소스코드 파일 경로와 diff 요약, 그리고 통과한 터미널 검증 결과(에러 0건 등)를 정리합니다.

### Step 2: 저장 폴더 및 파일명 결정
1. 현재 날짜를 확인합니다 (예: `2026-09-17`).
2. 저장 디렉토리 경로: `workbench/03.patch_note/{YYYY-MM-DD}/`
3. 파일명 규칙: `patch_note_{간결한_작업_주제_snake_case}.md`
   *(예: `patch_note_resource_manager_scrollbar_and_thumbnails.md`)*
4. 파일이 이미 존재하는지 확인하고, 중복 시 접미사를 붙여 기존 파일의 불변성을 보장합니다.

### Step 3: 카드 작성 (`templates/patch_note_card_template.md` 준수)
1. `templates/patch_note_card_template.md`의 형식을 바탕으로 누락 없이 충실하게 마크다운 카드를 작성합니다.
2. 모든 파일 경로는 반드시 clickable 마크다운 링크(`[파일명](file:///절대경로)`) 형식을 지킵니다.

### Step 4: 아카이브 인덱스(`workbench/03.patch_note/README.md`) 현행화 및 보고
1. `workbench/03.patch_note/README.md`의 `## 4. 현재 보관된 패치노트 색인 (Archive Index)` 섹션을 찾아, 해당 날짜 표에 새 카드를 한 줄 추가합니다.
   - 해당 날짜의 소제목(`### 📅 YYYY-MM-DD`)이 없으면 표와 함께 새로 생성합니다.
2. 작성이 완료되면 사용자에게 새 카드의 clickable 링크와 함께 핵심 요약을 보고합니다.
