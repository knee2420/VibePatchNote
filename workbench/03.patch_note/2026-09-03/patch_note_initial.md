# [Initial Release Patch Note] 하이브리드 에디터 & 비주얼 캔버스 초기 구축

* **버전(Version)**: `v1.0.0-initial`
* **릴리즈 일자(Release Date)**: `2026-09-03`
* **저장소(Workspace)**: `VibePatchNote` (`apps/web`, `apps/api`)
* **문서 경로**: `workbench/03.patch_note/2026-09-03/patch_note_initial.md`

---

## 📌 1. 릴리즈 요약 (Executive Summary)

웹소설 창작 및 지식 구조화를 지원하는 **React Flow + Tiptap 기반 하이브리드 에디팅 보드(Hybrid Editor Board)**의 핵심 인프라와 사용자 경험(UX) 도구 모음을 초기 구축 완료한 릴리즈입니다.

* 옵시디언(Obsidian)과 헵타베이스(Heptabase), 피그마(Figma)의 검증된 캔버스 인터랙션을 벤치마킹하여 모듈화된 UI 시스템을 완성했습니다.
* 디렉토리 기반의 파일 드롭 확장 구조, 캔버스 환경설정, 다중 선택 플로팅 정렬 도구, 좌측 도구 독, 실시간 검색, 세션 관리 및 워크스페이스 CRUD 인프라를 일괄 배포했습니다.

---

## 🚀 2. 주요 기능 및 구현 상세 내역

### 1) 디렉토리 기반 파일 드래그 앤 드롭 (DnD) Registry
> **관련 모듈**: [`features/canvas-file-drop`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/features/canvas-file-drop)

외부 데스크톱이나 파일 탐색기에서 파일을 캔버스 위로 드래그 앤 드롭하여 즉시 시각적 노드를 생성할 수 있는 인프라입니다. 향후 확장자 확장이 소스코드 단일 파일에 숨겨지지 않고 **파일 트리(디렉토리 구조)**에서 한눈에 드러나도록 1포맷 1디렉토리 아키텍처를 적용했습니다.

