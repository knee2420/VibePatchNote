# [Patch Note] 콘텐츠 자동 맞춤(Auto-fit), 선택 노드 휠 연동 및 패키지 관심사 분리 패치

* **버전(Version)**: `v1.5.0-fit-wheel-refactor` (문서 노드 UX 및 아키텍처 정제 릴리즈)
* **릴리즈 일자(Release Date)**: `2026-09-03`
* **문서 경로**: `workbench/03.patch_note/2026-09-03/patch_note_autofit_and_wheel_scroll.md`
* **선행 패치**: `patch_note_node_spread_anchor.md` (v1.4.0-spread-anchor)
* **대상 컴포넌트**: `apps/web` (`ReferenceDocumentNode.tsx`, `NodeSpreadAnchor.tsx`), `packages/document-viewer` (`PdfViewer.tsx`, `IframeFallbackViewer.tsx`, `types.ts`)

---

## 📌 1. 개요 (Executive Summary)

* **배경**:
  * 단면(1p) 문서나 특정 종횡비 문서 열람 시 카드가 고정 높이(`800px`)로 묶여 있어, 하단 각주(`Page 1 of 1`)가 잘리고 불필요한 스크롤바가 생기는 문제가 발생했음.
  * 캔버스 위에서 마우스 휠 조작 시 캔버스 줌(Zoom)이 동작하여 특정 선택된 노드 내부의 PDF 스크롤을 세밀하게 제어하기 어려웠음.
  * 또한 초기 구현 과정에서 캔버스 앱 종속적인 상태(`selected`, 캔버스 줌 차단 로직)가 공용 패키지(`@vibe/document-viewer`)에 침투하여 호스트 비의존적 패키지 원칙을 훼손하는 구조적 문제가 지적되었음.
* **목표**:
  1. 헤더 더블클릭 또는 `[크기 맞춤]` 버튼을 통해 문서 원본 종횡비에 100% 맞춰지는 **콘텐츠 자동 맞춤(Auto-Fit to Content)** 구현.
  2. 노드 선택(`selected`) 시 마우스 휠 이벤트가 캔버스 줌으로 빠져나가지 않고 **노드 내부 스크롤로 매끄럽게 연동**(세로는 상하, 가로는 좌우 가로 스크롤로 자동 변환)되도록 개선.
  3. 공용 패키지(`@vibe/document-viewer`)에서 캔버스 종속 코드를 100% 걷어내고, 캔버스 관련 제어는 캔버스 노드(`apps/web`)에서 전담하도록 **철저한 관심사의 분리(Separation of Concerns)** 완수.

---

## 🔬 2. 핵심 구현 및 리팩토링 내역 (Core Improvements)

### 1) 콘텐츠 크기 자동 맞춤 (Auto-Fit to Content)
* **헤더 더블클릭 제스처 (`onDoubleClick`)**:
  * 피그마/옵시디언 캔버스와 동일하게 헤더 바를 더블클릭하면 노드가 즉시 `w-[640px] h-[910px]`로 확장되어, 1페이지 전체와 하단 각주까지 스크롤바 없이 100% 핏되어 표시됨. (다시 더블클릭 시 기본 `600px x 800px`로 복원)
* **헤더 액션 버튼**:
  * 타이틀바 우측(삭제 버튼 왼쪽)에 `[콘텐츠 크기에 맞춤]` 아이콘 버튼(`Maximize2` / `Minimize2`) 배치.

---

### 2) 선택 노드 휠 스크롤 연동 및 캔버스 줌 버블링 차단
* **캔버스 호스트 래퍼 레벨 연동 (`ReferenceDocumentNode.tsx`)**:
  * 노드가 `selected` 상태일 때만 `e.stopPropagation()`으로 캔버스 줌 버블링을 차단하고, 자식 뷰어의 스크롤 컨테이너를 탐색하여 스크롤 동작:
    - **세로 모드**: 일반적인 위/아래 스크롤 (`scrollTop += e.deltaY`)
    - **가로 스프레드 모드**: 일반 마우스의 상하 휠을 굴려도 **자동으로 좌/우 가로 스크롤(`scrollLeft`)로 변환**되어, 틸트 휠이 없어도 14페이지 전체를 고속으로 부드럽게 탐색 가능.
  * 카드가 선택되지 않은 상태에서는 평소처럼 캔버스 본래의 줌(Zoom) 및 팬(Pan) 동작이 원활하게 유지됨.

---

### 3) 공용 패키지(`packages`)와 앱(`apps`)의 철저한 관심사 분리
* **`@vibe/document-viewer`의 순수성 회복 (Host-Agnostic Purity)**:
  * `DocumentViewerProps` 및 `PdfViewer.tsx`, `IframeFallbackViewer.tsx`에서 `selected`, `isFitContent`, `e.stopPropagation()` 등 캔버스 앱 종속적인 코드와 Props를 **전부 제거**.
  * 부모가 지정하는 크기(`w-full h-full`)를 순수하게 채우는 범용 렌더러로 복원 완료.
* **`apps/web`의 캔버스 상호작용 전담**:
  * 캔버스 줌 차단, 휠 스크롤 매핑, 노드 크기 조절은 캔버스 쉘인 `ReferenceDocumentNode.tsx`에서 온전히 책임짐.

---

## 📊 3. 개선 전/후 비교 (Before vs After)

| 영역 | 기존 방식 | 개선 후 (v1.5.0) | 개선 효과 |
| :--- | :--- | :--- | :--- |
| **단면 문서 열람** | 하단 라벨 잘림 및 불필요한 스크롤바 | **더블클릭으로 100% 풀핏 확장** | 문서 원본 잘림 0건, 시원한 1페이지 뷰 |
| **마우스 휠 조작** | 노드 위에서 휠 돌리면 캔버스 줌 발생 | **선택 노드 내부 문서 스크롤 직결** | 상용 툴 수준의 정교한 캔버스 UX |
| **가로 모드 스크롤** | 스크롤바를 마우스로 직접 드래그 | **상하 휠 ➔ 좌우 가로 스크롤 자동 변환** | 틸트 휠 없이도 다중 페이지 쾌속 열람 |
| **아키텍처 관심사** | 캔버스 상태가 공용 패키지에 침투 | **공용 패키지 순수성 100% 회복** | 다른 프로젝트/모달로의 무오염 이식 보장 |

---

## ✅ 4. 최종 검증 결과

* **TypeScript 컴파일 & Vite 번들링**:
  * `pnpm -F frontend build` → **1.96초 완료 (Exit Code 0)**
* **코드 린트(Oxlint)**:
  * `pnpm -F frontend lint` → **오류 0건 통과**
* **사용자 직접 검증**:
  * 화면 동작 및 관심사 분리 코드 확인 후 공식 컨펌 완료.

---

* **작성자**: Antigravity Assistant Pair Programmer
* **문서 검토 및 릴리즈 승인 완료**: 2026-09-03
