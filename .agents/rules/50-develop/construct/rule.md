---
description: "F-02 Agent Runtime·다중 LLM 구조를 안전하게 단계 이행하는 구현 가이드"
applies_to: "apps/api/**, apps/web/**, packages/scaffold-engine/**"
---

# Construct — Agent Runtime 및 복원력 있는 LLM 구현 가이드

> 이 문서는 장기 설계를 실제 코드로 옮길 때의 작업 순서와 경계를 정의한다.
> 최우선 정본은 `00-core/rule.md`다. 충돌 시 헌법을 따르며, 이 문서는
> F-02의 모든 항목을 한 번에 구현하라고 요구하지 않는다.

## 1. 시작 전 읽을 문서

새 Agent, LLM 공급자, 분석 결과 계약, 자격증명 설정을 구현하기 전 아래를 순서대로 읽는다.

1. `.agents/rules/00-core/rule.md`
2. `.agents/rules/10-architecture/agent-runtime.md`
3. `.agents/rules/60-data/rule.md` — 산출물·실행 상태·원장을 어디에 둘지의 정본
4. `workbench/01.requirements_analysis/features/F-02-agent-runtime-and-resilient-llm-execution.md`
5. 해당 원자 기능 카드(`workbench/01.requirements_analysis/atomic-features/`)
6. 해당 기술 후보 문서(`workbench/02.tech_specs_candidates/`)

구현 전 후보가 확정되지 않았거나 요구사항이 모호하면 코드를 추정하지 않는다. 먼저
Workbench의 후보 문서와 요구사항 카드를 갱신하고 결정을 요청한다.

## 2. 기능 분류 결정표

모든 백엔드 기능을 Agent로 만들지 않는다. 구현 대상이 아래 어디에 속하는지 먼저 결정한다.

| 질문 | 예 | 배치 |
| --- | --- | --- |
| 파일 저장·조회·검증·캐시인가? | 업로드, 파일 제공, 아카이브 조회 | `<domain>/service.py` 또는 `<domain>/use_cases/` |
| 단일 호출 후 즉시 끝나는 결정적 처리인가? | PDF 기하 측정, 변환 | `packages/scaffold-engine` 또는 도메인 Use Case |
| 모델 폴백·재시도·승인 대기·재개·실행 추적이 필요한가? | 아웃라인 추출, 스캐폴드 생성 | `<domain>/agents/` + `core/agent_runtime/` |
| 모델 호출 방법만 바꾸는가? | CLI, Google API, 타임아웃 | `core/llm/` 어댑터 |
| 키 등록·연결 테스트·삭제인가? | Google API 키 설정 | `llm_settings/` 도메인 |
| 문서 분석 알고리즘·프롬프트·검증인가? | OutlinePipeline, 슬롯 판정 | `packages/scaffold-engine` |

## 3. 정적 의존 방향

```text
bootstrap → <domain> → core → packages/scaffold-engine
```

- `packages/*`는 절대로 `apps/*`를 import하지 않는다.
- 앱은 패키지의 `__init__.py` Public API만 import한다.
- `core/`는 도메인 이름, 도메인 프롬프트, 도메인 저장 형식을 모른다.
- 도메인 Agent는 자기 도메인 안에 둔다. `core/agent_runtime`에는
  `OutlineAgent`, `ScaffoldAgent` 같은 이름을 만들지 않는다.
- 구현체 선택, 공급자 우선순위, 실제 자격증명 저장소는
  `bootstrap/container.py`에서만 조립한다.

## 4. 목표 호출 흐름

```text
Web UI
  → domain router
  → domain use case/service
  → domain agent (필요한 경우만)
  → core agent runtime
  → scaffold-engine Public API
  → 주입된 ModelExecutor
  → core/llm CLI 또는 Google API adapter
  → Outcome 반환
  → domain result
  → HTTP response
  → UI 상태·안내·재시도 행동
```

패키지가 주입받은 `ModelExecutor`를 호출하는 것은 허용된다. 이는 패키지가 앱을
import하는 것이 아니라 앱이 제공한 계약 구현체를 사용하는 의존성 역전이다.

## 5. 결과와 오류 계약

### 5.1 Outcome 우선

AI 실행은 예외 문자열이나 느슨한 telemetry dict만으로 성공·실패를 표현하지 않는다.
도메인은 최소한 아래 의미를 보존한다.

```text
# Run 상태 (core/agent_runtime.models.RunStatus)
status: queued | running | completed | failed
      | waiting_for_configuration | waiting_for_approval

# 도메인 응답의 실패 정보
error.code
error.retryable
error.retryAfter (가능한 경우)
error.traceId
error.requiresAction (가능한 경우)
```

