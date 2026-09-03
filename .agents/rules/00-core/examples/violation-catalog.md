---
description: "[최우선 부속] 이 저장소에서 실제로 발생했던 아키텍처 위반 사례와 수정 방법"
priority: 0
---

# 00-core / examples — 실제 위반 카탈로그

> 아래는 **가상의 예시가 아니라 이 저장소에서 실제로 발생했다가 수정된 사례**입니다.
> 같은 실수를 반복하지 마십시오. 새 코드를 쓰기 전에 자기 코드가 여기 패턴에 해당하는지 확인하십시오.

---

## V-01. 엔티티가 위젯을 재수출해 순환 참조 발생 🔴

**증상**

```ts
// entities/reference-document/index.ts
export * from './model/types';
export { ReferenceDocumentCard as ReferenceDocumentNode } from '@/widgets/reference-document-card';  // ❌

// widgets/reference-document-card/ui/ReferenceDocumentCard.tsx
import type { ReferenceDocumentData } from '@/entities/reference-document';   // ❌ → 순환
```

`entities → widgets → entities` 순환. P1(단방향 의존) 위반.

**왜 이렇게 됐나**
위젯으로 먼저 만든 뒤, 기존 import를 깨지 않으려고 엔티티에 "하위 호환 재수출"을 남겼습니다.
**하위 호환 shim은 위반을 영구화합니다.**

**수정**
노드 표현은 도메인의 기본 표현이므로 **엔티티가 소유**하는 것이 맞습니다.
위젯 전체를 `entities/reference-document`로 이관하고, 위젯 슬라이스를 삭제했습니다.

```text
widgets/reference-document-card/ui/ReferenceDocumentCard.tsx
  → entities/reference-document/ui/ReferenceDocumentCard.tsx
widgets/reference-document-card/model/useDocumentLayout.ts
  → entities/reference-document/lib/useDocumentLayout.ts
```

결과적으로 세 노드(`segment` / `resource-card` / `reference-document`)가 모두 `entities`에 대칭 배치됐습니다.

**교훈:** 리팩터링 후 **shim을 남기지 말고 호출부를 전부 고치십시오.**

---

## V-02. 실체 없는 "별칭 전용 슬라이스"가 feature 횡단을 유발 🔴

**증상**

```ts
// features/topdown-outline/model/useHybridEditorState.ts — 파일 전체가 이게 다임
export { useCanvasStore as useHybridEditorState } from '@/entities/canvas-board';
```

그리고 4개 feature가 이걸 참조:

```ts
// features/canvas-node-actions, features/canvas-toolbar, features/workspace ...
import { useHybridEditorState } from '@/features/topdown-outline/model/useHybridEditorState';  // ❌
```

P2(슬라이스 격리) + P3(Public API) 동시 위반. 게다가 `topdown-outline`은 **아무 기능도 없는 껍데기**였습니다.

**수정**
슬라이스를 삭제하고 4곳 모두 엔티티를 직접 참조하도록 변경했습니다.

```ts
import { useCanvasBoardStore } from '@/entities/canvas-board';   // ✅
```

**교훈:**
- 이름만 바꿔 재수출하는 슬라이스를 만들지 마십시오. **하나의 대상에는 하나의 이름만.**
- feature가 다른 feature의 것을 필요로 하면, 그건 **아래 레이어에 있어야 할 것**이라는 신호입니다.

---

## V-03. 위젯 JSX 안에 백엔드 통신이 박혀 있음 🟠

**증상** — `widgets/hybrid-editor-board/ui/HybridEditorBoard.tsx` (373줄)

```tsx
useEffect(() => {
  const res = await fetch(`http://localhost:8000/api/v1/workspaces/${activeSessionId}`);  // ❌ 세션 복원
  // ...
}, [activeSessionId]);

useEffect(() => {
  setTimeout(async () => {
    await fetch(`http://127.0.0.1:8000/api/v1/workspaces/${activeSessionId}`, {           // ❌ 자동저장
      method: 'PUT', /* ... */
    });
  }, 2000);
}, [nodes, edges /* ... */]);

