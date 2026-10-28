---
name: develop_50_front_generator
description: "사용자가 프론트엔드(React/Vite) 기능 개발이나 리팩토링을 요청할 때 발동합니다. FSD, AHA, React Flow 기반의 엄격한 아키텍처 준수 여부를 체크리스트 기반으로 강제합니다."
---

# Frontend Development Checklist & Generator

이 스킬은 사용자가 프론트엔드(`apps/web`) 기능 구현이나 코드 작성을 지시할 때 자동으로 발동하거나 명시적으로 호출(`develop_50_front_generator`)됩니다. 
에이전트는 코드를 작성하기 전과 후에 반드시 아래의 **체크리스트**를 스스로 점검하고, 준수되었음을 사용자에게 보고해야 합니다.

> ⛔ **선행 조건:** 이 체크리스트는 요약 점검표입니다. 충돌 시 아래 정본이 우선합니다.
> 1. [`.agents/rules/00-core/rule.md`](../../rules/00-core/rule.md) — 헌법 (**§3.1 배치 결정표**를 먼저 확인)
> 2. [`.agents/rules/00-core/layers.md`](../../rules/00-core/layers.md) — 레이어별 ✅/❌ 코드 대조
> 3. [`.agents/rules/60-data/rule.md`](../../rules/60-data/rule.md) — **노드에 무엇을 저장할 수 있는가**

## 📋 [Frontend Development Checklist]

