---
name: develop_50_back_llm_generator
description: "사용자가 LLM 이 개입하는 백엔드 기능(아웃라인·스캐폴드 등 Agent 유스케이스, 새 LLM 공급자·폴백, 프롬프트, 실행 상태·재개·승인)의 구현을 요청할 때 발동합니다. Agent Runtime 경계와 산출물 등급(provenance 동반 아티팩트)을 강제합니다."
---

# Agent & LLM Development Checklist & Generator

이 스킬은 사용자가 **LLM 이 개입하는 백엔드 기능** 구현을 지시할 때 발동합니다.
발동 여부는 한 줄로 판정합니다 — **LLM 을 호출하는가?**

> ⛔ **선행 조건:** 이 체크리스트는 요약 점검표입니다. 충돌 시 아래 정본이 우선합니다.
> 1. [`.agents/rules/00-core/rule.md`](../../rules/00-core/rule.md) — 헌법
> 2. [`.agents/rules/10-architecture/agent-runtime.md`](../../rules/10-architecture/agent-runtime.md) — 실행 경계·상태 계약
> 3. [`.agents/rules/60-data/rule.md`](../../rules/60-data/rule.md) — 산출물·실행 상태·원장을 어디에 둘지
> 4. [`.agents/rules/50-develop/construct/rule.md`](../../rules/50-develop/construct/rule.md) — 추가 절차(§6 Agent, §7 공급자)
>
> 정본 참조 구현: `apps/api/app/documents/agents/extract_outline.py`

---

## 0. 먼저 — 이 기능이 정말 Agent 경로인가

| 질문 | 예 | 배치 |
| --- | --- | --- |
| 파일 저장·조회·삭제·목록인가? | 업로드, 파일 제공, 아티팩트 이력 | 일반 유스케이스 (`develop_50_back_generator`) |
| 같은 입력에 항상 같은 결과인가? | PDF 렌더, 기하 측정, 텍스트 추출 | `packages/scaffold-engine` 또는 일반 유스케이스 |
| **모델을 호출하고, 폴백·재시도·승인 대기·재개·실행 추적이 필요한가?** | 아웃라인 추출, 세그먼트 스캔, 스캐폴드 생성 | **이 스킬** |
| 모델 호출 방법만 바꾸는가? | 새 공급자, 타임아웃, 폴백 정책 | `core/llm/` 어댑터 (이 스킬 §3) |
| 키 등록·연결 테스트·삭제인가? | Google API 키 설정 | `llm_settings/` 도메인 |

**모든 백엔드 기능을 Agent 로 만들지 마십시오.** 일반 CRUD 를 Agent Runtime 에 태우면
불필요한 실행 이력과 상태 전이만 쌓입니다.

---

## 📋 [Agent & LLM Development Checklist]

### 1. 층 분리 — 네 개를 섞지 않는다

| 층 | 도메인 종속? | 있어야 할 곳 |
| --- | --- | --- |
| **실행 제어** — Run 상태, 재시도, 승인 대기, 재개 | ❌ | `core/agent_runtime/` |
| **실행 수단** — 모델 선택, 호출, 타임아웃, 폴백 | ❌ | `core/llm/` |
| **관측** — trace, span, 원장 | ❌ | `core/llm/tracer.py`(트레이스) · `telemetry.py`(원장) |
| **업무 정의 + 프롬프트** — 무엇을 왜 묻는가 | ✅ | `<도메인>/agents/` · `<도메인>/prompts.py` 또는 엔진 |

- [ ] **프롬프트 0줄:** `core/` 안에 프롬프트 문자열이 없는가? (있으면 즉시 위반)
- [ ] **도메인 명사 0개:** `core/agent_runtime` 에 `OutlineAgent`, `scaffold_id` 같은 이름이 없는가?
- [ ] **엔진 역전:** `packages/scaffold-engine` 이 `app.*` 를 import 하지 않고, 주입받은
      `ModelExecutor` 만 쓰는가?

### 2. 실행 상태 계약 (6상태)

```text
queued → running → completed
                 ↘ failed
                 ↘ waiting_for_configuration   ← 실패가 아니라 보류
                 ↘ waiting_for_approval        ← 실패가 아니라 보류
```

- [ ] **보류와 실패를 구분했는가?** `waiting_*` 을 실패로 처리하면 사용자는 풀리지 않는
      재시도만 반복합니다.
- [ ] **이력이 정본인가?** 상태를 통째로 덮어쓰지 않고 `AgentRunEvent` 를 append 했는가?
      (`snapshot.json` 은 폴드 결과이며 잃어도 복원됩니다)
- [ ] **재개 가능한가?** `AgentRunInput`(유스케이스 이름 + 입력 스냅샷)을 저장하고,
      `service.py` 에서 `register_use_case()` 로 등록했는가?
      **클로저는 프로세스와 함께 사라집니다 — 등록하지 않으면 재개할 수 없습니다.**
- [ ] **고아를 만들지 않았는가?** 새 실행 경로가 부팅 시 `sweep_orphans()` 에 걸리는가?
      걸리지 않으면 프로세스가 죽었을 때 영원히 "분석 중"으로 남습니다.
- [ ] **승인이 프로세스 밖에 있는가?** 대기 토큰을 `data/agreements/` 에 남겼는가?
      메모리에 두면 재시작에 사라지고 "승인했는데 아무 일도 없는" 상태가 됩니다.

