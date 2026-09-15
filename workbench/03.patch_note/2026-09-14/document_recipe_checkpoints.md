# DocumentRecipe implementation checkpoints

1. Recipe aggregate/lifecycle: immutable revisions, direct editing API, source deletion preserves recipe and Wireframe.
2. Source readiness and LLM extraction run with provenance and telemetry.
3. Toolbar action and disabled-reason UI.
4. Inspector, contextual chips, and Recipe Matrix tab.
5. Integration tests and full gates.

## Current handoff state

- Checkpoint 1 completed: `apps/api/app/recipe/` now owns immutable revision
  files and `HEAD.json`; `POST/GET/PUT /api/v1/recipes` is assembled through
  the DI container. Recipe source anchors keep IDs only.
- Lifecycle completed: deleting a source document now removes the source,
  source-bound Outline/Segment artifacts, cache, and runs, while preserving
  Wireframes and Recipes. Migration v6 must be run explicitly for existing
  local storage before launching the API.
- Verified: `test_recipe_aggregate.py` (2), `test_storage_lifecycle.py` (6),
  `test_bootstrap.py` (7), and an isolated-storage `import main` all pass.
- Not yet verified: repository-wide `pnpm` gates; the local command currently
  stops before execution because pnpm requests a non-interactive modules-dir
  purge. No packages were installed or removed.
- Checkpoint 2 completed: a Recipe-owned input reader checks the four required
  adopted inputs and freezes their ID anchors plus minimal projections in the
  AgentRun input. `RecipePipeline`, `DistillRecipeUseCase`, telemetry, resume
  registration, readiness endpoint, and `/recipes/runs` are connected.
- Semantics: a successful LLM result creates a new independent Recipe with an
  `origin=llm` provenance record and moves HEAD immediately. There is no
  approval-pending state. A changed source does not auto-run extraction.
- Verified: Recipe code and package compile; isolated storage imports `main`
  and constructs `distill_recipe`; recipe aggregate tests still pass (2).
- Checkpoint 3 implemented: `entities/recipe` owns Recipe HTTP types/API;
  the existing reference-document LLM toolbar now includes an explicit Recipe
  action. Its state reads readiness and uses the newest archived Wireframe for
  the source document; disabled hover text lists only missing prerequisites.
- The Recipe button never persists Recipe content in a canvas node. It starts
  the Agent run and follows its normal runtime lifecycle.
- Verification pending: the first web typecheck invocation used POSIX env-var
  syntax in PowerShell; the corrected invocation began pnpm's local modules
  directory recreation but returned no completed typecheck result. Re-run after
  dependency preparation before checkpoint 3 is marked verified.
- Active checkpoint: 3 verification, then checkpoint 4 inspector/chips and
  Matrix tab.
- Checkpoint 4 started: the persistent `Settings → 저작 규격 패널 보기`
  preference is now in `useCanvasSettings` and exposed by the existing
  settings popover. It contains no document or Recipe data.
- Remaining checkpoint 4 work: compose the element-contextual inspector/chips
  in the reference-document workbench and add the `저작 규격` Matrix tab to
  the existing Wireframe focus detail view.
- Checkpoint 4 UI is now composed: the reference workbench renders the
  Recipe Inspector when the setting is on; it reports unmapped selected
  elements without altering them and exposes role/method/coupling/rubric
  accordions. The existing Wireframe focus detail includes a `저작 규격` tab
  that reads the linked Recipe Matrix.
- Verification remains blocked by the local pnpm dependency reconstruction
  failing with registry `EACCES`; no browser check was attempted.
- Next checkpoint: stabilize type/lint verification when dependencies are
  available, then add focused backend tests for readiness/run/resume and audit
  the full requirement set.
- Audit update: `apps/web/node_modules/.bin/tsc` and the workspace TypeScript
  binary are absent after pnpm reconstruction; pnpm cannot restore them because
  registry requests fail with `EACCES`. Frontend type/lint/build gates therefore
  remain unverified. Backend Recipe aggregate tests and isolated API import are
  the latest successful verification evidence.
- Checkpoint 5 started: resume-handler coverage now includes `recipes.distill`.
  `test_recipe_aggregate.py`, `test_bootstrap.py`, and
  `test_storage_lifecycle.py` completed together: 15 passed. Recipe telemetry
  ingestion errors are now isolated from the completed extraction result, in
  line with the other host telemetry adapters. The LLM span is named
  `LlmInference` so historical inspector aggregation is stable across models.