### 1. FSD (Feature-Sliced Design) 레이어 및 패키지 연동 검증
- [ ] **레이어 적합성:** 구현하려는 기능이 어느 레이어(`app`, `pages`, `widgets`, `features`, `entities`, `shared`)에 속하는지 정확히 식별했는가?
- [ ] **단방향 의존성:** import가 오직 `app → pages → widgets → features → entities → shared` 방향(오른쪽)으로만 향하는가? (예: `entities` 안에서 `features`나 `widgets`를 Import하는 역방향 위반이 없는가?)
- [ ] **동일 레이어 격리:** 같은 레이어의 다른 슬라이스를 참조하지 않았는가? (`features/A` → `features/B` 금지. Public API 경유라도 금지)
- [ ] **Public API 노출:** 모듈 외부로 노출할 때는 개별 파일 경로가 아닌 해당 슬라이스의 `index.ts` (Public API)를 통해서만 내보내고(Export) 참조(Import)했는가?
- [ ] **index.ts 생성:** 새 슬라이스를 만들었다면 `index.ts`를 **함께** 만들었는가?
- [ ] **공용 패키지(packages/*) 참조:** 여러 앱에서 재사용되는 모듈은 `@vibe/*` 워크스페이스 패키지로 추출되어 FSD 계층에서 라이브러리처럼 참조되고 있는가?
- [ ] **통신 경로 단일화:** 백엔드 호출을 `shared/api`의 `httpClient`로만 했는가? `fetch()` 직접 호출이나 `http://localhost:8000` 하드코딩이 없는가? (환경 값은 `shared/config`의 `env`)
- [ ] **로직/뷰 분리:** 통신·상태 로직을 JSX가 아니라 `features/*/model/use*.ts` 훅에 두었는가? 훅 안에서 `alert`/`confirm`/`prompt`를 직접 호출하지 않고 콜백으로 UI에 위임했는가?

### 1-2. 노드·세션 데이터 — 포인터만 저장 ⛔

> 캔버스 노드는 다른 애그리거트(문서·아티팩트·스캐폴드)를 **식별자로만** 참조합니다.
> 이 규칙을 어겨 세션 파일이 노드 9개에 349KB 까지 자란 적이 있습니다
> ([V-11](../../rules/00-core/examples/violation-catalog.md)).

- [ ] **파생물 사본 금지:** 노드 `data` 에 `outlines` / `elements` / `segments` /
      `htmlContent` / `markdownContent` / `slots` / `archive` 를 넣지 않았는가?
      정본은 백엔드 아티팩트 저장소이고, 노드는 `docId` · `scaffoldId` 포인터만 갖습니다.
- [ ] **상태는 보존:** 대신 `outlineStatus` · `outlineError` · `outlineTraceId` ·
      `lastSuccessfulOutlineAt` 처럼 **마지막 성공과 방금 실패를 구분할 수 있는 상태**는 남겼는가?
- [ ] **화이트리스트 갱신:** 새 노드 타입을 만들었다면 `shared/lib/canvasPersistence.ts` 의
      `PERSISTED_NODE_DATA_FIELDS` 에 **남길 필드 목록**을 추가했는가?
      (블랙리스트로 두면 필드가 늘 때마다 샙니다)
- [ ] **읽기와 실행 분리:** 패널을 여는 것만으로 LLM 분석이 다시 돌지 않는가?
      채택본 조회는 `GET /documents/{docId}/outline`(LLM 미개입)이고,
      분석 실행은 `POST /documents/outline/runs` 입니다.

> ⚠️ React Flow 의 `Node<T extends Record<string, unknown>>` 제약 때문에 **타입 시스템이
> 이 규칙을 잡아 주지 못합니다.** 인덱스 시그니처가 모든 필드를 통과시킵니다.
> 직접 확인하십시오.

### 1-3. Agent 실행 상태를 다룬다면

- [ ] **보류를 실패로 그리지 않았는가:** `waiting_for_configuration` /
      `waiting_for_approval` 은 실패가 아니라 보류입니다. 같게 그리면 사용자는
      풀리지 않는 재시도만 반복합니다.
- [ ] **폴링 종료 조건:** `shared/api` 의 `isSettled` 를 썼는가?
      "종료"가 아니라 **"더 이상 저절로 바뀌지 않는 상태"** 에서 멈춰야 합니다.
- [ ] **프로토콜은 `shared/api`:** 실행 조회·재개·승인은 `agentRunClient` / `followAgentRun`
      을 쓰고, `entities/agent-run` 을 다른 엔티티에서 import 하지 않았는가?

### 2. AHA (Avoid Hasty Abstractions) 원칙 준수
- [ ] **복제(Duplication) 허용:** 코드가 비슷해 보인다고 섣불리 `shared/`나 공통 Hook으로 추출하지 않았는가?
- [ ] **변경 용이성 최우선:** 기능 요구사항이 완벽히 굳어지기 전까지는 코드를 인라인(Inline)으로 유지하며 수정하기 편하게 작성했는가?

### 3. 코어 기술 스택 검증 (Tech Stack)
- [ ] **Canvas 엔진 제한:** 캔버스나 노드 조작 시 `React Flow`와 `Tiptap` 조합을 사용했는가? (`React-Konva`, `Fabric.js` 등 HTML5 Canvas 기반 라이브러리를 절대로 사용하지 않았는가?)
- [ ] **DOM 렌더링:** 커스텀 노드를 작성할 때 일반적인 DOM 기반 React 컴포넌트로 작성했는가?

### 4. 코드 컨벤션 (Google TS Style Guide)
- [ ] **네이밍 규칙:** 인터페이스 및 타입은 `PascalCase`, 변수 및 함수는 `camelCase`를 엄격히 지켰는가?
- [ ] **Import 구조:** 서드파티 라이브러리(NPM) Import 블록과 워크스페이스 패키지(`@vibe/...`), 내부 모듈(`@/...`) Import 블록을 시각적으로 한 줄 띄워 분리했는가?

### 5. 모노레포 위치 검증 (Apps vs Packages)
- [ ] **경로 확인:** 
  - 단일 웹앱 전용 코드는 반드시 `apps/web/src/` 내부의 알맞은 FSD 레이어에 위치하는가?
  - 캔버스 상태나 특정 앱에 결합되지 않고 여러 앱/툴에서 공통으로 쓰이는 범용 UI/엔진(예: 문서 뷰어 등)은 `packages/[패키지명]/src/`에 위치하고, `apps/web`에서 `workspace:*`로 연결되었는가?
  - 패키지를 참조할 때 Public API(`@vibe/[패키지명]`)만 사용하고, 패키지가 노출하는 타입을 앱에서 **다시 선언하지 않았는가?**

### 6. Component 기획 및 데이터 반영
- [ ] **CRUD + Entity 데이터 반영:** 새로운 Component를 기획하거나 구현할 때, 생성(Create) 뿐만 아니라 읽기(Read), 수정(Update), 삭제(Delete) 및 연관된 상태(Entity Data) 반영이 세트로 함께 고려되었는가? (예: 노드를 추가했다면 이를 삭제할 수단이 마련되어 있는가?)

### 7. shadcn/ui 컴포넌트 재사용성
- [ ] **기존 UI 컴포넌트 활용:** 새로운 UI 요소를 개발하기 전에 `apps/web/src/shared/ui/`에 이미 있는 컴포넌트인지 먼저 확인했는가? 없다면 `pnpm -F @vibe/web exec shadcn@latest add [이름]`으로 추가했는가? (alias가 `@/shared/ui`로 고정돼 있어 FSD 위치에 생성됩니다)

### 8. 외부 패키지 및 라이브러리 도입
- [ ] **오픈소스 우선 고려 및 사전 승인:** 구현 범위가 크거나 복잡한 기능의 경우, 직접 구현하기 전에 우리 스펙에 맞는 검증된 패키지나 오픈소스를 우선적으로 고민했는가? 단, **임의로 바로 설치하지 않고 반드시 선행 조사 후 채팅창에 리스트업하여 사용자의 승인을 먼저 구했는가?**
![alt text](image.png) -> Auto-proceeded 에 속지말 것! 반드시 유저는 이런 기계적인 것이 아닌 다른 답변을 할 것임

### 9. 기존 설치 사양 및 스펙 명세서 우선 점검 (기존 구성 재활용)
- [ ] **기존 라이브러리 및 스펙 우선 확인:** 기능을 새롭게 처음부터 구현하려고 하지 말고, 기존에 이미 설치된 패키지나 라이브러리, 그리고 기존에 있는 구성으로부터 스펙 명세서와 기준 설명서를 먼저 확인했는가?
- [ ] **기설치 사양 최우선 고려:** 완전히 새로운 코드를 밑바닥부터 작성하기 전에, 최대한 이미 설치된 사양과 기존 환경을 우선적으로 고려했는가?

### 10. 무결성 검증 (완료 게이트)
- [ ] **게이트 실행:** 루트에서 `pnpm lint && pnpm typecheck && pnpm build && pnpm --filter @vibe/api test`를 **실제로 실행**하여 통과를 확인했는가?
- [ ] **린트 에러 0:** `pnpm lint`의 에러가 0인가? (FSD 레이어 위반이 여기서 에러로 잡힙니다. 경고는 허용하되 새로 늘리지 않는다)
- [ ] **우회 금지:** 경계 규칙을 `oxlint-disable` / `eslint-disable` 주석으로 끄지 않았는가? (린트 에러는 설계가 틀렸다는 신호입니다)
- [ ] **동작 확인:** 동작을 바꿨다면 실제로 실행해서 확인했는가? (빌드 통과 ≠ 동작 확인)
      화면 렌더링처럼 터미널로 확인이 불가능한 변경에 한해 브라우저를 씁니다 —
      조건은 [`30-workflow/workflow-principles.md`](../../rules/30-workflow/workflow-principles.md) §2.

---

## 🤖 에이전트 행동 지침 (Agent Prompt)
이 스킬이 활성화되면, 에이전트는 코드 작성을 마친 후 다음과 같이 대답해야 합니다.

> "지시하신 프론트엔드 구현을 완료했습니다. `develop_50_front_generator` 체크리스트 점검 결과:
> 1. FSD 레이어 (통과/위반 사유)
> 1-2. 노드 데이터 포인터 규칙 (통과/위반 사유)
> 2. AHA 원칙 (통과/위반 사유)
> 3. Tech Stack (통과/위반 사유)
> 4. 코드 컨벤션 (통과/위반 사유)
> 5. 모노레포 경로 (통과/위반 사유)
> 6. Component 기획 (통과/위반 사유)
> 7. shadcn 컴포넌트 재사용성 (통과/위반 사유)
> 8. 외부 패키지 도입 절차 (통과/위반 사유)
> 9. 기존 설치 사양 및 스펙 명세서 점검 (통과/위반 사유)
> 10. 터미널 및 콘솔 에러/버그 유무 (통과/위반 사유)"

### 💡 핵심 원칙 (Core Principle)
- **자체 재구현 지양 & 기설치 사양 우선:** 기능을 새롭게 처음부터 구현하려고 하지 말 것. 반드시 기존에 이미 설치된 패키지나 라이브러리, 그리고 기존에 있는 구성으로부터 스펙 명세서와 기준 설명서를 먼저 확인하고, 최대한 이미 설치된 사양을 우선적으로 고려해야 합니다.

