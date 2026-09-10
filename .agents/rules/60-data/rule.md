---
description: "런타임 데이터의 수명주기 등급과 저장 규칙 (확정)"
---

# 데이터 관리 — 수명주기 등급

> 이 문서는 **런타임 데이터**를 다룹니다. 기획 산출물 관리는 [`40-workbench/`](../40-workbench/overview.md),
> 코드 배치는 [`00-core/rule.md`](../00-core/rule.md) 입니다.

---

## 1. 최상위 네 갈래가 전부다

```text
apps/api/
├── config/   설정              지우면 사용자 선택이 초기화된다
├── data/     원본·산출물·실행상태  지우면 복구 불가. 백업 대상
├── cache/    결정적 파생         지워도 재계산으로 복구된다
└── state/    운영 상태·로그       지워도 무해. 백업 불필요
```

**근거**: [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/)
(`DATA` / `CONFIG` / `STATE` / `CACHE`) 과 [FHS 3.0 §5.5](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/ch05s05.html)
— *"Cached files can be deleted without loss of data."*

디렉터리 이름 하나가 **"지워도 되나 / 백업하나 / 복구 때 뭘 되살리나"** 세 질문에 동시에 답한다.
이전 구조(`storage/` 한 폴더에 6종 혼재)는 그 어느 것에도 답할 수 없었다.

---

## 2. 판정 규칙 두 줄

```text
① 같은 입력으로 다시 돌려 바이트가 같은가?
   예    → cache/            PDF 렌더, 텍스트 추출, 기하 계산
   아니오 → data/             LLM 이 개입했으면 자동으로 여기

② 프로세스가 죽었을 때 잃으면 안 되는가?
   예    → data/             run 상태, 승인, 원장
   아니오 → state/            공급자 차단 상태, 디버그 트레이스, 앱 로그
```

### ⛔ LLM 산출물은 캐시가 아니다

`derived = f(source)` 는 **결정적 함수**를 전제한다. LLM 은
`output = f(source, model, prompt, temperature, provider, time)` 이라 재현되지 않고,
게다가 **돈이 든다.** 그러므로 아웃라인·세그먼트·스캐폴드는 캐시가 아니라
**provenance 를 동반한 불변 아티팩트**다.