- Next handoff: add focused readiness/run/resume tests and run the full API
  suite. Frontend gates still require restoration of the workspace dependencies;
  the last ordinary pnpm reconstruction attempt failed on registry `EACCES`.
- Checkpoint 5 progress: focused Agent behavior coverage was added in
  `apps/api/tests/test_recipe_agent.py`. It proves readiness exposes only the
  missing prerequisites, a successful extraction immediately commits an
  `origin=llm` Recipe HEAD, and resume reuses the persisted snapshot without
  rereading sources. Recipe Agent + observability contract tests: 20 passed;
  Recipe aggregate/bootstrap/storage lifecycle + observability set: 35 passed.
  `ruff check app/recipe` also passes.
- Inspector completion: a mapped selected element now has an editable authoring
  role. Saving it calls the revision API and creates a new immutable Recipe
  revision; unmapped elements remain informational only. A direct TypeScript
  project build (`node .../typescript/bin/tsc -b apps/web`) passed after this
  change.
- Environment handoff (do not mistake this for code failure): an elevated
  `pnpm install --frozen-lockfile` completed, but a subsequent ordinary
  `pnpm lint` detected a modules-directory ownership mismatch and began a
  fresh reconstruction. It has remained silent with `node_modules/.modules.yaml`
  absent, so the full root lint/typecheck/build and `pnpm --filter @vibe/api
  test` gates are not yet proven. Resume from a single consistent terminal
  user by allowing `pnpm install --frozen-lockfile` to finish, then run the
  four root gates in `AGENTS.md`; do not report this feature as fully verified
  before they complete.
- Gate-recovery update: diagnostic process inspection found that two earlier
  web typecheck invocations and the root lint invocation each left their own
  `pnpm install` child process. They concurrently reconstructed the same
  modules directory, leaving it without `.modules.yaml`. Their command trees
  must be stopped before a single ordinary-user `pnpm install --frozen-lockfile`
  can restore the gate. The execution safety policy rejected force-terminating
  those processes without explicit user approval; do not kill unrelated dev
  server processes.

## Completion (gates recovered)

- Environment resolved: the concurrent `pnpm install` deadlock is gone.
  `node_modules/.modules.yaml` and the workspace TypeScript binary are present
  again, so the four root gates could finally run. No packages were removed.
- Gate failure found and fixed: `tests/test_architecture_contracts.py::
  test_contracts_guard_every_existing_segment` failed because the contract in
  `pyproject.toml` lists `app.recipe.agents`, but the segment existed on disk as
  a flat `app/recipe/agents.py`. The guard resolves `GUARDED_SEGMENTS` as
  directories, so the Recipe agent was silently outside the boundary check.
  `app/recipe/agents.py` is now the package `app/recipe/agents/` with
  `extract_recipe.py` and an `__init__.py` re-export, matching `outline`,
  `segments`, and `wireframe` and the agreed outline. The public import path
  `app.recipe.agents` is unchanged, so no caller moved.
- All four gates pass:
  `pnpm lint` 0 errors (Import Linter 13 contracts kept, including
  `recipe must not depend on other domains`), `pnpm typecheck`, `pnpm build`,
  and `pnpm --filter @vibe/api test` at **142 passed**.
- Storage migrated: local storage was still at v5, which is why the API dev
  process would not boot. `python -m migrations migrate` applied v6; status is
  now 6/6. v6 is additive only — it creates `data/knowledge/recipes/`.
- Runtime verified against an isolated storage root: create returns an
  `origin=manual` revision, HEAD points at it, a save writes a *new* immutable
  revision and moves HEAD, a stale `baseRevisionId` is rejected with 409,
  readiness reports only the missing prerequisites, and a run is refused with
  409 while not ready. On-disk layout is
  `data/knowledge/recipes/{recipeId}/HEAD.json` plus
  `revisions/{revisionId}/recipe.json`.
- Live API verified on :8000 — six routes register, and bootstrap logs
  `recipes.distill` among the registered resume handlers.
- Live UI verified on :5173 — `Settings → 저작 규격 패널 보기` toggles and
  persists as `showRecipeInspector` only; the canvas settings store holds no
  document or Recipe content.
