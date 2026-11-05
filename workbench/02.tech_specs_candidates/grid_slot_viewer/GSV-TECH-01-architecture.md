---
type: spec-candidate
id: GSV-TECH-01
title: "Grid-Slot 인터랙티브 문서 뷰어 기능 및 기술 스펙 (Layout-Slot Separation Architecture)"
category: "Candidate / Document Viewer & AI Interaction"
status: "Candidate / Prototyping"
created_at: "2026-10-28"
related_requirements:
  - "workbench/01.requirements_analysis/grid_slot_viewer/GSV-01-grid-slot-viewer-spec.md"
experiment_path: "workbench/08.experiments/01.grid_slot_viewer"
---

# [GSV-TECH-01] Grid-Slot 인터랙티브 문서 뷰어 기능·기술 스펙

## 1. 아키텍처 핵심 급소: "뼈대(CSS Grid/Flex)와 알맹이(Slot)의 물리적 분리"

기존 Tiptap 단일 에디터 방식은 문서 전체가 하나의 `contentEditable` 안에 묶여 있어, 글자를 수정할 때마다 바깥 레이아웃(다단, 박스, 표)이 흔들리는 한계가 있었다.
이를 해결하기 위해 **바깥 레이아웃 뼈대는 에이전트가 선언하기 쉬운 순수 JSON(CSS Grid/Flex)으로 고정**하고, **각 구획 내부의 알맹이만 독립된 React `Slot` 컴포넌트**로 격리한다.

```text
┌─ [B1. Layout Container: 순수 CSS Grid / Flex 뼈대 (불변 레이아웃)] ────────┐
│                                                                            │
│  ┌─ [Slot A: 상단 핵심 요약 배너] ──────────────────────────────────────┐  │
│  │  📎 백데이터(2) | 클릭 시 AI 요약/수정 팝업                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌─ [Slot B: 좌측 주요 안건 카드] ───┐  ┌─ [Slot C: 우측 결정/실행 표] ─┐  │
│  │  독립 슬롯 컴포넌트               │  │  고정 라벨(Boilerplate)       │  │
│  │  (다른 구역에 영향 없음)          │  │  + 내부 가변 슬롯(Slot C-1)   │  │
│  └───────────────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 4대 바운더리별 기능 스펙 (Functional Specs)

### [SPEC-B1] 선언적 2차원 레이아웃 엔진 (Layout Container)
* **지원 레이아웃 블록 종류**:
  1. **`Section / Banner`**: 상단 타이틀, 핵심 요약 콜아웃, 하이라이트 배너.
  2. **`Multi-Column / Card Grid`**: 2단·3단 비교 레이아웃, KPI 요약 카드 그리드.
  3. **`Structured Table`**: 공문서·회의록·명세서용 정밀 격자 표 (`columns`, `rows`, `colSpan`, `rowSpan`).
  4. **`Key-Value / Meta Box`**: 담당자, 일자, 상태, 서명란 등 정형 메타데이터 블록.
* **렌더링 방식**: 무거운 외부 Wasm 컴파일러 없이, JSON에 선언된 수치(`fr`, `pt`, `%`, `gap`, `stroke`)를 브라우저 네이티브 **CSS Grid / Flexbox**로 1:1 매핑하여 즉시 렌더링.

### [SPEC-B2] 불변 양식(Boilerplate)과 독립 슬롯(Slot) 분리
* **`BoilerplateNode` (고정 틀)**:
  * 섹션 헤더, 표의 항목명, 구분선 등 문서의 시각적 골격을 이루는 요소.
  * 사용자의 실수로 지워지거나 밀리지 않도록 읽기 전용으로 잠금.
* **`SlotNode` (가변 알맹이)**:
  * 고유 `slotId`를 가진 독립 React 컴포넌트.
  * 내부 콘텐츠 표현: 일반 단락, 개조식 불릿 리스트, 체크리스트, 키-값 텍스트.
  * 각 슬롯은 자기 자신의 영역 안에서만 리렌더링되며 주변 레이아웃을 절대 무너뜨리지 않음.

### [SPEC-B3] 슬롯 단위 백데이터(Grounding Data) 바인딩
* **데이터 구조**:
  * 각 `slotId`마다 참조할 백데이터 목록(`backDataRefs: BackDataItem[]`)을 독립 보유.
  * 백데이터 유형: 마크다운 노트(`.md`), 회의 녹취 원문(`.txt`), 이미지/PDF 발췌 조각.
* **UI 동작**:
  * 백데이터가 연결된 슬롯에는 우측 상단에 참조 배지(`📎 N`) 노출.
  * 슬롯 선택 시 사이드뷰(또는 플로팅 뷰)에 해당 슬롯에 연결된 백데이터 원문만 즉시 필터링하여 표시.
  * 새로운 백데이터 카드를 드래그 앤 드롭하거나 팝업에서 추가/제거 가능.

### [SPEC-B4] 인플레이스(In-place) AI 인터랙션 & 직접 편집
* **3단계 인터랙션 상태**:
  1. **기본(View)**: 군더더기 없는 깔끔한 고밀도 문서 뷰어 상태.
  2. **선택(Focus - 단일 클릭)**:
     * 슬롯 테두리에 포커스 하이라이트(빨간/보라 박스) 활성화.
     * 슬롯 전용 **[인플레이스 AI 프롬프트 바 + 백데이터 열람창]** 팝업 호출.
     * 예: *"연결된 녹취록에서 소방 점검 관련 결정 사항만 2줄 개조식으로 요약해 줘"* 입력 시, AI가 **해당 `slotId`의 내용만 국소 교체**.
  3. **직접 수정(Direct Edit - 더블 클릭)**:
     * AI를 거치지 않고 사람이 바로 고치고 싶을 때는 해당 슬롯 내부만 즉시 인라인 편집 모드로 전환.

---

## 3. 코어 데이터 계약 (JSON Schema 초안)

에이전트(LLM)가 생성·조작하고 뷰어가 그대로 그리는 단일 데이터 구조:

```typescript
export interface StructuredDocumentSchema {
  docId: string;
  title: string;
  /** 최상위 2차원 레이아웃 블록 배열 (배너, 다단 그리드, 카드, 표 등 조합) */
  blocks: LayoutBlock[];
  /** 슬롯별 알맹이 데이터 및 백데이터 매핑 (slotId 기준 격리) */
  slots: Record<string, SlotData>;
}

export type LayoutBlock =
  | { kind: 'banner'; title?: string; slotId: string }
  | { kind: 'columns'; widths: string[]; gap?: string; children: LayoutBlock[] }
  | { kind: 'card-grid'; columns: number; slotIds: string[] }
  | { kind: 'table'; columns: string[]; rows: string[]; cells: TableCellDef[] };

export interface SlotData {
  slotId: string;
  label: string;
  content: string | string[];
  constraints?: { maxLines?: number; tone?: string };
  backDataRefs: { id: string; title: string; snippet: string }[];
}
```

