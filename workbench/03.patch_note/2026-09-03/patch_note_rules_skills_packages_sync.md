# [Patch Note] .agents Rules & Skills 모노레포(Packages) 사양 동기화 패치

* **버전(Version)**: `v1.3.1-rules-sync` (규칙 및 스킬 거버넌스 동기화 릴리즈)
* **릴리즈 일자(Release Date)**: `2026-09-03`
* **문서 경로**: `workbench/03.patch_note/2026-09-03/patch_note_rules_skills_packages_sync.md`
* **선행 패치**: `patch_note_document_viewer_package.md` (v1.3.0-viewer-package)
* **대상 컴포넌트**: `.agents/rules` (5건), `.agents/skills` (2건), `workbench/README.md`

---

## 📌 1. 개요 (Executive Summary)

* **배경**:
  * `packages/document-viewer` 신설로 프로젝트가 정식 Turborepo 모노레포 구조(`apps/` + `packages/`)로 승격되었으나, 기존 `.agents/rules`와 `.agents/skills`에는 프론트엔드 작업 경로가 `apps/web/src/` 단일 앱에만 제한되어 있거나 레거시 경로(`frontend/`)가 남아있었음.
* **목표**:
  * `.agents/rules` 및 `.agents/skills` 전체 27개 파일을 전수 조사(Full Scan)하여, 신설된 `packages/*` 워크스페이스 패키지 사양과 이식성 원칙을 전면 반영하고 규칙 시스템을 최신 상태로 영구 동기화.

---

## 🔬 2. 핵심 변경 및 패치 내역 (Core Improvements)

### 1) 프론트엔드 핵심 스킬 2종 모노레포 사양 확장
* **[`develop_50_front_generator/SKILL.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/.agents/skills/develop_50_front_generator/SKILL.md)**:
  * **체크리스트 5번 (모노레포 위치 검증)**: 단일 앱 전용 코드는 `apps/web/src/`, 여러 툴에서 공통 재사용되는 범용 UI/엔진은 `packages/[패키지명]/src/`에 배치하고 `workspace:*`로 연결하도록 규정 확장.
  * **체크리스트 1번 & 4번**: FSD 계층에서 워크스페이스 공용 패키지(`@vibe/*`)를 참조하는 규칙 및 Google TS Style Guide의 Import 분리 규정(`NPM` ➔ `@vibe/...` ➔ `@/...`) 명시.
* **[`develop_50_reference_front_generator/SKILL.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/.agents/skills/develop_50_reference_front_generator/SKILL.md)**:
  * 레퍼런스 사전 조사 시 기존 기술 스택 매핑 대상에 **`@vibe/document-viewer`**를 공식 추가하여 공용 패키지 재사용 가능 여부를 선제 검토하도록 개정.

---

### 2) 개발 아키텍처 및 프론트엔드 컨벤션 동기화
* **[`50-develop/convention/architecture/rule.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/.agents/rules/50-develop/convention/architecture/rule.md)**:
  * 모노레포 구조 틀에 **`packages/document-viewer`: 호스트 비의존적 범용 문서 뷰어 및 플러그인 엔진 (`@vibe/document-viewer`)**을 실물 패키지로 공식 등록.
* **[`50-develop/convention/front/rule.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/.agents/rules/50-develop/convention/front/rule.md)**:
  * **"섹션 6. 모노레포 공용 패키지(`packages/*`) 분리 및 임포트 원칙"** 신설.
* **[`20-modularity/plug-and-play.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/.agents/rules/20-modularity/plug-and-play.md)**:
  * 파일 복사 수준을 넘어선 **"3. 모노레포 패키지 승격 (Extraction to `packages/*`)"** 원칙 제정.

---

### 3) 툴 체인 명령어 및 레거시 잔재 청산
* **[`50-develop/auto-fix-loop.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/.agents/rules/50-develop/auto-fix-loop.md)**:
  * 검증 명령어를 Turborepo 모노레포 표준(`pnpm -F frontend build`, `pnpm build`)으로 현행화.
* **[`20-modularity/ui-shadcn-first.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/.agents/rules/20-modularity/ui-shadcn-first.md)**:
  * 구식 경로(`frontend/`)를 **`apps/web/src/components/ui/`**로 수정.
* **[`40-workbench/overview.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/.agents/rules/40-workbench/overview.md)**:
  * 소스코드 분류를 `apps/`, `packages/`로 현행화하고, **`03.patch_note/` (불변 패치노트 아카이브)**를 공식 디렉토리 체계로 등록.

---

## 📊 3. 동기화 파일 요약

| 구분 | 파일 경로 | 변경 요약 |
| :--- | :--- | :--- |
| **Skill** | `develop_50_front_generator/SKILL.md` | 모노레포 `packages/*` 위치 검증 및 FSD 연동 체크리스트 추가 |
| **Skill** | `develop_50_reference_front_generator/SKILL.md` | `@vibe/document-viewer` 기술 매핑 및 위치 검증 추가 |
| **Rule** | `50-develop/convention/architecture/rule.md` | `packages/document-viewer` 정식 워크스페이스 구조 등록 |
| **Rule** | `50-develop/convention/front/rule.md` | 섹션 6 모노레포 공용 패키지 분리 및 임포트 원칙 신설 |
| **Rule** | `20-modularity/plug-and-play.md` | 3. 모노레포 패키지 승격 원칙 신설 |
| **Rule** | `50-develop/auto-fix-loop.md` | `pnpm -F frontend build` 모노레포 검증 명령어 표준화 |
| **Rule** | `20-modularity/ui-shadcn-first.md` | 레거시 경로 `frontend/` ➔ `apps/web/` 수정 |
| **Rule** | `40-workbench/overview.md` | `apps/`, `packages/` 경로 현행화 및 `03.patch_note/` 등록 |

---

## ✅ 4. 최종 검증 결과

* **TypeScript 컴파일 & Vite 번들링**:
  * `pnpm -F frontend build` → **4.49초 완료 (Exit Code 0)**
* **코드 린트(Oxlint)**:
  * `pnpm -F frontend lint` → **오류 0건 통과**

---

* **작성자**: Antigravity Assistant Pair Programmer
* **문서 검토 완료**: 2026-09-03