**근거**: Kleppmann, *DDIA* ch.11 (system of record vs derived data) /
Artifact Registry 관행 (Maven·Docker·MLflow·DVC) / [SLSA provenance](https://slsa.dev/).

---

## 3. 확정 디렉터리 구조

```text
apps/api/
├── config/
│   └── llm-runtime-policy.json
│
├── data/                                    잃으면 복구 불가
│   ├── .storage_version                     마이그레이션 버전 마커
│   ├── knowledge/                           [4 Knowledge]
│   │   ├── documents/{doc_id}/
│   │   │   ├── meta.json                    originalName · sha256 · mime · uploadedAt
│   │   │   ├── source.{ext}
│   │   │   └── artifacts/{kind}/
│   │   │       ├── HEAD.json                현재 채택본 포인터
│   │   │       └── {artifact_id}/
│   │   │           ├── provenance.json      필수
│   │   │           └── ...
│   │   └── scaffolds/{scaffold_id}/         애그리거트 루트. docId 로 문서 참조
│   ├── runs/{run_id}/                       [2 Runtime] 재개 가능한 실행 상태
│   │   ├── events.jsonl                     append-only · 상태의 정본
│   │   ├── snapshot.json                    폴드 결과 (파생, 재생성 가능)
│   │   └── input.json                       재개용 입력 스냅샷
│   ├── agreements/{agreement_id}.json       [B Agreement] 사람의 결정 · 불변
│   ├── ledger/{YYYY-MM}.jsonl               [A Observation·집계] 영구
│   └── memory/
│       ├── sessions/{session_id}.json       [3 Memory] 그래프 = 포인터만
│       └── episodes/{doc_id}.jsonl          (예약)
│
├── cache/                                   LLM 미개입 = 결정적 파생만
│   └── documents/{doc_id}/vision|text|context/
│
└── state/                                   죽어도 되는 것
    ├── provider-state.json                  ledger 에서 재계산 가능
    ├── agy-status.json
    └── log/  app.log · engines/ · traces/{date}/
```

**층 이름(`knowledge` `runs` `memory` `agreements` `ledger`)은 아키텍처 문서의
6층+2레일과 같다.** 디렉터리만 보고 어느 층인지 알 수 있어야 한다.

---

## 4. 절대 어기면 안 되는 것

### 4-1. 애그리거트는 식별자로만 참조한다

**근거**: Vernon, *Effective Aggregate Design* Rule 3.

```text
❌ 세션 노드 data 에 outlines / elements / segments / htmlContent 사본
✅ 세션 노드 data 에 docId · scaffoldId 포인터
```

과거 이 규칙을 어겨 `workspaces_db.json` 이 노드 9개에 **349KB** 까지 자랐고
(76% 가 파생 사본), 재분석하면 노드·세션·저장소 세 곳이 갈라졌다.

**강제 수단**
- 프런트: [`shared/lib/canvasPersistence.ts`](../../../apps/web/src/shared/lib/canvasPersistence.ts)
  의 **화이트리스트**(`PERSISTED_NODE_DATA_FIELDS`). 블랙리스트로 두면 필드가 늘 때마다 샌다.
- 백엔드: `LocalWorkspaceRepository._without_derived` 가 마지막 관문에서 한 번 더 걸러 낸다.
  테스트 `test_workspace_adapter_strips_derived_copies` 가 이를 고정한다.

> ⚠️ React Flow 의 `Node<T extends Record<string, unknown>>` 제약 때문에 **타입 시스템은
> 이 규칙을 잡아 주지 못한다.** 인덱스 시그니처가 모든 필드를 통과시킨다.
> 그래서 강제 수단이 영속화 경계의 런타임 화이트리스트인 것이다.

### 4-2. 식별자는 대리키다

```text
❌ storage/documents/{파일명_slug}/          이름을 바꾸면 다른 문서가 된다
✅ data/knowledge/documents/{doc_id}/        이름은 meta.json 안에서만 산다
```

`doc_id` / `artifact_id` / `run_id` / `scaffold_id` 는 모두
`{prefix}-{ms:011x}-{rand8}` — 시간순 정렬이 되는 대리키다
([`core/storage/ids.py`](../../../apps/api/app/core/storage/ids.py)).

경로 세그먼트는 `safe_segment()` 를 통과해야 한다. **조용히 치환하지 않고 거부한다** —
치환은 서로 다른 두 식별자를 같은 디렉터리로 합쳐 데이터를 덮어쓴다.

**근거**: 관계형 정규화의 surrogate key 원칙 / Git object model.

### 4-3. 아티팩트는 불변이고, provenance 없이 존재하지 않는다

```text
data/knowledge/documents/{doc_id}/artifacts/outline/
├── HEAD.json            ← 재분석하면 이 포인터만 옮긴다
├── {art-A}/             ← 이전 결과는 그대로 남는다
└── {art-B}/provenance.json   run_id · trace_id · model · prompt_hash · engine_version · cost
```

같은 `artifact_id` 로 다시 커밋하면 `FileExistsError` 다. 덮어쓰면 결과와 그것을
만든 조건이 어긋나고, 모델을 바꿨을 때 비교할 기준선이 사라진다.

**강제 수단**: `tests/test_provenance.py`

### 4-4. 경로를 아는 것은 저장 게이트와 어댑터뿐이다

```text
✅ core/storage/paths.py   등급 루트 4개만 소유. 도메인 이름을 모른다
✅ bootstrap/container.py  어느 도메인이 어느 루트를 쓰는지 정하는 유일한 곳
✅ {domain}/adapters/      주입받은 루트만 쓴다
❌ use_cases · service · agents · core/agent_runtime 에서 app.core.config import
```

`settings` 가 구체 경로 9개를 전역 공개하던 시절, `core/llm/telemetry.py` 가
어댑터를 전부 건너뛰고 문서 저장 트리에 직접 썼다. 경로가 공개되면 누구나 우회한다.

**강제 수단**: `pyproject.toml` import-linter 계약
`"Storage paths are known only to adapters and bootstrap"`

### 4-5. `packages/*` 는 호스트 경로를 모른다

```text
❌ context_dir = pdf_path.parent / ".context"     엔진이 업로드 폴더를 오염시킨다
✅ OutlinePipeline(context_dir=...)               위치는 호스트가 정한다
```

엔진의 기본값은 **"아무 데도 쓰지 않는다"** 이다.

**강제 수단**: `tests/test_adapters.py::test_packages_do_not_import_app_modules`

### 4-6. 실행 상태는 로그가 아니다

중단·재개가 요구사항인 이상 `data/runs/` 는 `data/` 다. `state/` 에 두면
`rm -rf state/` 가 진행 중인 작업을 지운다.

- **이력이 정본**: `events.jsonl` (append-only), `snapshot.json` 은 폴드 결과
- **고아 정리**: 부팅 시 `queued`/`running` 인 run 을 `AGENT_RUN_INTERRUPTED` 로 확정.
  그러지 않으면 사용자에게 영원히 "분석 중"으로 보인다
- **보류는 실패가 아니다**: `waiting_for_configuration` / `waiting_for_approval` 은
  정리 대상이 아니며, 프런트도 실패로 그리면 안 된다

**근거**: Temporal / Step Functions 의 durable execution, Event Sourcing (Fowler).
**강제 수단**: `tests/test_run_recovery.py`

### 4-7. 관측은 두 갈래다

| | 위치 | 성격 | 보존 |
|---|---|---|---|
| **원장** | `data/ledger/{YYYY-MM}.jsonl` | 토큰·비용·실패코드. 집계·쿼터 판정의 근거 | 영구 |
| **트레이스** | `state/log/traces/{date}/` | 프롬프트·응답 본문. 크고 민감 | 14일 |

`provider-state.json` 은 원장의 **파생**이다. 앱이 자기 로그를 회전시키지 않고,
보존정책이 부팅 시 일괄 정리한다.

**근거**: OpenTelemetry 의 metrics vs traces / Twelve-Factor XI.

### 4-8. 삭제는 연쇄한다

`DELETE /api/v1/documents/{doc_id}` 는 **아티팩트 → 캐시 → 스캐폴드 → 트레이스 → 원본**
순으로 지운다. 프롬프트에 문서 본문이 실리므로 트레이스에 원문이 남는다. 그래서
트레이스는 `doc_id` 를 태깅한다 — 파일명 문자열로는 역추적할 수 없다.

지우는 순서가 파생 → 원본인 이유: 중간에 실패해도 원본이 남아 있으면 다시 지울 수 있다.

---

## 5. 마이그레이션

```bash
python -m migrations status
python -m migrations migrate
```

- 버전 있음 · 순서 있음 · **저장소에 커밋** · 사람이 실행
- 부팅 시 버전 불일치면 **거부하고 명령을 안내한다.** 자동 변환하지 않는다
- 각 단계는 자기 시대의 규칙(그때의 slugify, 그때의 id 형식)을 스스로 들고 있다.
  앱 코드를 import 하면 앱이 바뀔 때 과거 마이그레이션의 동작이 함께 바뀐다

**근거**: Alembic / Flyway / Rails migration 관행.
❌ 읽기 시점 자동 승격(lazy migration) — 언제 끝나는지 아무도 모르고 폴백이 영구히 남는다.

---

## 6. 검증 수단 (문서가 아니라 CI 가 지킨다)

| 규칙 | 검증 |
|---|---|
| `cache/` 는 지워도 된다 | `tests/test_storage_lifecycle.py::test_cache_is_disposable` |
| `state/` 는 지워도 된다 | `::test_state_is_disposable` |
| LLM 산출물은 `cache/` 에 없다 | `::test_llm_artifacts_never_live_in_cache` |
| 삭제는 연쇄한다 | `::test_document_deletion_removes_every_derivative` |
| 경로 세그먼트는 치환하지 않는다 | `::test_path_segments_reject_traversal` |
| 아티팩트는 불변 | `tests/test_provenance.py::test_committed_artifact_is_immutable` |
| provenance 는 필수 | `::test_every_artifact_carries_provenance` |
| 재분석은 버전을 쌓는다 | `::test_reanalysis_stacks_a_version_and_moves_head` |
| 고아 run 은 정리된다 | `tests/test_run_recovery.py::test_interrupted_runs_are_swept_on_boot` |
| 보류는 정리 대상이 아니다 | `::test_waiting_runs_survive_the_sweep` |
| 승인은 재시작을 넘는다 | `::test_agreement_outlives_the_process` |
| 세션은 포인터만 갖는다 | `tests/test_adapters.py::test_workspace_adapter_strips_derived_copies` |
| 경로는 게이트를 통한다 | `lint-imports` 계약 6건 |

> 근거: [`.agents/rules/README.md`](../README.md) — *"문서만 있고 강제 수단이 없는 규칙은 지켜지지 않는다."*

---

## 7. 새 데이터를 추가할 때

1. **판정 규칙 두 줄**(§2)로 등급을 정한다
2. `core/storage/paths.py` 에 층 접근자를 추가한다 (도메인 이름은 넣지 않는다)
3. `bootstrap/container.py` 에서 어댑터에 루트를 주입한다
4. 어댑터에 저장 레이아웃을 둔다. 유스케이스는 포트만 안다
5. LLM 산출물이면 `provenance.json` 과 `HEAD.json` 규격을 따른다
6. 등급이 지켜지는지 테스트를 추가한다 (§6)
7. 저장 레이아웃이 바뀌었으면 `migrations/` 에 단계를 추가하고 `STORAGE_VERSION` 을 올린다
