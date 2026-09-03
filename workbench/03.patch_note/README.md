# 📜 VibePatchNote 패치 노트 관리 시스템 (Patch Note System)

본 디렉토리(`workbench/03.patch_note`)는 VibePatchNote 프로젝트의 모든 아키텍처 진화, 기능 구현, 성능 튜닝, 트러블슈팅 내역을 **타임라인별 불변 카드(Immutable Patch Card)** 형태로 영구 보존하고 이력을 관리하는 공식 패치노트 아카이브입니다.

---

## 🏛️ 1. 핵심 철학 및 관리 대원칙

### 1) 날짜 기반 디렉토리 단일화 (`YYYY-MM-DD`)
* `workbench/03.patch_note/` 바로 하위에는 **오직 날짜 폴더(`YYYY-MM-DD`)**만 생성합니다.
* 폴더명에 작업 내용이나 수식어를 붙이지 않으며, 모든 주제별 구분은 폴더 내부의 개별 카드 파일명으로 수행합니다.

### 2) 1패치 = 1카드 불변성 원칙 (Immutable Patch Card)
* **절대 기존 패치노트 파일을 덮어쓰거나 내용을 누적하여 수정하지 않습니다.**
* 새로운 패치 작업, 추가 최적화, 긴급 핫픽스, 커밋 단위가 발생할 때마다 반드시 **새로운 카드 파일(`patch_note_{패치_주_내용}.md`)을 독립 생성**합니다.
* **이유**: 소프트웨어의 시행착오, 가설 검증, 성능 지표의 진화 과정을 왜곡 없이 타임라인별로 완벽하게 **감사 및 이력 관리(Audit Trail & History Tracking)**하기 위함입니다.

---

## 📂 2. 디렉토리 구조 및 네이밍 규칙

### 📁 디렉토리 구조
```
workbench/03.patch_note/
├── README.md                                  # [본 가이드] 패치노트 시스템 운영 원칙 및 인덱스
└── YYYY-MM-DD/                               # 해당 날짜의 작업 디렉토리
    ├── patch_note_initial.md                 # 1차 초기 릴리즈 이력 카드
    ├── patch_note_{패치_주_내용_1}.md         # 특정 작업 단위별 독립 이력 카드
    └── patch_note_{패치_주_내용_2}.md         # 후속 튜닝/핫픽스 단위별 독립 이력 카드
```

### 🏷️ 파일 네이밍 컨벤션
* 형식: **`patch_note_{패치_주_내용}.md`** (소문자 snake_case)
* 예시:
  * `patch_note_initial.md` : 최초 시스템 및 기능 구축
  * `patch_note_performance_optimization.md` : 1차 성능 개선 및 핵심 병목 제거
  * `patch_note_micro_stutter_tuning.md` : 미세 스터터 튜닝 및 rAF 배칭
  * `patch_note_canvas_search_modal.md` : 캔버스 검색 모달 신규 추가

---

## 📋 3. 패치노트 표준 카드 템플릿 (Standard Card Template)

새로운 패치노트 카드를 작성할 때는 항상 아래의 표준 목차 구조를 준수하여 고밀도로 작성합니다:

```markdown
# [Patch Note] {패치 타이틀 요약}

* **버전(Version)**: `vX.Y.Z-{tag}`
* **릴리즈 일자(Release Date)**: `YYYY-MM-DD`
* **문서 경로**: `workbench/03.patch_note/YYYY-MM-DD/patch_note_{name}.md`
* **선행 패치**: `{직전 패치 카드 파일명}` (해당 시)
* **대상 컴포넌트**: `{수정/영향받은 모듈 및 파일 목록}`

---

## 📌 1. 개요 (Executive Summary)
- 패치의 배경, 목적 및 달성하고자 하는 목표 서술

## 🔍 2. 핵심 원인 분석 및 해결 내역 (Core Improvements)
- 발생 증상 / 근본 원인 / 최종 해결책을 대조하여 상세 기술
- 코드 수준의 핵심 메커니즘 설명

## 📊 3. 최적화 전/후 비교 (Before vs After)
- 정량적 수치 비교표 (FPS, 로딩 속도, 번들 크기, 에러 발생 횟수 등)

## 🛠️ 4. 변경 파일 목록 및 Git Diff 분석 (Git Diff Analysis)
- 파일별 수정 요약 및 변경 내역

## ✅ 5. 최종 검증 결과 (Verification Results)
- TypeScript 빌드 결과, 린트 검사 결과, 런타임 동작 확인

## 📦 6. Git Staging 명세 및 추천 커밋 메시지 (Commit Guide)
- Staged 파일 요약 및 복사하여 바로 실행 가능한 Conventional Commits 명령어 제공
```

---

## 📚 4. 현재 보관된 패치노트 색인 (Archive Index)

### 📅 `2026-09-03`
| 번호 | 카드 파일명 | 버전 | 주제 요약 |
| :---: | :--- | :---: | :--- |
| **01** | [`patch_note_initial.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/03.patch_note/2026-09-03/patch_note_initial.md) | `v1.0.0-initial` | 하이브리드 에디터 보드 초기 구축 (DnD Registry, 옵시디언 툴바, 헵타베이스 좌측 독, 피그마 액션바, 검색 모달, 세션 관리) |
| **02** | [`patch_note_performance_optimization.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/03.patch_note/2026-09-03/patch_note_performance_optimization.md) | `v1.1.0-perf` | 1차 성능 최적화 (초당 169회 엣지 핸들 에러 박멸, 노란색 카드 nodrag 제거, 도트 배경 75% 경량화, 세션 덮어쓰기 방지 락) |
| **03** | [`patch_note_micro_stutter_tuning.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/03.patch_note/2026-09-03/patch_note_micro_stutter_tuning.md) | `v1.2.0-butter-smooth` | 2차 심화 튜닝 (rAF 이벤트 배칭으로 마우스 폴링 스터터 제거, CSS contain 격리로 리플로우 0ms, 손떨림 방지 임계값 적용) |
| **04** | [`patch_note_document_viewer_package.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/03.patch_note/2026-09-03/patch_note_document_viewer_package.md) | `v1.3.0-viewer-package` | PDF 가로 스프레드 엔진 및 `@vibe/document-viewer` 공용 워크스페이스 패키지 추출 (Turborepo 솔루션 준수) |
| **05** | [`patch_note_rules_skills_packages_sync.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/03.patch_note/2026-09-03/patch_note_rules_skills_packages_sync.md) | `v1.3.1-rules-sync` | `.agents` Rules & Skills 전수 조사 및 모노레포(`packages/*`) 사양 거버넌스 동기화 |

---

* **최초 제정일**: 2026-09-03
* **관리 주체**: VibePatchNote Core Development Team & Antigravity Pair Programmer
