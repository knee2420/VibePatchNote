# [Measurement] FSD 리팩토링 이후 React Flow 캔버스 성능 회귀 조사

* **조사 일자**: `2026-09-03`
* **상태**: `🟡 미해결 (재현 실패)`
* **문서 경로**: `workbench/04.measurement/2026-09-03/measurement_canvas_perf_regression.md`
* **선행 조사**: 없음 (본 저장소 최초 카드)
* **기준 커밋(Baseline)**: `17c5996` (refactor-fsd-principle, 리팩토링 이전)
* **대상 커밋(Target)**: `bc3600a` (all-new-refactoring, FSD + 모노레포 전면 리팩토링)
* **관련 패치노트**: 해당 없음 (본 조사로 인한 코드 변경은 배럴 import 1건뿐)

---

## 📌 1. 증상 (Reported Symptom)

> "지금 전체적으로 리팩토링 한 다음 렉이 매우 심해지고 반응들이 너무 느려졌어. 이전에는 안그랬는데 말이지. 캔버스 reactflow 의 성능 저하가 발생했어"

* **발생 시점**: `bc3600a` (FSD + 모노레포 전면 리팩토링) 이후
* **영향 범위**: React Flow 캔버스 조작 전반
* **보고자 인지**: 리팩토링 이전에는 없던 현상

---

## 🎯 2. 가설 목록 (Hypotheses)

리팩토링에서 실제로 변경한 지점을 근거로 8개 가설을 수립.

| # | 가설 |
| :---: | :--- |
| H1 | 캔버스 스토어 분리 과정에서 rAF 배칭 스케줄러가 손상됨 |
| H2 | `InfiniteCanvas` 또는 커스텀 노드 컴포넌트의 렌더 로직이 변경됨 |
| H3 | 스토어 구독 방식 변경으로 프레임당 리렌더 수가 증가함 |
| H4 | 세션 복원/자동저장 훅(`useSessionSync`) 이관 과정에서 렌더 루프 발생 |
| H5 | `pnpm install` 재링크로 React / @xyflow 중복 인스턴스 발생 |
| H6 | 백엔드 주소를 `127.0.0.1` → `localhost`로 통일하면서 IPv6 폴백 지연 발생 |
| H7 | 중복 dev 프로세스(vite/uvicorn) 잔존으로 인한 시스템 부하 |
| H8 | 배럴(`@/shared/ui`) import 도입으로 모듈 그래프가 비대해짐 |

---

## 🔬 3. 측정 방법 (Method)

### 3-1. 베이스라인 정면 대조
```bash
diff <(git show 17c5996:apps/web/src/entities/canvas-board/model/useCanvasStore.ts) \
     apps/web/src/entities/canvas-board/model/useCanvasBoardStore.ts
```
핫패스 파일(스토어, `InfiniteCanvas`, 노드 컴포넌트)을 리팩토링 전후로 직접 diff.

### 3-2. 스토어 구독 방식 정량 비교
```bash
git show 17c5996:apps/web/src/<path> | grep -c "useHybridEditorState()"
```
무선택자 구독(`useStore()` — 모든 `set()`마다 리렌더)의 개수를 전후 집계.

### 3-3. React 커밋 횟수 실측 (dev 빌드)
React DevTools 글로벌 훅을 가로채 커밋 수를 카운트.
```js
const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
const orig = hook.onCommitFiberRoot;
hook.onCommitFiberRoot = function(...a){ window.__c.commits++; return orig?.apply(this, a); };
```

### 3-4. 스토어 직접 구동 벤치마크
Vite dev의 ESM을 페이지에서 직접 import하여 실제 앱 인스턴스의 스토어를 조작.
```js
const m = await import('/src/entities/canvas-board/index.ts');
m.useCanvasBoardStore.getState().onNodesChange([{ id, type:'position', dragging:true, position:{x,y} }]);
```

### 3-5. 의존성 중복 검사
```bash
find . -path "*/node_modules/react/package.json" -not -path "*/react/node_modules/*"
find . -path "*/node_modules/@xyflow/react/package.json"
```

### 3-6. 네트워크 지연 A/B
브라우저에서 `localhost` vs `127.0.0.1`로 `/health`를 각 8회 호출하여 중앙값 비교.

### 3-7. 프로세스 점유 확인
```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='python.exe'"
```

---