- Not exercised end-to-end: an actual LLM extraction run, which needs a
  reference document with adopted Segment, Outline, and a Wireframe. Readiness
  correctly blocks the run until those exist, so the path is gated but the
  full distillation has not been observed against a real document.
- Residue to clear manually: `apps/api/.recipe-proof/` was created by the
  earlier elevated session and is not readable or removable by the ordinary
  user. It is leftover proof output, not source or data.

## End-to-end verification with real data

- Prerequisites exist in local storage, so the gated path could finally be
  exercised: three documents carry an adopted Segment HEAD, an adopted Outline
  HEAD, and archived Wireframes. Readiness returns `ready: true` for those
  document/wireframe pairs and lists only the missing items for the others.
- Two real LLM extractions ran to completion through `POST /recipes/runs`
  (`google-api`, `gemini-3.5-flash-lite`). Each committed a new Recipe whose
  provenance records `origin=llm`, the run id, prompt hash, engine version, and
  ID-only source anchors (`docId`, `segmentArtifactId`, `outlineArtifactId`,
  `scaffoldId`, `mappingFingerprint`). HEAD moved immediately — there is no
  approval-pending state, as agreed.
- The produced `spec` carries the four agreed layers: purpose/audience/tone,
  rhythm, blocks with `repeatPolicy` + `elementIds`, couplingRules, directives,
  and validationRubric. Blocks reference element IDs only; no source content is
  copied into the Recipe.
- Observability: the run emits `RecipePrompt` (chain/pre_llm), `LlmInference`
  (llm/llm), and `RecipeValidation` (parser/post_llm). The Inspector reads them
  with no frontend change.
- UI verified live: the toolbar action is enabled only where prerequisites are
  met, and disabled buttons name **only** what is missing
  (`추출 조건 누락: 채택된 세그먼트, 선택된 와이어프레임`). With the setting on,
  the workbench renders the populated Recipe Inspector — title plus
  저작 방식 / 결합 규칙 / 검증 기준 accordions and the revision-save action —
  while documents without a Recipe keep the empty state.

### Bug found and fixed during this verification

`useRecipeDistill` selected `archives[0]` from
`scaffoldArchiveApi.listByDocument`. That list is returned **oldest-first** and
is not sorted client-side, so the Recipe action bound to the *oldest* archived
Wireframe — a week-stale one in local data — while the handoff claimed it used
the newest. It now picks the maximum `createdAt` explicitly, so it does not
depend on server ordering. Confirmed live: the Inspector resolves the Recipe
attached to the newest Wireframe.

### Known gaps (not introduced here)

- Recipe runs record an empty `RunCost()`, so the monthly ledger shows zero
  tokens for a Recipe extraction. `segments` has the identical gap, while
  `outline` and `wireframe` record real cost. Closing it means threading usage
  out of `JsonPromptRunner`, which is a cross-cutting change beyond this
  feature.
- The agreed layout put LLM provenance in a separate `provenance.json` beside
  `recipe.json`. It is currently embedded inside `recipe.json`. Provenance is
  preserved and served correctly; only the file split differs.
- `apps/api/.recipe-proof/` still needs an elevated shell to remove.

## "버튼을 눌러도 반응이 없다" — 원인과 수정

증상 보고 후 로그를 확인한 결과, **버튼은 정상 동작하고 있었다.**
`state/log/2026-09-14/app.log` 에 `POST /api/v1/recipes/runs -> 202` 가 두 건
남아 있고, 두 실행 모두 `status=success, spans=3` 으로 끝나 Recipe 두 개가
실제로 커밋됐다. 즉 실패가 아니라 **결과가 화면에 보이지 않는 문제**였다.

원인은 세 가지가 겹친 것이다.

1. **재추출 결과가 화면에 반영되지 않음 (실질 버그).**
   추출은 매번 새 `recipeId` 를 만든다. 그런데 `by-scaffold` 응답은
   **오래된 순**이고, `useRecipeDistill` 과 `ScaffoldFocusModal` 이 모두
   `[0]` 을 집었다. 그래서 두 번째 추출부터는 새 Recipe 가 생겨도 화면은
   계속 첫 번째 것을 보여줬다 — 눌러도 아무것도 안 변한다.
   앞서 고친 와이어프레임 `archives[0]` 과 같은 종류의 실수다.
   이제 양쪽 모두 `provenance.createdAt` 최대값을 고른다.
