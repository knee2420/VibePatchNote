# [Reference UI 사전 기능 조사 명세서 샘플]

이 문서는 사용자가 특정 서비스(예: 헵타베이스, 옵시디언, 피그마 등)의 UI/기능을 참조하여 개발을 지시했을 때, 에이전트가 코드를 작성하기 전에 작성해야 하는 **사전 조사 및 기능 리스트업 보고서의 실제 표준 예시**입니다.

---

## 📌 Case Study: 헵타베이스(Heptabase)의 그리드 모드 & 도구 독 벤치마킹

### 1. 레퍼런스 원본 분석 (Target Feature)
* **대상 서비스**: 헵타베이스 (Heptabase - Visual Knowledge Workspace)
* **참조 영역**:
  1. 캔버스 화면 좌측 고정 세로형 도구 바 (Primary Canvas Dock)
  2. 카드 다중 선택 시 캔버스 상단에 나타나는 정렬/조작 도구 (Floating Contextual Action Toolbar)
  3. 캔버스 눈금 단위 자석 정렬 모드 (Grid Snapping Mode)

---

### 2. 표준 UI/UX 전문 용어 정립 (UI Terminology)

| 레퍼런스 일상어 표현 | 표준 UI/UX 전문 용어 | 영문/엔지니어링 명칭 |
| :--- | :--- | :--- |
| 좌측 세로 도구 모음 | **좌측 플로팅 독 (Tool Dock)** | `Floating Vertical Tool Dock` |
| 마우스 화살표 / 영역 선택 | **마키 선택 모드** | `Marquee Selection Mode` |
| 손 모양 화면 이동 | **캔버스 패닝 모드** | `Viewport Panning / Hand Mode` |
| 카드 선택 시 뜨는 바 | **문맥 플로팅 액션바** | `Floating Action Toolbar (Selection HUD)` |
| 그리드에 딱딱 달라붙는 기능 | **그리드 스냅 (자석 맞춤)** | `Snap-to-Grid (Grid Alignment)` |
| 카드를 바둑판으로 착 펴주는 기능 | **바둑판형 자동 그리드 배치** | `Auto-Grid Tiling / Batch Layout` |
| 카드 간격을 균일하게 벌려주는 기능 | **수평/수직 균등 배분** | `Horizontal / Vertical Distribution` |

---

### 3. 사용자 인터랙션 및 상태 정의 (Interaction & State Specification)

#### ① 인터랙션 모드 (Mode State Machine)
* **`Select Mode` (단축키 `V`)**:
  * 마우스 좌클릭 드래그 시 캔버스 화면에 반투명 파란색 선택 사각형(Marquee Box)이 생성됨.
  * 사각형 영역에 닿거나 포함된 카드들이 일괄 다중 선택(`selected = true`) 상태로 전환.
* **`Hand/Pan Mode` (단축키 `H` 또는 `Space` 홀드)**:
  * 마우스 좌클릭 드래그 시 선택 박스 대신 캔버스 뷰포트 전체가 자유롭게 이동(Panning).
  * 커서 스타일이 `cursor-grab`에서 클릭 시 `cursor-grabbing`으로 변경.

#### ② 문맥 플로팅 액션바 표시 조건 (Contextual HUD Trigger)
* **트리거**: 캔버스에서 카드가 1개 이상 선택(`nodes.some(n => n.selected)`)되었을 때만 캔버스 상단 중앙(`top: 16px, left: 50%`)에 슬라이드 인(Slide-down) 애니메이션과 함께 노출.
* **해제**: 카드가 모두 선택 해제되거나 빈 캔버스를 클릭하면 슬라이드 아웃되며 사라짐.

#### ③ 그리드 스냅 (Grid Snapping)
* 노드를 마우스로 잡고 이동할 때, 연속적인 실수(Float) 좌표가 아니라 정의된 간격(예: 20px) 단위의 정수 격자 좌표(`Math.round(val / 20) * 20`)로만 자석처럼 달라붙으며 이동.

---

### 4. 당사 프로젝트(VibePatchNote) 기술 스택 매핑 분석

> ⚠️ **원칙: 자체 재구현을 지양하고, 기존 설치 사양을 최우선 활용한다.**

| 요구 기능 | 기설치된 라이브러리 및 내장 API | 매핑 및 활용 전략 |
| :--- | :--- | :--- |
| **그리드 스냅** | `@xyflow/react` (React Flow 12) | `<ReactFlow snapToGrid={true} snapGrid={[20, 20]} />` 내장 속성 100% 활용 |
| **선택 vs 이동 모드** | `@xyflow/react` | `panOnDrag`와 `selectionOnDrag`, `SelectionMode.Partial` 속성 조건부 토글 |
| **스페이스 패닝** | `@xyflow/react` | `panActivationKeyCode="Space"` 내장 키코드 활용 |
| **뷰포트 중심 좌표 변환** | `useReactFlow()` | `screenToFlowPosition({ x, y })` 활용하여 새 카드 추가 시 화면 중앙에 배치 |
| **설정 영구 저장** | `zustand/middleware` | `persist` 미들웨어를 활용하여 브라우저 로컬 스토리지에 스냅/도트 설정 영구 보존 |
| **아이콘 및 스타일** | `lucide-react`, Tailwind CSS | `MousePointer2`, `Hand`, `LayoutGrid`, `backdrop-blur-md` 활용 |

---

### 5. 구현할 세부 기능 리스트업 (Feature Breakdown List)

1. **[좌측 플로팅 독 툴바 (`CanvasLeftToolbar`)]**:
   - `MousePointer2` 버튼: 클릭 시 `Select Mode` 활성화 (선택 박스 드래그 허용)
   - `Hand` 버튼: 클릭 시 `Pan Mode` 활성화 (캔버스 자유 이동)
   - `UploadCloud` 버튼: 클릭 시 파일 선택 탐색기 트리거
   - `StickyNote` 버튼: 캔버스 현재 뷰포트 중앙에 새 지식 카드 노드 생성
   - `Search` 버튼: 캔버스 노드 실시간 검색 모달(`CanvasSearchModal`) 오픈
2. **[문맥 플로팅 액션바 (`CanvasNodeActionBar`)]**:
   - `선택 개수 뱃지`: 선택된 카드 개수 표시
   - `그리드 정렬 버튼`: 선택된 카드들의 너비/간격을 계산하여 2~3열 바둑판 형태로 자동 재배치
   - `가로/세로 균등 배분 버튼`: 선택된 카드들의 X/Y 간격을 균일하게 일렬 정렬
   - `컬러 팔레트 스와치`: 5종 테마 색상(화이트, 노랑, 초록, 파랑, 보라) 클릭 시 일괄 테마 적용
   - `일괄 삭제 버튼`: 선택된 카드들을 일괄 제거
3. **[캔버스 뷰 환경 설정 (`CanvasSettingsPopover`)]**:
   - 옵시디언 스타일의 우측 상단 ⚙️ 드롭다운 팝오버 메뉴
   - 그리드 맞추기(Snap ON/OFF), 도트 배경 표시, 미니맵 토글, 읽기 전용 모드
