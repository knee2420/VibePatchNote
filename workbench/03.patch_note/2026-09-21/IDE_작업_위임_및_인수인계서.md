---
유형: 단일
구역: 1.project
분류:
  - 💻문서 어시스턴트 동작 구현
주제:
  - 문서 어시스턴트 에디터 package 리팩토링
상태: to do
요약: 크로스 패널 이벤트 연계를 Zustand Store 기반 Reactive 아키텍처로 전환하는 작업 명세서
작성일: 2026-09-21
마감:
커버:
상위: "[[(layout 정비) IDE 패널 정비]]"
링크:
담당:
  - "[[민규 서]]"
작성자:
  - "[[민규 서]]"
일정:
---

# 🎯 [작업 명세서] IDE 크로스 패널 이벤트 연계의 Store(Zustand) 기반 재편

> **핵심 목표**: 현재 `EditorLabWorkspace`(부모)가 수십 개의 Props/콜백을 중개하는 "중앙 우체국 방식(Props Drilling)"을 폐기하고, **Zustand Store 기반의 "발행-구독(Reactive)" 구조로 이벤트를 이관**하여 결합도를 끊고 렌더링 성능을 극대화한다.

---

## 📌 1. 해결해야 하는 핵심 문제 (Why)

현재 좌측 트리에서 특정 엘리먼트(`s2` 슬롯 등)를 클릭하면 5개 패널이 동시에 연동되는데, 이 모든 연쇄 반응이 **부모 컴포넌트의 Props 릴레이**로 묶여 있습니다.

* **현재 문제점**:
  1. `EditorLabWorkspace`가 40여 개의 props/콜백(`onSelectSlot`, `selectedSlotId`, `slotBindings`, `onBindSlot`...)을 하위 5개 패널에 일일이 전달하느라 코드가 비대해짐.
  2. 한 패널에서 슬롯을 선택/수정하면 최상위 부모가 리렌더링되면서 무관한 패널들까지 불필요하게 재평가됨.
  3. 다른 컴포넌트 리팩토링 작업과 엉키지 않으면서, 패키지(`packages/editor-workspace`)다운 독립적 구조를 갖추어야 함.

---

## 🛠️ 2. 해야 하는 구체적인 작업 (What & How)

### 1단계. `useSlotStore` (슬롯 선택·바인딩 스토어) 신설
* **위치**: `@vibe/editor-workspace` 패키지 내부 또는 `features/slot-binding/model/useSlotStore.ts`
* **상태 (State)**:
  * `selectedSlotId: string | null` (현재 활성 슬롯 ID)
  * `slotBindings: Record<string, SlotBindingInfo>` (슬롯별 바인딩 값 및 상태)
* **액션 (Action - 이벤트 발행자)**:
  * `selectSlot: (slotId: string, pageNumber: number) => void`
  * `bindSlot: (slotId: string, value: string) => void`
  * `applySuggested: (slotId: string) => void`
  * `resetAllSlots: () => void`

### 2단계. 이벤트 발행처 전환 (좌측 바인더 트리)
* **대상 파일**: [`IdeArboristRow.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/packages/editor-workspace/src/sidebar/primitives/IdeArboristRow.tsx) / [`IdeArboristTree.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/packages/editor-workspace/src/sidebar/IdeArboristTree.tsx)
* **변경 내용**:
  * 부모에게서 전달받던 `onSelectSlot`, `onApplySuggested`, `onUnbindSlot` Props 제거.
  * 클릭 시 스토어 액션을 직접 1줄 호출:
    ```tsx
    const selectSlot = useSlotStore((s) => s.selectSlot);
    // 클릭 시: selectSlot(node.id, node.pageNumber)
    ```

### 3단계. 3대 반응 패널의 선택적 구독(Selective Subscription) 연결
부모가 props를 넘겨주지 않고, 각 패널이 스토어를 직접 구독하여 **스스로 반응**하게 만듭니다.

1. **중앙 캔버스 (`CanvasSlotBox.tsx` / `IdeMainEditor.tsx`)**:
   * `const isSelected = useSlotStore(s => s.selectedSlotId === slotId);`
   * 혜택: 내가 선택된 슬롯이 아닐 때는 캔버스의 다른 수십 개 슬롯이 리렌더링되지 않음.
2. **우측 AI 감사 패널 (`IdeSecondarySidebar.tsx`)**:
   * `const selectedSlotId = useSlotStore(s => s.selectedSlotId);`
   * 해당 슬롯 카드로 자동 스크롤 및 신뢰도 정보 하이라이트.
3. **하단 레시피 패널 (`IdeRecipeBottomView.tsx` / `IdeBottomPanel.tsx`)**:
   * `const selectedSlotId = useSlotStore(s => s.selectedSlotId);`
   * 해당 슬롯 규격 카드 활성화 및 인스펙터 속성 동기화.

### 4단계. 부모 컴포넌트(`EditorLabWorkspace.tsx`) Props 대청소
* `EditorLabWorkspace`에서 패널들로 내려주던 약 40개의 슬롯 관련 props/콜백을 완전히 걷어냄.
* 부모 컴포넌트는 오직 패널들의 뼈대 배치(Layout)만 담당하도록 다이어트.

---

## ⚠️ 3. 작업 시 절대 주의사항 (Guardrails)

1. **빅뱅 방식(전체 일괄 전환) 절대 금지**:
   * 탭, 터미널, 레퍼런스, AI까지 한 번에 갈아엎지 마십시오.
   * **오직 가장 연쇄 반응이 크고 독립적인 [슬롯 선택 & 바인딩(`useSlotStore`)] 1개 영역만 핀포인트로 우선 전환**하십시오.
2. **도메인 중립성 준수**:
   * 패키지 및 스토어에 특정 업무 데이터(회의비, 영수증 등) 명칭을 하드코딩하지 말고, 순수한 `slotId`, `value`, `status` 인터페이스로 설계하십시오.
3. **완료 게이트 통과**:
   * 작업 후 반드시 `pnpm lint && pnpm typecheck && pnpm build` 통과를 확인하십시오.

---

## ✅ 4. 작업 완료 검증 기준 (Definition of Done)

* [ ] `EditorLabWorkspace.tsx`에서 슬롯 관련 props(`onSelectSlot`, `selectedSlotId`, `slotBindings` 등)가 제거되었는가?
* [ ] 좌측 트리에서 슬롯 클릭 시:
  * 중앙 캔버스의 해당 슬롯에 포커스 링이 정상 점등되는가?
  * 우측 AI 패널의 해당 카드가 정상 하이라이트되는가?
  * 하단 레시피의 해당 슬롯 인스펙터가 정상 갱신되는가?
* [ ] 슬롯 1개를 클릭/수정했을 때 다른 슬롯이나 부모 전체가 불필요하게 리렌더링되지 않는가?
* [ ] `pnpm lint` 및 `pnpm typecheck` 에러 0건을 만족하는가?
