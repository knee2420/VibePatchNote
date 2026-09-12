# AGENTS.md — 이 저장소에서 작업하는 모든 코딩 에이전트에게

> ## ⛔ 코드를 쓰기 전에 반드시 [`.agents/rules/00-core/rule.md`](./.agents/rules/00-core/rule.md) 를 읽으십시오.
>
> 이 파일은 요약본입니다. 판단이 필요한 순간에는 위 문서가 정본입니다.

---

## 이 저장소는

**Turborepo 모노레포**입니다. 프론트엔드는 **FSD(Feature-Sliced Design)**, 백엔드는 **도메인 패키지 구조**를 따릅니다.

```text
apps/web       @vibe/web           React 19 + Vite + Tailwind v4 + React Flow + Tiptap
apps/api       @vibe/api           FastAPI + Agent Runtime
apps/inspector @vibe/inspector     관측 콘솔 (:5174). 읽기 전용, FSD 아님
packages/scaffold-engine           호스트 비의존 문서 스캐폴딩 엔진
packages/document-viewer           호스트 비의존 문서 뷰어 엔진
packages/agent-telemetry           호스트 비의존 관측 계약 (Span·Attempt·Snapshot)
packages/config                    공통 TypeScript 설정
```

> `apps/inspector` 는 내부 관측 도구라 FSD 레이어를 쓰지 않는다. 대신
> **백엔드 계약에서 타입을 생성**해 계약 이탈을 막는다
> ([`60-data/observability.md`](./.agents/rules/60-data/observability.md) §5).
> FSD 적용 여부는 열린 결정이다
> ([로드맵 §6](./workbench/06.agent_observability/06.abstraction_roadmap.md)).

런타임 데이터는 수명주기 등급으로 나뉩니다. **디렉터리 이름이 곧 취급 방식입니다.**

```text
apps/api/config/   설정        지우면 사용자 선택이 초기화
apps/api/data/     원본·산출물   지우면 복구 불가 · 백업 대상
apps/api/cache/    결정적 파생   지워도 재계산으로 복구
apps/api/state/    상태·로그     지워도 무해
```

---

## 절대 어기면 안 되는 것

```text
app → pages → widgets → features → entities → shared
─────────────────────────────────────────────▶  import 가능 방향은 오른쪽뿐
```

1. **하위 레이어는 상위 레이어를 참조하지 않는다.** (`entities`가 `features`를 import → 금지)
2. **같은 레이어의 다른 슬라이스를 참조하지 않는다.** (`features/a` → `features/b` 금지)
3. **슬라이스는 `index.ts`로만 접근한다.** (`@/features/workspace` ✅ / `@/features/workspace/ui/X` ❌)
4. **백엔드 통신은 `shared/api`의 `httpClient`로만 한다.** `fetch()` 직접 호출·호스트 하드코딩 금지.
5. **통신·상태 로직을 JSX에 두지 않는다.** `features/*/model/use*.ts` 훅으로 분리한다.
6. **린트 규칙을 `disable` 주석으로 끄지 않는다.** 경계 에러는 설계가 틀렸다는 신호다.
7. **다른 애그리거트는 식별자로만 참조한다.** 캔버스 노드에 `outlines`/`elements`/`segments`/본문 사본 금지 — `docId`·`scaffoldId` 포인터만. ([`60-data`](./.agents/rules/60-data/rule.md))
8. **저장 경로를 직접 만들지 않는다.** `app.core.storage` 를 거치고, 어느 등급에 두는지는 `bootstrap/container.py` 가 정한다.

위 1~3, 그리고 순환 참조는 **`pnpm lint`가 에러로 차단**합니다.

---

## 작업을 끝냈다고 말하기 전에

```bash
pnpm lint && pnpm typecheck && pnpm build
```

- `pnpm lint` **에러 0** (경고는 허용하되 늘리지 않음)
- 동작을 바꿨다면 **실제로 실행해서 확인**할 것. 빌드 통과 ≠ 동작 확인.
- 게이트를 돌리지 않았으면 "완료"라고 쓰지 말 것. 실패했으면 실패했다고 보고할 것.

---

## 기술 스택 (변경 금지)

| 영역 | 확정 | 금지 |
| --- | --- | --- |
| 캔버스 | `@xyflow/react` | React-Konva, Fabric.js, Canvas API |
| 리치 텍스트 | `Tiptap` | Slate.js, Quill |
| 상태 | `zustand` | 새 상태 라이브러리 |
| 패키지 매니저 | `pnpm` | `npm install`, `yarn` |

---

## 커밋

`type(scope): subject` — Conventional Commits.
예: `refactor(web): reference-document 위젯을 엔티티로 이관`

---

## 막혔을 때

규칙을 지키면서 구현이 불가능해 보이면 — **규칙을 우회하지 말고** 다음 순서로 시도하십시오.

1. 배치를 다시 판단한다 ([배치 결정표](./.agents/rules/00-core/rule.md#3-배치-결정표--이-코드를-어디에-둘-것인가))
2. 공통분모를 아래 레이어로 내린다
3. 상위 widget이 조합하게 한다
4. **그래도 안 되면 사용자에게 묻는다**

---

## 더 읽을 것

| 문서 | 내용 |
| --- | --- |
| [`.agents/rules/00-core/rule.md`](./.agents/rules/00-core/rule.md) | **헌법 (정본)** — 배치 결정표, 절대 금지, 완료 게이트 |
| [`.agents/rules/00-core/layers.md`](./.agents/rules/00-core/layers.md) | 레이어별 ✅/❌ 코드 대조 |
| [`.agents/rules/00-core/examples/violation-catalog.md`](./.agents/rules/00-core/examples/violation-catalog.md) | 실제 위반 사례 10건과 수정 방법 |
| [`.agents/rules/60-data/rule.md`](./.agents/rules/60-data/rule.md) | **데이터 관리 (정본)** — 수명주기 등급, 아티팩트·실행상태·원장, 마이그레이션 |
| [`.agents/rules/10-architecture/agent-runtime.md`](./.agents/rules/10-architecture/agent-runtime.md) | Agent Runtime 경계 |
| [`.agents/rules/README.md`](./.agents/rules/README.md) | 전체 규칙 인덱스와 우선순위 |
