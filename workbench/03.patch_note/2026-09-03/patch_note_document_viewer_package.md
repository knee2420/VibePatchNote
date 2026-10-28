# [Patch Note] PDF 가로 스프레드 엔진 및 @vibe/document-viewer 공용 패키지 추출

* **버전(Version)**: `v1.3.0-viewer-package` (모노레포 패키지 추출 릴리즈)
* **릴리즈 일자(Release Date)**: `2026-09-03`
* **문서 경로**: `workbench/03.patch_note/2026-09-03/patch_note_document_viewer_package.md`
* **선행 패치**: `patch_note_micro_stutter_tuning.md` (v1.2.0-butter-smooth)
* **참조 아키텍처 파이프라인**: [`workbench/96.data_pipeline/turborepo/03_the_monorepo_solution/C-03_the_monorepo_solution.md`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/96.data_pipeline/turborepo/03_the_monorepo_solution/C-03_the_monorepo_solution.md)
* **대상 컴포넌트**: `packages/document-viewer`, `ReferenceDocumentNode`, `apps/web/package.json`

---

## 📌 1. 개요 (Executive Summary)

* **배경**:
  * 기존에는 사용자가 PDF 문서를 볼 때 세로 한 장씩 스크롤하며 앞뒤 맥락을 파악하기 위해 페이지를 일일이 수동 캡처하여 배치하는 비효율이 있었음.
  * 또한 이 가로/세로 뷰어 및 포맷별 라우팅 엔진은 `VibePatchNote` 외에도 향후 제작될 4가지 다른 툴(사이드바 서랍, 모달, 분할 뷰 등)에서 공통으로 사용될 핵심 스펙임.
* **목표**:
  * 원클릭으로 1~14페이지 전체를 가로 필름 스트립으로 펼쳐주는 **[PDF 가로 스프레드(Unfold) 엔진]** 구현.
  * Turborepo 지식 파이프라인(`C-03_the_monorepo_solution`) 원칙에 따라, 캔버스 종속성이 전혀 없는 순수 공용 패키지 **`packages/document-viewer` (`@vibe/document-viewer`)**로 추출하여 완벽한 재사용성 확보.

---

## 🔬 2. 핵심 구현 내역 (Core Improvements)

### 1) `packages/document-viewer` 공용 워크스페이스 패키지 신설
* **패키지 명칭**: `@vibe/document-viewer` (`packages/document-viewer/`)
* **특징**:
  * **호스트 비의존성(Host-Agnostic)**: React Flow나 특정 앱 상태에 결합되지 않는 순수 React 뷰어 엔진.
  * **전략 패턴 레지스트리 (`ViewerRegistry`)**: 확장자(`pdf`, `md`, `img`, `fallback`)에 따라 알맞은 뷰어를 동적으로 라우팅.
  * **PDF.js CDN Worker 격리 (`pdfWorkerSetup.ts`)**: Vite 8 번들 환경에서 메모리 누수 없이 안정적인 백그라운드 파싱 보장.

---

### 2) PDF 원클릭 가로 스프레드 뷰어 (`PdfViewer.tsx`)
* **세로 기본 모드 (Collapsed)**: `w-[600px]`, 세로 스크롤로 읽기 편한 단일 뷰.
* **가로 펼침 모드 (Spread / Unfold)**: 
  * 카드 우측 중앙의 **`>` 플로팅 버튼** 클릭 시 카드가 `w-[1400px]`로 확장.
  * `Array.from({ length: numPages })`를 통해 1페이지부터 14페이지까지 **실제 종이 문서처럼 가로(`flex-row gap-6 overflow-x-auto`)로 일렬 전개**.
  * 각 페이지별 섀도우 및 `1 / 14`, `2 / 14` 등 정밀 인디케이터 라벨 자동 렌더링.

---

### 3) 캔버스 노드 공통 쉘 (`ReferenceDocumentNode.tsx`) FSD 연동
* 캔버스 노드는 공통 쉘(테마, 드래그 헤더, 삭제, 핸들, 크기 애니메이션)만 담당.
* 내부 뷰어는 `@vibe/document-viewer`로부터 `viewerRegistry`를 통해 주입받아 완벽한 관심사 분리(SoC) 및 개방-폐쇄 원칙(OCP) 달성.

---

## 📊 3. 최적화 전/후 비교 (Before vs After)

| 항목 | 기존 (v1.2.0) | 개선 후 (v1.3.0) | 개선 효과 |
| :--- | :--- | :--- | :--- |
| **PDF 다중 페이지 열람** | 세로 1장씩 스크롤 or 수동 캡처 | **원클릭 가로 전체 펼침 (`>`)** | **수작업 캡처 비용 0초** |
| **뷰어 모듈 재사용성** | `apps/web` 내부에 강결합 | **`packages/document-viewer` 독립** | **향후 4개 툴 100% 재사용** |
| **포맷 확장 구조** | 단일 if/else 스파게티 우려 | **전략 패턴 레지스트리 플러그인** | 신규 포맷 추가 시 1파일로 해결 |
| **프론트엔드 빌드 시간** | 1.76초 | **1.84초 (Exit Code 0)** | 패키지 분리 후에도 초고속 유지 |

---

## 🛠️ 4. 변경된 파일 목록 및 구조

```
packages/document-viewer/
├── package.json                   # "@vibe/document-viewer" 매니페스트
├── tsconfig.json
└── src/
    ├── index.ts                   # Public API
    ├── types.ts                   # DocumentViewerProps, ViewerDefinition
    ├── viewerRegistry.ts          # 플러그인 레지스트리 (Strategy Pattern)
    └── viewers/
        ├── fallback/
        │   └── IframeFallbackViewer.tsx
        └── pdf/
            ├── pdfWorkerSetup.ts  # PDF.js 워커 세팅
            └── PdfViewer.tsx      # 가로/세로 전개 코어 뷰어

apps/web/
├── package.json                   # "@vibe/document-viewer": "workspace:*" 등록
└── src/entities/reference-document/
    ├── index.ts                   # FSD Public API
    ├── model/viewerRegistry.ts    # Re-export 허브
    └── ui/ReferenceDocumentNode.tsx # @vibe/document-viewer 연동 공통 쉘
```

---

## ✅ 5. 최종 검증 결과

* **TypeScript 컴파일 & Vite 번들링**:
  * `pnpm -F frontend build` → **1.84초 완료 (Exit Code 0)**
* **코드 린트(Oxlint)**:
  * `pnpm -F frontend lint` → **오류 0건 통과**
* **런타임 동작 검증**:
  * PDF 카드의 우측 `>` 버튼 클릭 시 가로 스트립 언폴드 완벽 작동.
  * `<` 버튼 클릭 시 세로 기본 모드로 부드럽게 복귀.

---

## 📦 6. Git Staging 추천 커밋 가이드

```bash
git add packages/document-viewer apps/web/package.json apps/web/src/entities/reference-document pnpm-lock.yaml workbench/03.patch_note/2026-09-03/patch_note_document_viewer_package.md
git commit -m "feat(viewer): extract @vibe/document-viewer package with PDF horizontal spread engine

- Implement @vibe/document-viewer package based on Turborepo monorepo pipeline
- Add PdfViewer with one-click horizontal spread (unfold) support
- Integrate ViewerRegistry strategy pattern for pluggable format viewers
- Connect @vibe/document-viewer workspace dependency into apps/web
- Add patch_note_document_viewer_package.md for immutable history tracking"
```

---

* **작성자**: Antigravity Assistant Pair Programmer
* **문서 검토 완료**: 2026-09-03
