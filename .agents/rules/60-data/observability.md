---
description: "관측 기록 3층의 소유 범위와 단일 어휘 (확정)"
---

# 관측 데이터 — 정본과 어휘

> 이 문서는 [`rule.md`](./rule.md) §4-7 *"관측은 두 갈래다"* 를 **대체**한다.
> 두 갈래라는 진술은 원장과 트레이스만 있던 시절의 것이다. 텔레메트리 스팬이
> 들어오면서 세 갈래가 되었고, 셋이 서로를 모른 채 자랐다.
>
> 수명주기 등급(`config`/`data`/`cache`/`state`) 판정은 여전히 `rule.md` 가 정본이다.
> 이 문서는 **`data/` 안에서 관측 기록끼리의 소유 경계**만 다룬다.

---

## 1. 문제 — 같은 실행이 세 곳에 다른 어휘로 적힌다

실측 (`apps/api/data`, 2026-09-12):

```text
전체 run 디렉터리 : 54
  events.jsonl    : 51      core/agent_runtime
  meta.json       : 17      core/llm/tracer
  둘 다           : 15      같은 실행이 이중 기록
월별 원장 엔트리  : 43      LocalLedger
```

| 기록 | 쓰는 곳 | `status` 표기 | 토큰 어휘 |
| --- | --- | --- | --- |
| `data/runs/{id}/events.jsonl` | `agent_runtime/repository.py` | `completed` / `failed` | `RunCost` |
| `data/runs/{id}/ledger.jsonl` · `meta.json` | `llm/tracer.py` | `success` / `failed` | `SpanUsage` |
| `data/ledger/{YYYY-MM}.jsonl` | `LocalLedger` | `SUCCESS` / `TIMEOUT` | `RunCost` |

증상은 세 곳에서 동시에 나온다.

- **Inspector 는 54건 중 17건만 보여준다.** `meta.json` 없는 디렉터리를 건너뛰기 때문이다.
  원장에만 있는 `TIMEOUT` 4건·`FAILED` 1건은 화면에 없다 — 관측 도구가 가장 봐야 할 기록이다.
- **`cacheReadTokens: 16288` 이 원장에 적혀 있는데 화면에는 `0` 이 뜬다.**
  `InspectorService` 가 `meta.json` 의 없는 키(`usage`)를 읽고 기본값 0 을 내보낸다.
- **월별 원장 파일 하나 안에 스키마가 둘이다.** `recordedAt`/`runId`(11건)과
  `recorded_at`/`run_id`(32건). `LedgerEntry` 에 alias 가 없어 앞의 11건은
  `model_validate` 를 통과하되 **모든 필드가 기본값으로 덮이며 조용히 유실된다.**

근본 원인은 기록이 셋이라는 것이 아니다. **셋이 같은 개념에 세 어휘를 쓰고,
소비자가 그중 가장 정보가 적은 하나만 읽는다는 것이다.**

---

## 2. 세 갈래는 층이 다르다 — 지우지 않고 소유를 나눈다

셋 다 정당하게 존재한다. 하나로 합치면 각자가 답하던 질문을 잃는다.

| 층 | 위치 | 소유하는 것 | 없을 수 있는가 |
| --- | --- | --- | --- |
| **실행 상태** | `data/runs/{run_id}/events.jsonl` | run 의 존재·생애주기·재개 | **아니오.** run 이 있으면 반드시 있다 |
| **단계 상세** | `data/runs/{run_id}/ledger.jsonl` | 스팬별 입출력·프롬프트·시도 이력 | **예.** 계측되지 않은 파이프라인은 없다 |
| **비용 원장** | `data/ledger/{YYYY-MM}.jsonl` | 토큰·실패코드 집계, 쿼터 판정 근거 | **아니오.** LLM 을 호출했으면 반드시 있다 |

여기서 세 규칙이 나온다.

### 2-1. run 목록의 정본은 `events.jsonl` 이다

`rule.md` §4-6 이 이미 *"이력이 정본"* 이라고 못박았다. 그 규칙은 재개에만 적용되는
것이 아니라 **"어떤 run 이 존재하는가"** 라는 질문 전체에 적용된다.

```text
❌ runs_dir 를 순회하며 meta.json 이 있는 것만 목록에 올린다
✅ runs_dir 를 순회하며 events.jsonl 을 fold 해 목록을 만든다
   ledger.jsonl 은 상세를 열 때 조인한다. 없으면 상세가 없을 뿐이다
```

`meta.json` 은 `ledger.jsonl` 의 **요약 파생**이다. 파생을 목록의 근거로 쓰면
파생이 없는 실행은 존재하지 않는 것이 된다 — 지금 37건이 그렇다.

