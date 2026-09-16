# @vibe/editor-workspace

> **Host-Agnostic, Domain-Neutral Workspace Engine**  
> VS Code 스타일의 무한 분할 도킹 에디터(`dockview-react`)와 Scrivener 스타일의 가상 스크롤 바인더 트리(`react-arborist`), 그리고 Antigravity IDE 감성의 3단 워크스페이스 레이아웃(`WorkspaceShell`), 아웃라이너 테이블, 코르크보드, 스냅샷, 컴파일러, 메타데이터 인스펙터를 하나로 묶은 독립 재사용 패키지입니다.

---

## 특징 및 레이어별 구성

1. **완벽한 호스트 비의존성 (Host-Agnostic)**:
   - 특정 백엔드 API나 비즈니스 도메인 DTO에 결합되지 않으며, 순수 제네릭(`BinderItem<T>`, `OutlinerRow<T>`, `CorkboardCard<T>`)과 React 컴포넌트 맵으로만 동작합니다.
   - 다른 웹 애플리케이션 및 모노레포 프로젝트에 즉시 설치하여 에디터 셸로 활용할 수 있습니다.
2. **Top Menu Bar & Global Toolbar (`toolbar/`)**:
   - `TopMenuBar`: 좌(뒤로가기/문서명), 중(뷰모드 스위처), 우(상태/도구) 3단 슬롯을 갖춘 전역 상단 바.
   - `ViewModeSwitch`: 에디터 ⇄ 규격 Matrix ⇄ 코르크보드 ⇄ 아웃라이너 등 다양한 화면 모드를 전환하는 세련된 알약형 스위처.
   - `SyncStatusBadge`: `'idle' | 'saving' | 'saved' | 'error'` 상태를 표현하는 실시간 동기화 인디케이터.
3. **Workspace Panels (`panels/`)**:
   - `WorkspacePanel`: 사이드바/인스펙터의 표준 프레임 (제목, 서브타이틀, 액션 버튼, 접기/펼침 내장).
   - `PanelToolbar`: 패널 상단에 컴팩트하게 장착되는 가로 툴바.
4. **Scrivener 스타일 Binder Tree & Toolbar (`binder/`)**:
   - `BinderTree`: `react-arborist` 기반 초고속 가상 스크롤 트리 (수만 개의 노드도 부드럽게 렌더링).
   - `BinderToolbar`: 검색 필터링창, `+ 새 문서`, `+ 새 폴더`, `모두 접기` 버튼이 내장된 바인더 전용 액션 바.
   - `BinderNode`: 폴더/문서 아이콘, 인라인 이름 변경(더블 클릭/엔터), 선택 하이라이트.
5. **VS Code 스타일 Split Editor & Tab Actions (`dock/`)**:
   - `EditorDockShell`: `dockview-react` 기반 무한 상하/좌우 분할(Split), 탭 드래그 앤 드롭, 도킹 셸.
   - `DockTabActions`: 에디터 탭 우측의 `[참조 뷰포트 고정(Pin)]`, `[우측 분할]`, `[최대화/복원]`, `[탭 닫기]` 버튼 툴바.
   - Antigravity / Slate 다크 테마 기본 내장(`dockview-theme.css`).
6. **2D 코르크보드 인덱스 카드 뷰 (`corkboard/`)**:
   - `CorkboardView`, `CorkboardCardItem`: 하위 섹션 노드들을 2D 그리드 인덱스 카드로 조감하고 드래그 앤 드롭으로 순서를 재배치.
7. **아웃라이너 테이블 뷰 (`outliner/`)**:
   - `OutlinerTable`: 섹션 번호, 제목, 요약, 분량, 진행 상태를 스프레드시트 형태로 일괄 조회하고 인라인 편집.
8. **문서 메타데이터 & 목표 진행도 인스펙터 (`metadata/`)**:
   - `MetadataInspector`: 목표 글자 수 대비 달성률 프로그레스 바, 상태/라벨 드롭다운, 태그 칩 관리, 섹션 메모.
9. **문서 조립 & 합성 컴파일러 (`compiler/`)**:
   - `DocumentCompilerModal`: 바인더 섹션 선택 체크박스, 넘버링 스타일, 페이지 나눔 옵션을 지정하여 단일 산출물(Markdown/HTML/Text) 다운로드.
10. **세그먼트 단위 스냅샷 (`snapshots/`)**:
    - `SnapshotInspector`: 섹션 단위 타임스탬프 스냅샷 기록, 복원, diff 비교 슬롯.
11. **상태 표시줄 위젯 (`statusbar/`)**:
    - `BreadcrumbBar`: 계층형 브레드크럼 네비게이터.
    - `WordCountBadge`: 실시간 글자수/단어수/목표 달성률 배지.
12. **Antigravity IDE 3단 레이아웃 (`workspace/`)**:
    - `WorkspaceShell`: 상단 헤더, 좌측 바인더, 중앙 에디터, 우측 인스펙터, 하단 상태바 5대 영역 및 드래그 리사이징 핸들 지원.

---

## 설치

```bash
# 모노레포 내부에서 설치
pnpm add @vibe/editor-workspace --filter <your-app>

# 일반 프로젝트에서 설치
npm install @vibe/editor-workspace
# 또는
pnpm add @vibe/editor-workspace
```