// 그리고 onKeyDown 핸들러 안에 동일한 PUT 이 두 번 더 복붙돼 있었음 ❌
```

P4(로직/뷰 분리) + P5(SSOT) 위반. 호스트가 `localhost`와 `127.0.0.1`로 섞여 있기까지 했습니다.

**수정**

```ts
// features/workspace/model/useSessionSync.ts — 복원 + 자동저장을 훅으로 격리
export function useSessionSync() {
  useEffect(() => { /* 복원 */ }, [activeSessionId, loadSession]);
  useEffect(() => { /* 디바운스 자동저장 */ }, [nodes, edges, ...]);
  return { isRestored };
}
```

```tsx
// 위젯은 한 줄
useSessionSync();
```

제목 변경 PUT은 `useActiveSessionTitle`로 통합해 **3중 복붙을 1곳으로** 줄였습니다.
**위젯 373줄 → 133줄.**

**교훈:** JSX 파일 안의 `useEffect` + `fetch` 조합을 보면 즉시 훅으로 빼십시오.

---

## V-04. 백엔드 주소가 11곳에 하드코딩 🟠

**증상**

```text
features/canvas-file-drop/api/uploadDocumentApi.ts   http://127.0.0.1:8000
features/workspace/ui/SessionListSheet.tsx           http://localhost:8000  × 5
pages/dashboard/ui/DashboardPage.tsx                 http://localhost:8000
widgets/hybrid-editor-board/ui/HybridEditorBoard.tsx http://localhost:8000  × 3, 127.0.0.1 × 1
```

P5(SSOT) 위반. 배포하면 전부 깨지고, 에러 처리도 곳곳에서 제각각이었습니다.

**부작용:** `DashboardPage`가 존재하지 않는 `/api/health`를 호출하고 있었는데(실제 엔드포인트는 `/health`),
통신이 분산돼 있어 **아무도 눈치채지 못한 채 헬스체크가 영구 실패**하고 있었습니다.

**수정**

```ts
// shared/config/env.ts — 환경 값의 유일한 출처
export const env = {
  apiBaseUrl: readEnv('VITE_API_BASE_URL') ?? 'http://localhost:8000',
} as const;