## 📊 4. 측정 결과 (Findings)

### 4-1. 배제된 가설 (Ruled Out) — ⭐ 재조사 방지용 핵심 기록

| # | 가설 | 검증 방법 | 결과 | 판정 |
| :---: | :--- | :--- | :--- | :---: |
| **H1** | rAF 배칭 손상 | 스토어 파일 전후 diff | `pendingNodeChanges` 버퍼 · `requestAnimationFrame` 스케줄러 **로직 완전 동일**. diff는 세션 필드 분리(`activeSessionId` 등 제거)와 `setGraph`/`resetGraph` 추가뿐 | ❌ 아님 |
| **H2** | 캔버스/노드 렌더 로직 변경 | 파일 전후 diff | `InfiniteCanvas.tsx` **바이트 단위 동일**. `ReferenceDocumentCard`·`SegmentNode`는 **import 줄 외 본문 동일** | ❌ 아님 |
| **H3** | 리렌더 수 증가 | 무선택자 구독 개수 집계 | **이전**: `useNodeActions`, `CanvasSearchModal`, `CanvasLeftToolbar`, `SessionListSheet` **4곳이 무선택자 구독** → 모든 `set()`마다 리렌더. **이후**: 전부 세밀한 선택자 → **리렌더는 오히려 감소** | ❌ 아님 (반대) |
| **H4** | 렌더 루프 발생 | idle 5초간 React 커밋 카운트 | **커밋 0회**. 무한 렌더 루프 없음 | ❌ 아님 |
| **H5** | React/@xyflow 중복 인스턴스 | node_modules 실측 | `react@19.2.8` **1개**, `@xyflow/react@12.11.6` **1개**. 중복 없음 | ❌ 아님 |
| **H6** | `localhost` IPv6 폴백 지연 | `/health` 8회 A/B | `localhost` 중앙값 **3.2ms** vs `127.0.0.1` **3.3ms**. 유의미한 차이 없음 | ❌ 아님 |
| **H7** | 중복 dev 프로세스 | 프로세스 커맨드라인 조회 | vite dev **1개**(PID 35296), uvicorn **1개**(PID 27236). 폭주 프로세스 없음 | ❌ 아님 |
| **H8** | 배럴 import로 모듈 그래프 비대 | import 경로 grep | `SegmentNode`가 `@/shared/ui` 배럴을 참조 → `InfiniteCanvas`(React Flow 전체) + `RichTextEditor`(Tiptap)를 동반 로드. **런타임 렌더 비용과는 무관**하나 dev 모듈 그래프에는 불리 | ⚠️ 부분 사실 (렉 원인은 아님) |

### 4-2. 확인된 사실 (Confirmed)

* **소스 파일 수 증가**: `61개 → 88개` (+44%). 컴포넌트 분해에 따른 결과.
  → 런타임 성능과 무관하지만 **dev 콜드 스타트 / HMR 체감은 느려짐**.
* **localStorage 영속화 부하 (전후 동일)**: `persist` 미들웨어가 드래그 중 **매 rAF 프레임마다 전체 노드 배열을 `JSON.stringify` 후 동기 기록**.
  * 테스트 보드(노드 3개) 기준 페이로드 **1,034 bytes** → 무시 가능.
  * ⚠️ 단, 이 비용은 **노드 수와 노드 데이터 크기에 정비례**함.
  * 참고: 리팩토링 이전 `partialize`는 `{activeSessionId, activeSessionTitle, nodes, edges}` 4필드, 이후는 `{nodes, edges}` 2필드 → **페이로드는 오히려 작아짐**.
* **테스트 보드 규모**: 조사에 사용한 `tuto1` 세션은 **노드 3개**(PDF 2 + 이미지 1)에 불과 → 부하 재현에 부적합했음.

### 4-3. 계측 한계 (Instrument Limitations) — ⚠️ 신뢰 불가 데이터

* **프레임 타이밍 계측 전면 무효**: 조사에 사용한 브라우저 패널이 백그라운드로 내려가면 `requestAnimationFrame`이 throttle됨.
  * 증상: 수 초간 프레임 샘플 **9개**만 수집, 스토어 직접 구동 30회에도 **React 커밋 0회 / localStorage 쓰기 0회**.
  * 원인: 스토어의 배칭이 rAF 기반이므로, rAF가 멈추면 `set()` 자체가 발생하지 않음.
  * **결론: 본 조사의 FPS·프레임 지연 수치는 근거로 채택하지 않음.**
