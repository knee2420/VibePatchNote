# [Patch Note] {패치 주제 요약 타이틀}

* **기록 일시**: YYYY-MM-DD HH:mm:ss
* **문서 경로**: `workbench/03.patch_note/YYYY-MM-DD/patch_note_{name}.md`
* **대상 컴포넌트**: `{수정되거나 영향받은 주요 파일 목록}`
* **선행 패치**: `{직전 패치 카드 파일명 또는 '해당 없음'}`

---

## 📥 1. 사용자 요청 내용 (User Request & Assets)

### 💬 사용자 요청 원문
> {사용자의 요청 텍스트를 그대로 인용합니다.}

### 🖼️ 사용자 제공 에셋 및 스크린샷 (User Attachments)
- ![사용자 첨부 캡처](file:///{사용자_첨부_이미지_절대경로})
- *(첨부된 파일이 없는 경우 "첨부 에셋 없음" 명시)*

---

## 🛠️ 2. Agent 수행 내용 요약 (Execution Summary)

### 🔍 1) 원인 및 현상 분석 (Root Cause Analysis)
- **발생 증상**: {사용자가 겪었던 불편/문제점 또는 신규 구현 필요성}
- **기술적 근본 원인**: {코드 레벨에서 왜 문제가 발생했었는지 분석}

### 💻 2) 핵심 코드 및 아키텍처 수정 내역 (Core Improvements)
- **{수정 대상 파일명 1}**:
  - {핵심 수정 로직 및 메커니즘 설명}
- **{수정 대상 파일명 2}**:
  - {핵심 수정 로직 및 메커니즘 설명}

### 🛡️ 3) 품질 게이트 검증 결과 (Verification Gates)
| 검증 도구 | 실행 명령어 | 검증 결과 | 상태 |
| :--- | :--- | :--- | :---: |
| **TypeScript** | `pnpm --filter @vibe/web typecheck` | 오류 0건 | ✅ 통과 |
| **Oxlint / ESLint** | `pnpm --filter @vibe/web lint` | 오류 0건 (경고 n건 유지) | ✅ 통과 |
| **Vite Build** | `pnpm --filter @vibe/web build` | 번들 빌드 정상 완료 | ✅ 통과 |

---

## 🎯 3. 수행 결과 요약 (Result Summary & Outcome)

### ✨ 1) 최종 반영 상태 (Final State)
- {사용자 관점에서 무엇이 개선되었는지 핵심 기능/UI 동작을 항목별로 요약}

### 📦 2) 추천 Git 커밋 가이드 (Conventional Commits)
```bash
git add {변경된 파일 목록}
git commit -m "{type}({scope}): {커밋 제목}"
```