### 2-2. 비용의 정본은 월별 원장이다

`rule.md` §4-7 이 *"토큰·비용. 집계·쿼터 판정의 근거. 영구"* 라고 정한 그대로다.
스팬 `usage` 합산은 **표시용 파생**이지 정산 근거가 아니다. 계측되지 않은
파이프라인의 비용은 스팬 합산에 잡히지 않지만 원장에는 잡힌다.

### 2-3. 단계 상세는 있으면 더 보여주고, 없으면 목록만 보여준다

`ledger.jsonl` 의 부재는 **정상 상태**다. 계측은 점진적으로 확산되며, 계측되지
않은 실행도 목록과 비용은 온전해야 한다. 소비자는 상세의 부재를 오류로
취급하지 않는다.

**근거**: OpenTelemetry 의 signal 분리 (traces / metrics / logs 는 서로의 부재를
전제로 독립 수집된다) / Kleppmann, *DDIA* ch.11 — system of record vs derived data.

---

## 3. 어휘는 하나다

같은 개념에 두 이름을 두면 변환이 필요한 곳마다 누락이 생긴다. 실제로
`InspectorService` 가 `SpanUsage` 를 `RunCost` 필드명으로 읽으려다 전부 0 이 되었다.

### 3-1. 상태 — 소문자. 대문자 표기 금지

```text
RunStatus   queued · running · completed · failed · waiting_for_configuration · waiting_for_approval
SpanStatus  pending · running · success · failed · skipped
```

둘은 서로 다른 개념이라 통합하지 않는다. run 에는 `waiting_*` 이 있고 스팬에는
없다. 다만 **표기는 둘 다 소문자이며, 어떤 저장 지점도 대문자로 쓰지 않는다.**

`03.data_contracts.md` §3 이 이미 `SpanStatus = 'pending' | 'running' | 'success' |
'failed' | 'skipped'` 로 못박았다. 사양이 옳았고 구현이 어겼다 —
`apps/inspector/src/types.ts` 가 `'SUCCESS' | 'FAILED' | 'FALLBACK_TRIGGERED'` 를
독자적으로 만들어 냈고, 그래서 성공한 스팬이 전부 실패 색으로 렌더된다.

> `FALLBACK_TRIGGERED` 는 상태가 아니라 **시도가 2회 이상이라는 사실**이다.
> `len(attempts) > 1` 로 유도한다. 상태 열거형에 넣지 않는다.

### 3-2. 토큰 — 두 어휘를 인정하고, 변환은 한 곳에만 둔다

두 이름이 존재하는 것 자체는 버그가 아니다. 경계가 다르다.

| | `SpanUsage` | `RunCost` |
| --- | --- | --- |
| 경계 | 공급자·텔레메트리 | 제품·정산 |
| 근거 | LLM API 응답의 원어 | 사용자·원장이 쓰는 말 |
| 필드 | `prompt_tokens` · `completion_tokens` · `reasoning_tokens` · `cache_read_tokens` | `input_tokens` · `output_tokens` · `thinking_tokens` · `cache_read_tokens` |

실제 버그는 **변환이 암묵적이었다는 것**이다. `InspectorService` 가
`SpanUsage` 모양의 데이터를 `RunCost` 키로 읽으려다 전부 0 이 되었다.
호출부마다 손으로 매핑하면 호출부 수만큼 틀릴 기회가 생긴다.

```text
❌ usage.get("input_tokens")        호출부가 남의 어휘를 추측한다
✅ to_run_cost(span_usage)          변환 함수 하나. 테스트가 무손실을 고정한다
```

**규칙**

1. 변환 함수는 **한 곳에만** 존재한다. 호출부에서 `dict.get()` 으로 필드명을 바꾸지 않는다
2. 변환은 **무손실**이어야 한다. 그래서 `SpanUsage` 에 `cache_read_tokens` 를 추가한다 —
   없으면 캐시 토큰이 변환에서 사라진다
3. `RunCost` 의 필드명은 바꾸지 않는다. `documents/schemas.py` 의 `RunCostView` 를 거쳐
   `apps/web` 이 소비하는 **살아있는 계약**이다. 관측 도구 하나를 고치려고
   제품 API 를 깨지 않는다

저장된 원장의 스키마 통일(camelCase → snake_case)은 **읽기 시점 폴백이 아니라
마이그레이션**으로 처리한다 (`rule.md` §5 — *"❌ 읽기 시점 자동 승격"*).

---

## 4. 모르는 값을 0 으로 표기하지 않는다

`InspectorService` 는 `cost_usd` 를 `0.0` 으로 내보낸다. 계산한 적이 없어서다.
`ModelSpec` 에 단가 필드가 없으므로 **시스템 어디에도 USD 비용은 존재하지 않는다.**