* **합성 이벤트로 드래그 재현 실패**: React Flow는 d3-drag 기반이라 `PointerEvent`/`MouseEvent` 합성 디스패치에 반응하지 않음. 실제 입력 장치 이벤트가 필요.

---

## 🧾 5. 결론 (Conclusion)

### ⚠️ 원인을 재현하지 못했습니다.

리팩토링이 캔버스 성능을 저하시켰다는 **근거를 찾지 못했습니다.** 오히려 핵심 지표는 개선 방향입니다.

| 항목 | 리팩토링 전 | 리팩토링 후 |
| :--- | :--- | :--- |
| rAF 배칭 스케줄러 | 있음 | **동일** |
| `InfiniteCanvas` | — | **바이트 단위 동일** |
| 매 `set()`마다 리렌더되는 컴포넌트 | **4개** | **0개** |
| localStorage 영속 페이로드 | 4필드 | **2필드 (더 작음)** |
| React / @xyflow 인스턴스 | — | 각 1개 (중복 없음) |

### 잔여 유력 후보 (미검증)

**`persist` 미들웨어의 프레임당 동기 직렬화.** 리팩토링 전후 동일한 동작이라 "회귀"의 원인은 아니지만, **노드 수가 늘어나면 단독으로 심각한 렉을 유발**할 수 있는 유일한 구조적 병목입니다.

* 노드 3개(1KB)에서는 무해하나, 노드 수십 개 + PDF/이미지 메타가 붙으면 프레임당 수백 KB 동기 쓰기가 발생.
* `localStorage.setItem`은 **메인 스레드를 블로킹**하므로 즉시 프레임 드랍으로 이어짐.
* → **개선안**: 드래그 중에는 영속화를 건너뛰고 드래그 종료 시점에만 기록. (저장 시점만 변경, 데이터 보존 동일)

---

## 🛠️ 6. 조치 (Actions Taken)

### 적용함
* **배럴 import 축소** — [`SegmentNode.tsx:4`](../../../apps/web/src/entities/segment/ui/SegmentNode.tsx)
  ```diff
  - import { RichTextEditor } from '@/shared/ui';
  + import { RichTextEditor } from '@/shared/ui/editor/RichTextEditor';
  ```
  캔버스 노드 컴포넌트가 배럴을 통해 `InfiniteCanvas`(React Flow 전체)까지 끌어오던 구조를 제거.
  FSD상 `shared` 하위 세그먼트 직접 참조는 허용되므로 린트 규칙에 저촉되지 않음. `typecheck` / `lint` 통과 확인.

### 적용하지 않음 (근거 부족)
* `persist` 스로틀링 — 개선 가치는 있으나 **회귀 원인이라는 근거가 없어** 사용자 확인 후 적용 대기.
* 리팩토링 롤백 — 대조 결과 회귀 근거를 찾지 못해 보류.

---

## ❓ 7. 후속 확인 필요 사항 (Open Questions)

원인을 좁히려면 아래 3가지가 필요합니다.

1. **실제 작업 세션의 노드 수는 몇 개인가?**
   조사에 사용한 보드는 3개뿐이라 부하 재현이 불가능했음. `persist` 가설의 성립 여부가 여기에 달림.
2. **어떤 조작이 느린가?**
   노드 드래그 / 캔버스 팬·줌 / Tiptap 텍스트 입력 / 페이지 진입 — 각각 병목 지점이 다름.
3. **`pnpm dev`(dev 서버)에서만인가, 프로덕션 빌드에서도인가?**
   dev 전용이라면 파일 수 증가(61→88)에 따른 모듈 그래프 문제이므로 대응이 달라짐.

### 다음 조사 시 개선할 계측 방법
* 프레임 계측은 **브라우저 패널을 반드시 포그라운드로 유지**한 상태에서 수행할 것 (rAF throttle 회피).
* 합성 이벤트 대신 **실제 입력 장치 이벤트**로 드래그를 구동할 것.
* 부하 재현을 위해 **노드 30~50개 규모의 테스트 세션을 별도 준비**할 것.

---

* **조사 수행**: Antigravity Pair Programmer
* **소요**: 가설 8건 수립 → 7건 측정 배제 → 1건 부분 사실 확인 → 재현 실패 결론
