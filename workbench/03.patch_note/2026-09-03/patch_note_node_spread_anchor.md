# [Patch Note] 독립형 <NodeSpreadAnchor> 분리 및 2페이지 이상 조건부 노출 구현

* **버전(Version)**: `v1.4.0-spread-anchor` (인터랙션 앵커 고도화 릴리즈)
* **릴리즈 일자(Release Date)**: `2026-09-03`
* **문서 경로**: `workbench/03.patch_note/2026-09-03/patch_note_node_spread_anchor.md`
* **선행 패치**: `patch_note_rules_skills_packages_sync.md` (v1.3.1-rules-sync)
* **대상 컴포넌트**: `NodeSpreadAnchor.tsx`, `ReferenceDocumentNode.tsx`

---

## 📌 1. 개요 (Executive Summary)

* **배경**:
  * 기존에는 펼치기 버튼이 단순 `absolute` 원형 버튼 형태로 노드 우측에 붙어있어, 옆에 다른 카드가 인접할 때 테두리가 겹치거나 뒤에 생성된 카드 아래로 z-index가 깔려 클릭이 먹통되는 레이어 트랩(Layer Trap) 현상이 우려되었음.
  * 또한 1페이지짜리 단면 문서(인보이스, 단일 영수증 등)에도 불필요하게 펼치기 버튼이 노출되는 문제점이 존재했음.
* **목표**:
  * 단순 툴바나 인라인 버튼이 아닌, 노드 가장자리에 결합되는 **독립 인터랙션 컴포넌트 `<NodeSpreadAnchor>`**로 분리.
  * **"2페이지 이상인 다중 문서(`pageCount >= 2`)"**일 때만 발동하도록 엄격한 조건부 가드 적용.
  * 노드 호버 및 선택(`selected`) 시 z-index 최상위(`z-40`)로 승격되어 인접 노드 위로 선명하게 떠오르는 인터랙션 구현.

---

## 🔬 2. 핵심 구현 내역 (Core Improvements)

### 1) 독립 인터랙션 앵커 컴포넌트 신설 (`NodeSpreadAnchor.tsx`)
* **위치**: [`apps/web/src/entities/reference-document/ui/NodeSpreadAnchor.tsx`](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/apps/web/src/entities/reference-document/ui/NodeSpreadAnchor.tsx)
* **디자인 사양**:
  * 책갈피/인덱스 탭 형태의 우측 돌출 디자인 (`w-8 h-12 rounded-r-lg rounded-l-xs border-2 border-l-0 shadow-lg`).
  * `ChevronRight` (펼치기) / `ChevronLeft` (접기) 아이콘.
  * 마우스 호버 시 페이지 수 안내 플로팅 뱃지(`14p 펼치기`, `접기`) 노출.

---

### 2) 2페이지 이상(`pageCount >= 2`) 엄격한 조건부 노출
```tsx
// 1페이지 이하는 펼칠 필요가 없으므로 앵커 자체를 렌더링하지 않음!
if (!pageCount || pageCount < 2) {
  return null;
}
```
* 단면 PDF(1장) 또는 단일 이미지 문서는 앵커가 완전히 숨겨져 카드가 깔끔하게 유지됨.
* 14페이지 다중 문서는 앵커가 부착되어 직관적인 가로 펼침 인터랙션 제공.

---

### 3) DOM 레이어 및 z-index 계층 승격
* 부모 노드에 `group/node` 및 `selected ? 'z-30' : 'z-10 hover:z-20'` 계층 부여.
* `NodeSpreadAnchor`에 `z-40 pointer-events-auto`를 적용하여, 옆에 카드가 바짝 붙어있더라도 클릭 영역과 시각적 테두리가 항상 최상위에 유지되도록 개선.

---

## 📊 3. 최적화 전/후 비교 (Before vs After)

| 항목 | 기존 (v1.3.1) | 개선 후 (v1.4.0) | 개선 효과 |
| :--- | :--- | :--- | :--- |
| **단면(1p) 문서 UI** | 1장짜리도 무조건 `>` 노출 | **2장 이상일 때만 조건부 노출** | 불필요한 UI 잡음 0건 |
| **컴포넌트 구조** | 노드 내부 인라인 `<button>` | **독립형 `<NodeSpreadAnchor>` 분리** | SRP 준수 및 재사용성 극대화 |
| **옆 노드 밀착 시 레이어** | 옆 노드에 파묻힐 위험 존재 | **`z-40` 최상위 계층 승격** | 레이어 가림 및 클릭 먹통 원천 차단 |
| **마우스 호버 반응** | 단순 확대 | **인덱스 탭 돌출 + 페이지수 뱃지 툴팁** | 조작 피드백 및 직관성 대폭 향상 |

---

## ✅ 4. 최종 검증 결과

* **TypeScript 컴파일 & Vite 번들링**:
  * `pnpm -F frontend build` → **1.70초 완료 (Exit Code 0)**
* **코드 린트(Oxlint)**:
  * `pnpm -F frontend lint` → **오류 0건 통과**
* **런타임 동작 확인**:
  * 1페이지 인보이스(`Atticus LLC...pdf 1p`) ➔ 앵커 미노출 확인.
  * 14페이지 프로젝트 매니저 문서(`...pdf 14p`) ➔ 세련된 우측 인덱스 탭 앵커 노출 및 원클릭 펼침 확인.

---

* **작성자**: Antigravity Assistant Pair Programmer
* **문서 검토 완료**: 2026-09-03