- `waiting_*` 은 **실패가 아니라 보류**다. 사람이 설정·동의를 마쳐야 풀린다.
  프런트가 이 둘을 실패로 그리면 사용자는 풀리지 않는 재시도만 반복한다.
- 폴링은 "종료"가 아니라 **"더 이상 저절로 바뀌지 않는 상태"** 에서 멈춘다
  (`shared/api` 의 `isSettled`). `waiting_*` 에서 계속 물어보면 요청만 쌓인다.

- CLI/API 원문 오류는 `core/llm`이 공통 실패 코드로 정규화한다.
- 도메인은 그 실패를 문서 분석·스캐폴드 생성 같은 제품 결과로 번역한다.
- router만 HTTP 상태 코드로 번역한다.
- 프런트 훅은 HTTP 200만으로 성공을 판단하지 않고 `status`를 검사한다.
- 실패한 결과를 캐시하거나 성공 산출물로 저장하지 않는다.

### 5.2 권장 오류 코드

**공급자 실패** — `core/llm/fallback.py` 가 정규화한다.

```text
QUOTA_EXHAUSTED          한도 소진. 재시도해도 회복 전에는 같은 결과
AUTH_EXPIRED             인증 만료
PROVIDER_TIMEOUT         응답 없음 (재시도 가능)
PROVIDER_UNAVAILABLE     그 외 일시적 불가
FALLBACK_NOT_CONFIGURED  1차 실패 + 폴백 미설정
```

**실행 실패** — `core/agent_runtime` 이 붙인다.

```text
AGENT_EXECUTION_FAILED   실행 중 예외
AGENT_RUN_INTERRUPTED    프로세스가 죽어 끊김. 재개 대상
```

**도메인 실패** — 각 도메인이 정의한다.

```text
ANALYSIS_FAILED          분석 미완료 (일반)
SEGMENT_SCAN_EMPTY       세그먼트를 하나도 못 뽑음
```

- 새 코드가 위 목록에 없는 코드를 만들면 **이 절에 추가한다.** 목록에 없는 코드는
  `core/agent_runtime/policy.py` 의 재시도 판정에서 "재시도 불가"로 떨어진다.
- 재시도 가능 여부의 판정은 `policy.py` **한 곳**에만 둔다. 두 곳에 있으면
  UI 는 재시도 버튼을 띄우고 서버는 같은 실패를 반복한다.

공급자 이름, 키 원문, 프롬프트 전문은 사용자 오류 메시지에 노출하지 않는다.

## 6. 새 Agent Use Case 추가 절차

1. F-02 원자 카드에 사용자 가치·입력·산출물·실패 상태를 명시한다.
2. `<domain>/ports.py`에 필요한 외부 의존 계약을 추가한다.
3. `<domain>/agents/`에 도메인 Agent를 정의한다.
4. `core/agent_runtime`의 일반 Run·승인·재시도 계약을 사용한다.
5. `<domain>/use_cases/`에 Agent를 호출하고 결과를 도메인 결과로 번역하는 Use Case를 둔다.
6. 기존 `service.py`는 한 유스케이스씩 새 Use Case에 위임하도록 얇게 만든다.
7. router는 요청·응답 변환만 하고, DI 컨테이너가 실제 구현체를 주입한다.
8. 성공, 실패, 설정 필요, 재시도 불가의 테스트를 각각 추가한다.

기존 기능을 한 번에 이동하거나, router가 Agent·파일 저장소·공급자 구현체를 직접
생성해서는 안 된다.

## 7. 새 LLM 공급자 또는 폴백 추가 절차

1. `core/llm`의 실행 포트를 구현하는 어댑터를 만든다.
2. 공급자 원문 오류를 §5.2의 공통 코드로 매핑한다.
3. 키가 필요한 공급자는 `llm_settings` 도메인의 `CredentialStore` 포트를 사용한다.
4. 키 원문은 OS 자격증명 저장소에만 쓴다. workspace, JSON, 로그, trace,
   브라우저 localStorage에는 쓰지 않는다.
5. 폴백 허용 오류·최대 시도 횟수·비용/승인 정책을 명시한다.
6. `bootstrap/container.py`에서 공급자와 라우팅 정책을 조립한다.
7. 하나의 runId/traceId 아래에 1차·폴백 시도를 모두 기록한다.

폴백은 잘못된 입력, 정책 차단, 스키마 설계 오류를 숨기는 수단으로 쓰지 않는다.

## 8. 프런트 구현 규칙

- 공급자 설정의 재사용 상태는 `entities/llm-configuration/`에 둔다.
- 키 등록·테스트·삭제라는 사용자의 단일 행동은 `features/llm-settings/`에 둔다.
- 문서 분석의 **상태만** 노드 데이터에 보존한다
  (`outlineStatus`, `outlineError`, `outlineTraceId`, `outlineRunId`, `lastSuccessfulOutlineAt`).