2. **성공·실패 알림이 없었음.** `followAgentRun` 은 실패한 실행도 그대로
   반환하므로 `if (settled.status !== 'completed')` 로 보지 않으면 실패가
   조용히 삼켜졌다. 이제 실패는 오류 알림, 성공은 완료 알림을 띄운다.
   (다른 LLM 액션의 `alert` 관례를 그대로 따랐다.)
3. **`저작 규격 패널 보기` 가 꺼져 있으면 결과를 볼 곳이 자체가 없다.**
   이 설정은 브라우저별 `localStorage` 라 기본값이 off 다. 완료 알림 문구가
   이 설정을 안내하도록 했다.

부수적으로 프런트 `RecipeProvenance` 타입이 `recipeId`/`revisionId`/
`sourceAnchors` 세 개만 선언하고 있어 백엔드가 실제로 보내는
`createdAt`·`origin`·`runId`·`traceId`·`model`·`promptHash`·`engineVersion` 과
`mappingFingerprint` 가 빠져 있었다. 계약에 맞게 채웠다.

검증: 최신 선택이 실제로 동작하는지 결합 규칙 본문으로 구분해 확인했다.
같은 문서의 두 Recipe 가 각각 `"contents … a proof of expense media"`(이전)와
`"content list … proof media attached"`(최신)를 담고 있었고, Inspector 는
최신 문구를 렌더링했다. 실제 클릭에서 스피너 → 완료 알림까지 확인했다.
게이트 4개 전부 통과(lint 0 errors/경고 12 유지, typecheck, build,
API 142 passed).

### 남은 설계 판단 하나

재추출이 **매번 독립 Recipe 를 새로 만든다**(`recipe_id = new_id("recipe")`).
그래서 같은 와이어프레임에 Recipe 가 계속 쌓인다. 화면은 이제 최신만 보여
혼란은 없지만, "재추출은 같은 Recipe 의 새 revision 이어야 하는가"는
합의가 필요한 지점이다. 현재는 합의된 "LLM 은 결과를 뱉고 턴다" 를 따라
새 Recipe 로 두었다.

### 보정: 형제 LLM 액션과 같은 최소 과정을 지키게 함

앞선 완료 알림은 `설정의 [저작 규격 패널 보기] 로 확인하세요` 라고만 했다.
이는 이 저장소의 다른 LLM 액션이 지키는 과정을 빠뜨린 것이다. 기존 액션은
공통적으로 **결과가 놓일 자리를 스스로 열고**, **구체적인 결과 수치를
보고**한다.

- 세그먼트: `refreshSegmentStructure()` 후
  `문서 분석 완료: 총 N개의 논리 세그먼트(표/목록/섹션)가 감지되었습니다.`
- 아웃라인: `useDocumentOutline` 이 요청 시점에
  `setIsOutlineOpen(true) // 0ms 즉각 패널 오픈`
- 와이어프레임: 캔버스에 노드를 연결하고
  `스캐폴딩 추출 완료: [title] 노드가 캔버스에 연결되었습니다.`

저작 규격도 같은 과정을 따르게 했다.

- 버튼을 누르는 순간 `setShowRecipeInspector(true)` 로 **Inspector 를 먼저
  연다.** 아웃라인의 즉각 패널 오픈과 같은 자리다. 설정이 꺼져 있어도
  결과가 갈 곳이 생긴다. (`useCanvasSettings` 에 토글만 있고 명시적 setter 가
  없어 `setShowRecipeInspector` 를 추가했다.)
- 완료 알림이 실제 수치를 말한다 —
  `저작 규격 추출 완료: 총 N개의 작성 블록이 정리되었습니다.`
  블록 수는 실행 결과(`settled.result.recipe.spec.blocks`)에서 읽는다.
- 실패 시 `console.error` 를 남긴 뒤 알림을 띄운다(와이어프레임 액션과 동일).

검증: 설정을 off 로 되돌린 상태에서 버튼을 누르자 설정이 즉시 true 로 바뀌고
Inspector 가 열리며 스피너가 돌았고, 완료 시
`저작 규격 추출 완료: 총 3개의 작성 블록이 정리되었습니다.` 가 떴다.
패널에는 해당 Recipe 가 렌더링됐다. 게이트 4개 전부 통과.