### 3. 실패 정규화와 정책

- [ ] **공통 코드로 매핑했는가?** 공급자 원문 오류를 `core/llm/fallback.py` 가
      `QUOTA_EXHAUSTED` / `AUTH_EXPIRED` / `PROVIDER_TIMEOUT` / `PROVIDER_UNAVAILABLE` /
      `FALLBACK_NOT_CONFIGURED` 로 정규화하는가?
- [ ] **판정이 한 곳인가?** 재시도 가능 여부는 `core/agent_runtime/policy.py` **한 곳**에만
      있는가? 두 곳에 있으면 UI 와 서버가 어긋납니다.
- [ ] **새 코드를 등록했는가?** 목록에 없는 실패 코드는 정책에서 "재시도 불가"로 떨어집니다.
      [`construct/rule.md` §5.2](../../rules/50-develop/construct/rule.md) 에 추가했는가?
- [ ] **실패를 숨기지 않았는가?** 폴백 문서를 정상 결과로 돌려주지 않고, 응답 스키마에
      실패가 드러나는가?

### 4. 산출물 등급 — LLM 결과는 캐시가 아니다

> 같은 입력으로 다시 돌려도 바이트가 같지 않고 **비용이 듭니다.** 정의상 캐시가 아닙니다.

- [ ] **`data/` 에 커밋했는가?** LLM 산출물을 `cache/` 에 두지 않았는가?
- [ ] **provenance 를 동봉했는가?** `run_id` · `trace_id` · `model` · `prompt_hash` ·
      `engine_version` · `cost` 가 산출물과 함께 남는가? 없으면 모델을 바꿨을 때
      품질 변화의 원인을 특정할 수 없습니다.
- [ ] **불변인가?** 재분석 시 덮어쓰지 않고 새 `artifact_id` 를 쌓은 뒤 `HEAD.json` 만 옮겼는가?
- [ ] **실패를 커밋하지 않았는가?** 폴백 결과를 채택본으로 두면 다음 요청이 정상으로 오인합니다.
- [ ] **엔진이 경로를 정하지 않는가?** 파이프라인이 만들 파생물의 위치를 호스트가 주입했는가?
      (`OutlinePipeline(context_dir=...)`) 엔진 기본값은 "아무 데도 쓰지 않는다" 입니다.

### 5. 관측 두 갈래

| | 위치 | 보존 |
| --- | --- | --- |
| **원장** — 모델·토큰·비용·실패코드 | `data/ledger/{YYYY-MM}.jsonl` | 영구 |
| **트레이스** — 프롬프트·응답 본문 | `state/log/traces/{date}/` | 14일 |

- [ ] **원장에 기록했는가?** 비용·쿼터 판정의 근거는 원장입니다. `provider-state.json` 은
      그 파생일 뿐입니다.
- [ ] **`doc_id` / `run_id` 를 태깅했는가?** 문서 삭제가 트레이스까지 연쇄되려면 필요합니다.
      프롬프트에 문서 본문이 실리므로 지운 문서의 내용이 남으면 안 됩니다.
- [ ] **앱이 스스로 로그를 회전시키지 않는가?** 보존정책이 부팅 시 일괄 정리합니다.

### 6. 조립과 경계

- [ ] **컨테이너에서만 조립했는가?** 공급자·저장소·에이전트의 구현체 선택이
      `bootstrap/container.py` 에만 있는가? 모듈 전역 싱글턴을 만들지 않았는가?
- [ ] **포트로 받았는가?** 유스케이스가 구체 클래스가 아닌 `Protocol` 에 의존하는가?
- [ ] **`app.core.config` 를 import 하지 않았는가?** 유스케이스·서비스·에이전트에서
      직접 import 하면 `import-linter` 계약이 막습니다. 경로는 어댑터가 주입받습니다.
- [ ] **키가 안전한가?** API 키 원문이 OS 자격증명 저장소 밖(JSON·로그·trace·localStorage)에
      나가지 않는가?

### 7. 무결성 검증 (완료 게이트)

- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm --filter @vibe/api test` 를
      **실제로 실행**해 통과를 확인했는가? (`lint` 가 `ruff` 와 `import-linter` 계약 6건을 포함)
- [ ] 앱 임포트 확인(`python -c "import main"`)과 **변경한 엔드포인트 실호출**을 했는가?
- [ ] 성공 / 실패 / 설정 필요 / 재개 네 경우의 테스트가 있는가?
- [ ] 저장 레이아웃을 바꿨다면 `pnpm -F @vibe/api migrate:status` 로 확인하고
      `migrations/` 단계를 추가했는가?

---

## 🤖 에이전트 행동 지침 (Agent Prompt)

이 스킬이 활성화되면, 에이전트는 코드 작성을 마친 후 다음과 같이 대답해야 합니다.

> "지시하신 Agent/LLM 구현을 완료했습니다. `develop_50_back_llm_generator` 체크리스트 점검 결과:
> 0. Agent 경로 판정 (해당/비해당 근거)
> 1. 층 분리 (통과/위반 사유)
> 2. 실행 상태 계약 (통과/위반 사유)
> 3. 실패 정규화·정책 (통과/위반 사유)
> 4. 산출물 등급·provenance (통과/위반 사유)
> 5. 관측 두 갈래 (통과/위반 사유)
> 6. 조립과 경계 (통과/위반 사유)
> 7. 무결성 검증 (실행한 명령과 결과)"
