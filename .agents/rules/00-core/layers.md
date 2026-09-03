---
description: "[최우선 부속] FSD 레이어별 상세 정의와 ✅/❌ 코드 대조표"
priority: 0
---

# 00-core / layers — 레이어별 상세 정의

> 이 문서는 [`rule.md`](./rule.md)의 부속 문서입니다. **먼저 `rule.md`를 읽으십시오.**
> 여기서는 각 레이어의 "무엇을 담고 무엇을 담지 않는가"를 실제 코드로 대조합니다.

---

## 의존 방향 (외우십시오)

```text
   app          전역 Provider · 라우팅 · 글로벌 스타일
    ↓
  pages         라우트 화면 (조합만)
    ↓
 widgets        독립 UI 블록 (feature/entity 조합)
    ↓
features        사용자 동작 + 그 상태/통신
    ↓
entities        도메인 객체 + 기본 표현
    ↓
 shared         도메인 무관 범용 자산
```

**↓ 방향만 허용.** 옆으로도(같은 레이어끼리) 안 됩니다.
예외는 `shared` 내부 세그먼트 간 참조뿐입니다 (`shared/ui` → `shared/lib` 허용).

---

## `app/` — 앱 부트스트랩

**담는 것:** 전역 Provider, 라우팅 테이블, 글로벌 CSS, 폰트 세팅
**담지 않는 것:** 비즈니스 로직, 데이터 통신, 화면 마크업

```tsx
// ✅ app/routes/AppRouter.tsx — 라우팅 테이블만
import { Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@/pages/dashboard';
import { EditorPage } from '@/pages/editor';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/editor" element={<EditorPage />} />
    </Routes>
  );
}
```

```tsx
// ❌ app 에 로직을 넣지 마십시오
export function AppRouter() {
  const [user, setUser] = useState(null);
  useEffect(() => { fetch('/api/me').then(...); }, []);  // ❌ P4 위반
  // ...
}
```

> `app/` 내부끼리는 **상대 경로**로 참조합니다 (`./providers/AppProviders`).
> `@/app/**` 은 어디에서도 import할 수 없습니다 — 린트 에러입니다.

---

## `pages/` — 라우트 화면

**담는 것:** widget/feature 조합, 라우트 단위 레이아웃
**담지 않는 것:** `useState`로 관리하는 도메인 상태, `fetch`, 무거운 마크업

```tsx
// ✅ pages/editor/ui/EditorPage.tsx — 조합만. 8줄.
import { HybridEditorBoard } from '@/widgets/hybrid-editor-board';

export function EditorPage() {
  return (
    <div className="w-full h-screen bg-slate-50 overflow-hidden">
      <HybridEditorBoard />
    </div>
  );
}
```

```tsx
// ❌ 페이지가 통신과 상태를 직접 관리 (리팩터링 전 DashboardPage 의 실제 모습)
export function DashboardPage() {
  const [health, setHealth] = useState(null);       // ❌
  const checkBackendHealth = async () => {
    const res = await fetch('http://localhost:8000/api/health');  // ❌ P4·P5 위반
    setHealth(await res.json());
  };
  return <div>{/* 200줄의 마크업 */}</div>;          // ❌
}
```

**수정 방법:** 통신 → `features/api-health`, 마크업 → `widgets/project-dashboard`, 페이지는 조합만.

---

## `widgets/` — 독립 UI 블록

**담는 것:** 여러 feature/entity를 엮어 하나의 완결된 화면 덩어리를 만드는 조합 로직
**담지 않는 것:** 백엔드 통신, 다른 widget 참조

```tsx
// ✅ widgets/hybrid-editor-board — 조합에 집중
import { useCanvasBoardStore } from '@/entities/canvas-board';
import { SegmentNode, SEGMENT_NODE_TYPE } from '@/entities/segment';
import { CanvasDropOverlay, useCanvasFileDrop } from '@/features/canvas-file-drop';
import { SessionListSheet, useSessionSync } from '@/features/workspace';
import { InfiniteCanvas } from '@/shared/ui';

import { BoardHeader } from './BoardHeader';   // 슬라이스 내부는 상대 경로

const NODE_TYPES = { [SEGMENT_NODE_TYPE]: SegmentNode /* ... */ };

function HybridEditorBoardContent() {
  useSessionSync();                             // ✅ 통신은 feature 훅이 담당
  // ...조합...
}
```

```tsx
// ❌ 위젯이 직접 통신 (리팩터링 전 실제 모습)
useEffect(() => {
  const res = await fetch(`http://localhost:8000/api/v1/workspaces/${id}`);  // ❌
  loadSession(...);
}, [id]);
```

> **widget → widget 참조 금지.** 두 위젯이 같은 것을 필요로 하면 `entities`나 `features`로 내리십시오.

---

## `features/` — 사용자 동작

**담는 것:** "무엇을 한다"에 해당하는 상호작용 + 그 상태/통신
**담지 않는 것:** 다른 feature 참조, UI 알림(`alert`/`confirm`) 직접 호출

슬라이스 이름은 **동사/동작**으로 짓습니다: `canvas-file-drop`, `canvas-node-actions`, `workspace`.

```ts
// ✅ features/workspace/api/workspaceApi.ts — 통신은 api 세그먼트에
import { httpClient } from '@/shared/api';

const BASE_PATH = '/api/v1/workspaces';

export const workspaceApi = {
  list: () => httpClient.get<WorkspaceSession[]>(BASE_PATH),
  update: (id: string, payload: WorkspaceSessionUpdatePayload) =>
    httpClient.put<WorkspaceSession>(`${BASE_PATH}/${id}`, payload),
};
```

```ts
// ✅ 훅은 헤드리스 — 확인창은 콜백으로 UI에 위임
export function useCanvasFileDrop({ onNodeCreated, onUploadError }: Props = {}) {
  // ...
  catch (error) {
    onUploadError?.(file, error);   // ✅ 훅은 알리기만
  }
}