* **디렉토리 기반 핸들러 분리**:
  * `handlers/pdf/`: `.pdf` 파일 전용 노드 생성 및 업로드 핸들러
  * `handlers/text/`: `.txt`, `.md`, `.log` 텍스트/마크다운 전용 핸들러
  * `handlers/image/`: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg` 이미지 전용 핸들러
  * `handlers/default/`: 미등록 확장자용 Fallback 핸들러
* **동적 좌표 변환 & 캐스케이딩 배치**:
  * React Flow의 `screenToFlowPosition`을 활용하여 마우스 드롭 위치를 캔버스 월드 좌표로 정확히 변환.
  * 다중 파일 동시 드롭 시 카드가 겹치지 않도록 +40px 오프셋 자동 계단식 배치.
* **비주얼 인터랙션**:
  * 캔버스 위로 파일 진입 시 반투명 블루 가이드 오버레이(`CanvasDropOverlay`) 노출.

---

### 2) 옵시디언 스타일 캔버스 환경 설정 팝오버
> **관련 모듈**: [`features/canvas-settings`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/features/canvas-settings)

옵시디언 캔버스의 우측 상단 뷰 설정 메뉴를 벤치마킹하여, 캔버스 전반의 뷰포트와 환경을 제어할 수 있는 컴팩트 드롭다운 팝오버를 구현했습니다.

* **우측 상단 ⚙️ 설정 아이콘 (`CanvasSettingsPopover`)**:
  * ☑️ **그리드에 맞추기 (Snap to Grid)**: 노드 이동 시 격자 단위 자석 스냅 ON/OFF
  * ☑️ **도트 배경 표시 (Background Dots)**: 캔버스 배경 그리드 도트 표시 토글
  * ☑️ **미니맵 표시 (MiniMap)**: 우측 하단 전체 캔버스 조감도 미니맵 토글
  * ☑️ **읽기 전용 모드 (Canvas Lock)**: 캔버스 노드 편집 및 드래그 방지 잠금
  * 🔄 **세션 노드 전체 초기화**: 실수 방지를 위한 컨펌 대화상자 포함 초기화 옵션 제공
* **상태 지속성 (Persistence)**:
  * Zustand `persist`를 적용하여 브라우저 새로고침 후에도 사용자의 설정 상태 영구 보존.

---

### 3) 헵타베이스/피그마 스타일 문맥 플로팅 액션바
> **관련 모듈**: [`features/canvas-node-actions`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/features/canvas-node-actions)

캔버스에서 카드를 1개 이상 다중 선택했을 때 상단 중앙에 슬라이드 인 애니메이션으로 부드럽게 나타나는 플로팅 정렬/조작 도구 모음입니다.

* **다중 선택 플로팅 HUD (`CanvasNodeActionBar`)**:
  * **선택 개수 뱃지**: 현재 선택된 노드의 수 실시간 표시
  * **바둑판 자동 정렬 (`arrangeInGrid`)**: 선택된 카드들을 2~3열 바둑판 형태로 자동 재배치
  * **수평/수직 균등 배분 (`distributeHorizontally` / `distributeVertically`)**: 카드들의 간격을 일정한 오프셋으로 균일 정렬
  * **5종 테마 색상 팔레트**: 화이트(Default), 옐로우, 그린, 블루, 퍼플 테마 일괄 적용
  * **선택 노드 일괄 삭제 (`deleteSelected`)**: 연결된 엣지까지 안전하게 일괄 제거

---

### 4) 헵타베이스 스타일 좌측 세로 도구 독 & 캔버스 모드 시스템
> **관련 모듈**: [`features/canvas-toolbar`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/features/canvas-toolbar)

헵타베이스와 Excalidraw의 좌측 세로형 독(Tool Dock)을 반영하여, 캔버스 모드 전환과 외부 리소스 생성을 하나의 독으로 통합했습니다.

* **좌측 플로팅 독 (`CanvasLeftToolbar`)**:
  * ↖️ **선택 모드 [V] (`Select Mode`)**:
    * 평소 대기 시: 자연스러운 일반 화살표 마우스 커서 (`cursor: default`)
    * 클릭 & 드래그 시: 정밀 십자선 커서 (`cursor: crosshair` ✛)로 전환되며 다중 선택 영역(Selection Marquee Box) 생성
  * ✋ **이동 모드 [H / Space] (`Hand Mode`)**:
    * 마우스 좌클릭 드래그로 캔버스 뷰포트 자유 패닝 (커서: `grab` ✋ → `grabbing` ✊)
  * 📄 **자료 업로드**: 클릭 시 파일 탐색기 즉시 호출
  * ➕ **지식 카드 생성**: 현재 화면 중앙 위치에 즉시 포스트잇 노드 생성
  * 📝 **세그먼트 추가**: 대단원 섹션 노드 생성
  * 🔍 **캔버스 빠른 검색 (`CanvasSearchModal` / 단축키 `Ctrl+K`)**:
    * 캔버스 내 모든 카드의 제목/내용 실시간 퍼지 검색
    * 검색 결과 클릭 시 해당 카드가 위치한 좌표로 캔버스 뷰포트 즉시 부드러운 자동 포커스 이동 (`setCenter`)

---

### 5) 워크스페이스 & 세션 관리 인프라
> **관련 모듈**: [`features/workspace`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/features/workspace)

백엔드 FastAPI REST API와 연동되어 세션을 생성, 조회, 저장, 삭제, 이름 수정할 수 있는 워크스페이스 라이프사이클 관리 시스템입니다.

* **세션 목록 시트 (`SessionListSheet`)**:
  * 우측 슬라이드 오버 드로어 패널
  * 새 세션 생성, 현재 상태 백엔드 영구 저장, 세션 전환, 세션 삭제
* **세션 이름 인라인 편집 (Two-way Editing)**:
  * 워크스페이스 목록 시트 내: 연필(✏️) 아이콘 클릭 또는 더블클릭 시 인라인 인풋 필드로 전환되어 `Enter`로 즉시 백엔드 DB 반영
  * 상단 헤더: 세션 제목 더블클릭 또는 연필 버튼으로 캔버스 작업 중에도 상단에서 즉시 세션 이름 변경 가능

---

### 6) 커스텀 노드 컴포넌트 생태계
> **관련 모듈**: [`entities/segment`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/entities/segment), [`entities/resource-card`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/entities/resource-card), [`entities/reference-document`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/entities/reference-document)

* **`SegmentNode` (대단원 섹션 카드)**:
  * 상/하 구조적 스토리 진행 연결 핸들 및 좌/우 지식 포스트잇 부착 핸들 구비
  * Tiptap 기반 서식 편집기 내장, 5종 테마 색상 시각적 반영
* **`ResourceCardNode` (지식/규칙/에셋 포스트잇 카드)**:
  * 타입 뱃지(knowledge, rule, asset), 삭제 버튼, 좌/우 연결 핸들
  * 카드 전체 부드러운 드래그 가능 (`cursor-grab`)
* **`ReferenceDocumentNode` (레퍼런스 문서 카드)**:
  * 업로드된 PDF/웹 문서를 안전하게 렌더링하는 임베드 뷰어 프레임

---

## 🏗️ 3. 아키텍처 및 설계 원칙 (Design Principles)

1. **FSD (Feature-Sliced Design) 아키텍처 엄격 준수**:
   * 각 기능이 `shared` → `entities` → `features` → `widgets` → `pages` 계층 구조를 따르며, 모든 모듈은 `index.ts` (Public API)를 통해서만 상위 레이어로 노출.
2. **AHA (Avoid Hasty Abstractions) 원칙**:
   * 불필요한 공통화와 섣부른 조기 추상화를 배제하고, 직관적인 관심사 분리 유지.
3. **HTML5 Canvas 배제 및 React Flow + DOM 기반 렌더링**:
   * 접근성과 확장성을 위해 Konva/Canvas2D 대신 React 컴포넌트 기반 DOM 노드 렌더링을 일관되게 고수.
4. **Google TypeScript Style Guide 준수**:
   * 엄격한 타입 정의 및 불필요한 any 타입 배제.

---

## 📦 4. 디렉토리 구조 맵 (Directory Map)

```
apps/web/src/
├── entities/
│   ├── reference-document/        # 레퍼런스 문서 노드 엔티티
│   ├── resource-card/             # 지식/포스트잇 카드 노드 엔티티
│   └── segment/                   # 대단원 섹션 노드 엔티티
├── features/
│   ├── canvas-file-drop/          # [DnD] 확장자별 디렉토리 기반 파일 드롭
│   │   ├── api/
│   │   ├── handlers/              # pdf/, text/, image/, default/
│   │   ├── model/
│   │   └── ui/
│   ├── canvas-node-actions/       # [피그마/미로] 다중 선택 플로팅 정렬/조작 바
│   ├── canvas-settings/           # [옵시디언] 우측 상단 환경설정 팝오버
│   ├── canvas-toolbar/            # [헵타베이스] 좌측 세로 도구 독 & 검색 모달
│   ├── topdown-outline/           # 에디터 전역 스토어 (useHybridEditorState)
│   └── workspace/                 # 세션 목록 시트 및 CRUD
├── shared/
│   └── ui/canvas/                 # InfiniteCanvas 코어 래퍼
└── widgets/
    └── hybrid-editor-board/       # 메인 하이브리드 보드 컴포지션 위젯
```

---

* **작성자**: Antigravity Assistant Pair Programmer
* **문서 검토 완료**: 2026-09-03