// shared/api/httpClient.ts — 통신의 유일한 출구
export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, jsonInit('POST', body)),
  // ...
};
```

**raw `fetch` 11개 → 1개**(httpClient 내부), 하드코딩 호스트 0.

**교훈:** 통신 코드를 새로 쓸 때는 **먼저 `shared/api`에 해당 함수가 있는지** 확인하고, 없으면 그 슬라이스의 `api/` 세그먼트에 추가하십시오.

---

## V-05. 타입이 패키지와 앱에 이중 정의되고 이미 갈라짐 🟠

**증상**

| | `packages/document-viewer/src/types.ts` | `apps/web/src/entities/reference-document/model/types.ts` |
| --- | --- | --- |
| `DocumentViewerProps` | `onDimensionsChange` 있음 | 없음 |
| | `selected` 없음 | `selected?: boolean` 있음 |
| `ViewerDefinition` | 정의됨 | **똑같이 재정의됨** |

패키지로 승격해놓고 앱에서 다시 선언했고, 시간이 지나며 **필드가 서로 달라졌습니다.** P5 위반.

**수정**
앱 쪽 중복 선언을 삭제하고 패키지를 SSOT로 삼았습니다. 앱에는 앱 고유 타입(`ReferenceDocumentData`)만 남깁니다.

**교훈:** `packages/*`가 노출하는 타입을 앱에서 다시 쓰지 마십시오. **import 하십시오.**

---

## V-06. 리팩터링 잔해(shim)와 100% 동일 중복 파일 🟠

**증상**

| 파일 | 정체 | 참조 수 |
| --- | --- | --- |
| `src/lib/utils.ts` | `shared/lib` 재수출 shim | **0** |
| `entities/reference-document/model/viewerRegistry.ts` | 패키지 재수출 shim | **0** |
| `entities/reference-document/ui/ReferenceDocumentNode.tsx` | 위젯 재수출 shim | **0** |
| `NodeSpreadAnchor.tsx` | entities/widgets 양쪽에 **바이트 단위 동일한 사본** | 각 1곳 |
| `src/components/ui/*.tsx` | `shared/ui` 재수출 shim ×4 | 1곳 |

**근본 원인**
`apps/web/components.json`의 alias가 `@/components/ui`를 가리키고 있어서,
`npx shadcn add`를 실행할 때마다 **FSD 밖에 파일이 다시 생성**되고 있었습니다.
규약 문서(`20-modularity/ui-shadcn-first.md`)조차 `components/ui`를 보라고 지시하고 있었습니다.

**수정**
1. shim/중복 파일 8개 삭제 (중복 사본은 한 벌만 남김)
2. `components.json` alias를 `@/shared/ui` / `@/shared/lib`로 교체
3. 모순되던 규약 문서 수정

**교훈:** 위반을 코드에서만 지우면 **도구 설정과 문서가 그것을 다시 만들어냅니다.**
위반을 고칠 때는 반드시 **"이게 어디서 생성되는가"** 를 함께 확인하십시오.

---

## V-07. 타입 소유권 역전 🟠

**증상**

```ts
// features/canvas-node-actions/model/useNodeActions.ts
export type NodeTheme = 'default' | 'yellow' | 'green' | 'blue' | 'purple';   // ❌ feature 가 소유
```

그런데 이 테마를 **실제로 렌더링하는 건 하위 레이어인 `entities/segment`**였습니다.
엔티티가 feature의 타입을 참조해야 하는데 P1 위반이라 불가능 → 엔티티는 타입 없이 `data.theme`을 그냥 읽고 있었습니다.
(`extends Record<string, unknown>` 덕분에 타입 검사만 통과하던 상태)

**수정** — §7 절차 2번(하향 이동) 적용

```ts
// shared/model/nodeTheme.ts — 도메인 무관 표현 토큰이므로 shared 로
export type NodeTheme = 'default' | 'yellow' | 'green' | 'blue' | 'purple';
```

이제 `entities`와 `features` 양쪽이 아래로 참조합니다. 엔티티 타입에도 `theme?: NodeTheme`를 정식 선언했습니다.

**단, Tailwind 클래스 맵(`themeStyles`)은 합치지 않았습니다.**
`SegmentNode`는 `/80` 투명도에 `slate-200` 테두리, `ReferenceDocumentCard`는 `/70`에 `slate-300`으로 **의도적으로 다릅니다.**
→ P6(AHA)에 따라 복제 유지. **타입은 SSOT, 스타일은 복제**가 정답입니다.

---

## V-08. 백엔드 도메인이 3분할 규약을 지키지 않음 🟡

**증상**

| 도메인 | router | schemas | service |
| --- | --- | --- | --- |
| `workspaces` | ✅ | ✅ | ✅ |
| `documents` | ✅ | ❌ router에 인라인 | ✅ |
| `rag` | ✅ | ❌ router에 인라인 | ⚠️ 존재하나 **호출되지 않음** |
| `templates` | ✅ | ❌ | ❌ |

`rag/router.py`는 service를 import조차 하지 않고 라우터가 직접 응답 스텁을 반환했습니다.
`documents/router.py`는 파일 경로 조합·존재 확인을 직접 수행했습니다(로직이 router에).

**수정**
모든 도메인에 `schemas.py`를 분리하고, router는 service로만 위임하도록 정렬했습니다.

```python
# ❌ router 가 로직 수행
file_path = os.path.join(UPLOAD_DIR, filename)
if not os.path.exists(file_path):
    raise HTTPException(status_code=404, detail="File not found")
return FileResponse(file_path)

# ✅ service 에 위임
return FileResponse(resolve_uploaded_file(filename))
```

**교훈:** 스텁이라도 3분할 골격을 갖춰 두십시오. 나중에 채울 때 구조가 흔들리지 않습니다.

---

## V-09. 경로/설정이 실행 위치에 종속 🟡

**증상**

```python
DB_FILE = "workspaces_db.json"   # ❌ 상대 경로
UPLOAD_DIR = "uploads"           # ❌ 상대 경로
```

모노레포 루트에서 turbo로 실행하면 전혀 다른 곳을 바라봅니다.
게다가 `main.py`는 `allow_origins=["*"]` + `allow_credentials=True` 조합이었습니다.

**수정**

```python
# app/core/config.py — 경로·CORS·외부 URL 의 SSOT
BASE_DIR = Path(__file__).resolve().parents[2]     # apps/api, CWD 무관

class Settings:
    def __init__(self) -> None:
        self.upload_dir = Path(os.getenv("VIBE_UPLOAD_DIR", str(BASE_DIR / "uploads")))
        self.db_file = Path(os.getenv("VIBE_DB_FILE", str(BASE_DIR / "workspaces_db.json")))
        self.cors_origins = self._read_cors_origins()   # 화이트리스트
```

**교훈:** 백엔드에서 경로/호스트/허용치를 쓸 일이 생기면 **반드시 `app/core/config.py`를 경유**하십시오.

---

## V-10. 규약은 있는데 강제 수단이 없었음 🟡 (가장 중요)

**증상**
`50-develop/convention/front/rule.md`에 FSD 규칙이 명확히 적혀 있었지만,
`.oxlintrc.json`에는 규칙이 2개(`rules-of-hooks`, `only-export-components`)뿐이었습니다.
→ V-01 ~ V-07의 모든 위반이 **CI에서 한 번도 걸러지지 않았습니다.**

**수정**
레이어별 `no-restricted-imports` override + `import/no-cycle`을 추가해
상위 참조 / 동일 레이어 횡단 / 슬라이스 내부 참조 / 레거시 경로 / 순환 참조를 **에러로 차단**합니다.

```text
$ pnpm lint
error eslint(no-restricted-imports): '@/features/canvas-toolbar' import is restricted...
  help: FSD: entities 레이어는 app, pages, widgets, features, entities 를 import 할 수 없습니다.
        같은 레이어 간 cross-import 도 금지입니다.
```

**교훈:**
- **문서만으로는 규약이 지켜지지 않습니다.** 새 규칙을 도입하면 **동시에 자동 검증 수단을 붙이십시오.**
- 반대로, 린트 에러를 만나면 그건 **설계가 틀렸다는 신호**입니다. `disable` 주석으로 끄지 마십시오.

---

## 빠른 자가진단

새 코드를 작성한 뒤 아래를 스스로 물어보십시오.

- [ ] `@/` import 중에 **왼쪽 레이어**를 가리키는 게 있는가? → P1 위반
- [ ] 같은 레이어의 다른 슬라이스를 참조했는가? → P2 위반
- [ ] `@/<layer>/<slice>/` 뒤에 경로가 더 붙었는가? → P3 위반
- [ ] 새 슬라이스를 만들었는데 `index.ts`가 없는가? → P3 위반
- [ ] JSX/라우터 안에 `fetch`나 통신용 `useEffect`가 있는가? → P4 위반
- [ ] `http://`로 시작하는 문자열을 새로 썼는가? → P5 위반
- [ ] 훅 안에서 `alert`/`confirm`/`prompt`를 호출했는가? → P4 위반
- [ ] 노드 타입/엔드포인트 경로를 문자열 리터럴로 썼는가? → P5 위반
- [ ] "하위 호환용" 재수출 파일을 남겼는가? → V-01 재발
- [ ] `pnpm lint && pnpm typecheck && pnpm build`를 **실제로 실행**했는가? → P7