`0.0` 은 "무료"로 읽힌다. 없는 값과 0 인 값은 다르다.

```text
❌ cost_usd: float = 0.0        모르는 것을 공짜라고 말한다
✅ cost_usd: float | None = None 모르면 모른다고 말한다
```

USD 비용을 실제로 쓰려면 `ModelSpec` 에 단가 축을 추가하고 **기록 시점에**
계산해야 한다. 조회 시점 추정은 단가가 바뀌면 과거 실행의 비용이 소급해 바뀐다 —
원장이 영구인 이유와 정면으로 충돌한다.

같은 원칙이 라벨에도 적용된다.

```text
❌ if "outline" in pipeline_name: label = "문서 목차 추출"     조회 서비스가 도메인을 안다
✅ workflow_label 은 파이프라인이 기록 시점에 정한다. 없으면 없는 대로 둔다
```

---

## 5. 강제 수단

> `README.md` — *"문서만 있고 강제 수단이 없는 규칙은 지켜지지 않는다."*

검증은 전부 `apps/api/tests/test_observability_contract.py` 에 있다.
픽스처는 **실제 생산자 출력**이다 (`tests/fixtures/observability/README.md`).

| 규칙 | 검증 | 상태 |
| --- | --- | --- |
| 상태 어휘는 소문자다 | `::test_status_vocabulary_is_lowercase` | ✅ |
| 저장된 상태도 소문자다 | `::test_stored_span_status_is_lowercase` | ✅ |
| 폴백은 상태가 아니다 | `::test_fallback_is_not_a_status` | ✅ |
| 토큰 변환은 무손실이다 | `::test_usage_conversion_is_lossless` | ✅ |
| 합계는 구성요소에서 파생된다 | `::test_total_tokens_is_derived_when_provider_omits_it` | ✅ |
| 모르는 비용은 null 이다 | `::test_unknown_cost_is_null_not_zero` | ✅ |
| 단가 축이 생기면 알려준다 | `::test_model_registry_has_no_price_axis` | ✅ |
| TS 타입은 계약에서 생성된다 | `::test_generated_types_match_contracts` | ✅ |
| 원장은 단일 스키마다 | `::test_ledger_migration_unifies_schema` | ✅ |
| 마이그레이션은 멱등이다 | `::test_ledger_migration_is_idempotent` | ✅ |
| 시도 기록은 계약을 따른다 | `test_inspector.py::test_attempt_records_follow_the_contract` | ✅ |
| run 목록은 `events.jsonl` 에서 나온다 | `test_inspector.py::test_run_list_covers_uninstrumented_runs` | ⏳ A1 |
| 상세 부재는 오류가 아니다 | `::test_run_without_ledger_still_lists` | ⏳ A1 |

**TS 타입 수기 작성 금지**가 이 목록에서 가장 중요하다. 예전 `apps/inspector/src/types.ts`
는 손으로 베낀 것이었고, 그래서 `ModelAttemptRecord` 가 백엔드와 필드 하나도 맞지
않았다(`model` vs `model_name`, `duration_ms` vs `latency_ms`, 없는
`input_tokens`·`cost_usd`·`raw_command`). 타입 검사는 통과했다 — 양쪽이 서로를
몰랐기 때문이다.

이제 타입은 `apps/api/scripts/generate_inspector_types.py` 가 만든다.

```bash
python apps/api/scripts/generate_inspector_types.py           # 생성
python apps/api/scripts/generate_inspector_types.py --check   # 게이트
```

이행 계획은
[`workbench/06.agent_observability/06.abstraction_roadmap.md`](../../../workbench/06.agent_observability/06.abstraction_roadmap.md).

---

## 6. 새 워크플로우를 계측할 때

1. `StepCollector` 로 감싼다. **감싸지 않은 파이프라인은 목록에는 뜨지만 상세가 없다**
   (§2-3). 상세가 필요하면 계측이 조건이다
2. 상태·토큰은 §3 의 어휘만 쓴다. 새 열거값을 만들지 않는다
3. 사람이 읽을 라벨(`display_label` · `description` · `summary_pill`)은
   **기록 시점에** 파이프라인이 정한다. 조회 계층이 이름을 보고 추측하지 않는다 (§4)
4. `data_via` 에 파일명을 문자열로 쓰지 않는다. 소비자가 정규식으로 되파싱하게 된다 —
   실제로 `KNOWN_FILE_PATHS` 하드코딩과 경로 오배정을 낳았다.
   구조화 계획은 로드맵 Phase 2
5. LLM 을 호출했으면 원장에 기록한다 (§2-2). 스팬 `usage` 만으로는 정산되지 않는다
6. §5 의 검증을 추가한다