// 호출하는 UI 쪽에서
useCanvasFileDrop({
  onUploadError: (file) => alert(`[${file.name}] 업로드 실패`),  // ✅ UI가 표시 담당
});
```

```ts
// ❌ 훅이 직접 UI를 띄움
catch (error) {
  alert(`[${file.name}] 파일 업로드 중 오류가 발생했습니다.`);   // ❌ P4 위반
}
```

### feature 간 공유가 필요할 때

```ts
// ❌ features/a 가 features/b 를 참조
import { useCanvasMode } from '@/features/canvas-toolbar';   // features/canvas-settings 에서 → 린트 에러
```

**해결 순서:**
1. 공통분모가 **도메인 상태**면 → `entities`로 내린다 (예: `useCanvasBoardStore`)
2. 공통분모가 **범용 타입/유틸**이면 → `shared`로 내린다 (예: `NodeTheme` → `shared/model`)
3. 둘 다 아니면 → **상위 widget이 두 feature를 조합**한다

---

## `entities/` — 도메인 객체

**담는 것:** 핵심 도메인 데이터 모델, 그 기본 노드/카드 표현, 도메인 스토어
**담지 않는 것:** 상위 레이어 참조, 다른 entity 참조, 백엔드 통신

```ts
// ✅ entities/reference-document/model/types.ts
import type { NodeTheme } from '@/shared/model';

/** React Flow 노드 타입 레지스트리 키 (영속 데이터에 저장되므로 변경 금지). */
export const REFERENCE_DOCUMENT_NODE_TYPE = 'referenceDocument';

export interface ReferenceDocumentData extends Record<string, unknown> {
  title: string;
  url: string;
  fileType?: string;
  theme?: NodeTheme;
}
```

```ts
// ✅ entities/reference-document/index.ts — Public API
export { ReferenceDocumentCard } from './ui/ReferenceDocumentCard';
export { REFERENCE_DOCUMENT_NODE_TYPE } from './model/types';
export type { ReferenceDocumentData } from './model/types';
```

```ts
// ❌ 엔티티가 위젯을 재수출 (리팩터링 전 실제 모습 — 순환 참조까지 유발)
export { ReferenceDocumentCard as ReferenceDocumentNode } from '@/widgets/reference-document-card';  // ❌
```

> **entity ↔ entity 참조도 금지입니다.** 두 엔티티가 얽히면 그 관계를 다루는 `feature`를 만드십시오.
> 실제 사례: 세션과 캔버스를 함께 바꿔야 하는 로직 → `features/workspace/model/useSessionActions.ts`

---

## `shared/` — 도메인 무관 범용 자산

**담는 것:** 어떤 도메인 지식도 없는 것만
**담지 않는 것:** "세션", "세그먼트", "참고문서" 같은 이 프로젝트 고유 개념

| 세그먼트 | 실제 내용 |
| --- | --- |
| `shared/api` | `httpClient`, `HttpError` — **모든 백엔드 통신의 유일한 출구** |
| `shared/config` | `env.apiBaseUrl` — **모든 환경 의존 값의 유일한 출처** |
| `shared/ui` | ShadCN 프리미티브, `InfiniteCanvas`, `RichTextEditor` |
| `shared/lib` | `cn` 등 순수 유틸 |
| `shared/model` | `NodeTheme` 등 도메인 무관 타입 토큰 |

```ts
// ✅ 통신은 반드시 이 경로로
import { httpClient } from '@/shared/api';

// ❌ 직접 fetch + 호스트 하드코딩
const res = await fetch('http://localhost:8000/api/v1/workspaces');   // ❌ P5 위반
```

> **`shared`에 도메인 로직을 넣지 마십시오.** "여러 곳에서 쓰니까 shared로" 는 잘못된 이유입니다.
> 판단 기준: **다른 프로젝트에 그대로 복사해도 말이 되는가?** No면 `entities`나 `features`입니다.

---

## `packages/` — 워크스페이스 패키지 승격

`apps/web` 밖에서도 쓰일 **호스트 비의존** 모듈은 `packages/`로 승격합니다.

| 조건 | 판정 |
| --- | --- |
| React Flow 핸들·전역 스토어에 의존하는가? | 승격 불가 — `apps/web` 안에 둔다 |
| props/인자만으로 완결되는가? | 승격 가능 |
| 둘 이상의 앱/툴이 쓸 예정인가? | 승격한다 |

```ts
// ✅ 패키지는 Public API 로만 참조
import { viewerRegistry } from '@vibe/document-viewer';

// ❌ 패키지 내부 경로 직접 참조
import { PdfViewer } from '@vibe/document-viewer/src/viewers/pdf/PdfViewer';   // ❌
```

**타입 중복 금지:** 패키지가 노출하는 타입을 앱에서 다시 선언하지 마십시오. 반드시 패키지에서 import합니다.

---

## 파일 크기 가이드

- **권장 100줄 이내**, 상한 150줄.
- 초과하면 시각적/기능적 단위로 분리합니다: 헤더, 리스트 아이템, 액션 버튼 그룹, 반복 버튼.
- **단, AHA(P6)가 이 줄 수 기준보다 우선합니다.** 줄 수를 맞추려고 억지로 공통화하지 마십시오. 반복이 3회 이상이고 구조가 굳었을 때만 추출합니다.
  - 참고: `ToolDockButton.tsx`(6회 반복 → 추출 ✅) vs `themeStyles` 맵(2곳이지만 값이 서로 다름 → 복제 유지 ✅)