- ⛔ **분석 결과 본문은 노드에 저장하지 않는다.** `outlines` / `elements` / `segments` /
  `htmlContent` 의 정본은 백엔드 아티팩트 저장소다. 노드는 `docId` 포인터만 갖고, 카드가 열릴 때
  채택본을 읽어 온다(`GET /documents/{docId}/outline` — LLM 미개입).
  사본을 남기면 재분석 시 노드·세션·저장소가 갈라진다.
  정본: [`60-data/rule.md`](../../60-data/rule.md) §4-1 · 사례: [V-11](../../00-core/examples/violation-catalog.md)
- 기존 성공 결과가 있을 때 재분석이 실패하면, 기존 결과와 최신 실패를 구분해 표시한다.
  그래서 `lastSuccessfulOutlineAt` 과 `outlineError` 를 **따로** 보존한다.
- UI는 원인, 영향, 다음 행동, 분석 ID(traceId)를 제공한다.
- API 키 원문이나 원시 공급자 오류를 React 상태·콘솔·저장소에 남기지 않는다.

## 9. 패키지 엔진 이행 규칙

`scaffold-engine`은 재사용 가능한 문서 분석 파이프라인을 소유한다.

- 프롬프트와 분석 스키마는 엔진이 실행하는 경우 엔진이 소유한다.
- FastAPI, React, 작업공간, OS 자격증명, HTTP 상태 코드는 패키지에 넣지 않는다.
- 모델 실행 계약은 패키지의 Public API에 두고, core LLM 구현체를 주입받는다.
- 기존 `BaseLlmHarness`를 바꿀 때는 호환 어댑터를 먼저 제공하고 호출자를 단계적으로 이관한다.
- 파이프라인 불변식은 패키지 README 또는 진입 모듈 docstring에 갱신한다.

## 10. 점진 이행 순서

| 순서 | 변경 단위 | 완료 기준 | 상태 |
| --- | --- | --- | --- |
| 1 | 분석 실패 계약 | 실패가 UI에서 명확히 보이고 traceId가 연결됨 | ✅ |
| 2 | core LLM 실패 정규화 | trace와 모든 span의 상태가 일치함 | ✅ |
| 3 | 문서 Use Case 분리 | 기존 서비스의 한 기능이 포트·테스트와 함께 이관됨 | ✅ 7개 전부 |
| 4 | Google API 설정 | 키가 보안 저장소에만 있고 연결 테스트 가능 | ✅ |
| 5 | CLI→API 폴백 | 허용된 실패에서만 한 번 폴백되고 실행 경로가 표시됨 | ✅ |
| 6 | Agent Run·승인 재개 | 설정/승인 뒤 같은 runId로 재개 가능 | ✅ |
| 7 | 엔진 ModelExecutor 역전 | 패키지가 앱 구현체를 import하지 않음 | ✅ |
| 8 | 데이터 수명주기 분리 | `cache/`·`state/` 를 지워도 앱이 동작하고 `data/` 가 남음 | ✅ |

한 Pull Request 또는 한 작업 턴은 위 표의 한 변경 단위를 넘지 않는 것을 기본으로 한다.
**표가 모두 ✅ 라도 이 문서는 유효하다** — 새 Agent·공급자·유스케이스를 추가할 때의
절차(§6, §7)가 여전히 정본이다.

## 11. 완료 체크리스트

- [ ] 해당 요구사항 카드와 기술 후보를 읽고 영향 범위를 확인했다.
- [ ] 코드 위치가 §2와 의존 방향 §3을 따른다.
- [ ] 구현체 선택과 **저장 등급 루트 주입**은 bootstrap에만 있다.
- [ ] 성공·실패·설정 필요 상태의 테스트가 있다.
- [ ] 실패가 성공이나 빈 결과로 위장되지 않는다. 실패 결과를 아티팩트로 커밋하지 않았다.
- [ ] **산출물이 등급에 맞게 놓였다** — LLM 결과는 `data/` 에 provenance 동반,
      결정적 파생만 `cache/`. ([`60-data`](../../60-data/rule.md))
- [ ] **노드·세션에 파생 사본이 없다** — 포인터만 저장했다.
- [ ] 저장 레이아웃을 바꿨다면 `migrations/` 단계와 `STORAGE_VERSION` 을 함께 올렸다.
- [ ] traceId/runId가 로그, API, UI에서 연결된다.
- [ ] 키·민감 정보가 영속 데이터와 로그에 없다.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm --filter @vibe/api test`를 통과했다.
- [ ] 변경한 백엔드 엔드포인트를 실제 호출했다.
- [ ] 구현이 확정되면 요구사항 카드의 버전·상태를 갱신했다.

