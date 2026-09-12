---
name: develop_50_telemetry_generator
description: "사용자가 신규 파이프라인/워크플로우에 Telemetry(관측 계측)를 신규 설치하거나, 기존 워크플로우 리팩토링/구조 변경 시 Telemetry를 유지·수정하라고 요청할 때 발동합니다. StepCollector, source_of, 소문자 어휘, LlmInference 정체성, dotted_order 계층 구조, 호스트 영속화 연결 규격을 강제합니다."
---

# Pipeline Telemetry & Observability Generator

이 스킬은 사용자가 **파이프라인(AI·규칙·엔진)에 인스펙터 관측 계측(Telemetry)을 신규 장착**하거나,
**기존 워크플로우의 대대적인 구조 변경·리팩토링 시 Telemetry를 정합화·수정**하라고 지시할 때 발동합니다.

> ⛔ **선행 조건:** 이 체크리스트는 요약 점검표입니다. 충돌 시 아래 정본이 우선합니다.
> 1. [`.agents/rules/00-core/rule.md`](../../rules/00-core/rule.md) — 헌법
> 2. [`.agents/rules/60-data/observability.md`](../../rules/60-data/observability.md) — **관측 데이터 정본 (특히 §6 "새 워크플로우를 계측할 때")**
> 3. [`.agents/rules/60-data/rule.md`](../../rules/60-data/rule.md) — 데이터 수명주기 등급
> 4. [`workbench/06.agent_observability/06.abstraction_roadmap.md`](../../../workbench/06.agent_observability/06.abstraction_roadmap.md) — 추상화 아키텍처 로드맵
>
> 정본 참조 구현:
> - 다단계 엔진 파이프라인: `packages/scaffold-engine/scaffold_engine/outline/pipeline.py`
> - 규칙/판정 하이브리드 파이프라인: `packages/scaffold-engine/scaffold_engine/core/pipeline.py`

---

## 📋 [Pipeline Telemetry Checklist]

### 1. 파이프라인 진입부 초기화 (`StepCollector`)

- [ ] **수집기 선언:** 파이프라인 진입부에서 `StepCollector`를 선언했는가?
  ```python
  collector = StepCollector(
      pipeline_name="YourPipeline",            # 파이프라인 클래스/식별자
      domain="documents",                      # 도메인 패키지명 (소문자 복수형)
      workflow_name="documents.your_action",   # 고유 워크플로우 키 (카탈로그 ID)
      workflow_label="사용자가 읽을 한글 라벨",      # 화면 상단 노출 명칭
      target_name=display_name,                # 분석 대상 파일/문서 식별자
  )
  ```
- [ ] **기록 시점 라벨링:** 사람용 라벨(`workflow_label`, `display_label`)을 **기록 시점에** 파이프라인이 정했는가?
  (조회 서비스가 이름을 보고 추측하는 하드코딩 `if "outline" in name:` 금지)

---

### 2. 단계 정체성과 네이밍 (Step Identity)

- [ ] **이름에 모델명/동적 파라미터 금지:** 스팬 이름은 **단계의 영구적인 정체성**이다.
  `collector.step("LLM:gemini-3.8-flash")` ❌ → `collector.step("LlmInference")` ✅
  - 모델명이나 파라미터는 `display_label`, `sources`, `metadata`로 분리한다. 모델을 바꿔도 단계 통계와 시계열이 단절되지 않아야 한다.
- [ ] **어휘 소문자 통일:** 상태(`SpanStatus`)는 반드시 소문자(`success`, `failed`, `running`, `skipped`, `pending`)인가?
  대문자(`SUCCESS`, `FAILED`) 사용 금지.
- [ ] **폴백은 상태가 아니다:** `FALLBACK_TRIGGERED` 같은 임의 상태 금지. 시도 횟수(`len(attempts) > 1`)로 유도한다.

---

### 3. 코드 지점의 정적 바인딩 (`sources=[source_of(...)]`)

- [ ] **문자열 경로 리터럴 금지:** `data_via="path/to/file.py"` 같은 수기 문자열 금지.
- [ ] **객체 심볼 직접 바인딩:** 반드시 `source_of(클래스.메서드)` 심볼 자체를 넘겼는가?
  ```python
  sources=[
      source_of(MyProcessor.process),
      model_source(actual_model), # LLM 단계인 경우
  ]
  ```
  - 대상 함수/클래스를 Rename하거나 이동했을 때 정적 분석(`ruff`, `typecheck`)에서 즉시 잡혀야 한다.
  - 엔진은 호스트 파일시스템 경로를 모른다. `module`과 `qualname`만 넘기고 경로 해석은 호스트의 `service.py`가 한다.

---

### 4. 고밀도 인스펙터 UI 렌더링 품질 속성

단순 로깅을 넘어 인스펙터 대시보드에서 완벽한 가시성을 얻기 위해 다음 속성들을 주입했는가?

- [ ] **라벨 및 요약 알약 (`summary_pill`):**
  `s.set_label(summary_pill="블록 45개 실측 · 3개 표 감지", data_out="PageGeometry (45 blocks)")`
- [ ] **구조화된 입출력:** `s.set_inputs({...})` 및 `s.set_outputs({...})`에 딕셔너리로 제공했는가?
- [ ] **대용량 페이로드 고려:** 7MB 이상의 대용량 텍스트/응답은 백엔드 저장소(`payloads.py`)가 해시 포인터로 외부화하므로, `inputs`/`outputs`에는 정상적으로 온전한 데이터를 넘겨도 안전하다.
- [ ] **단계 스냅샷 (선택):** 프롬프트 역분해 조립, 컨텍스트 실측 등 파이프라인 중간 단계의 중요 산출물은 `s.snapshot(stage_id, stage_name, payload)`으로 워터폴 뷰에 영속화했는가?

---

### 5. LLM 추론 단계 전용 속성 바인딩

- [ ] **하네스 결과 부착:** 실제 모델 호출 후 `s.attach_harness_result(exec_res)`를 호출했는가?
  - `prompt_tokens`, `completion_tokens`, `reasoning_tokens`, `cache_read_tokens`, `duration_seconds`가 `SpanUsage` 규격으로 무손실 자동 매핑된다.
- [ ] **모르는 비용은 0.0이 아니라 None:** 계산된 단가가 없으면 `cost_usd`는 `None`이다. 공짜라고 거짓말하지 않는다.

---

### 6. 계층 구조 및 실행 순서 (`Dotted Order`)

- [ ] **트리 구조 중첩:** 하위 세부 단계가 필요할 경우 `with collector.step(...)`을 중첩하거나 부모를 지정했는가?
- [ ] **인덱스 추측 금지:** 단계 순서는 시간 순서에 따라 `dotted_order` (1, 1.1, 2)로 자동 관리되므로, 인위적인 번호 매기기를 하지 않는다.

---

### 7. 호스트(UseCase/Tracer) 영속화 연결

- [ ] **파이프라인 반환 규격:** 파이프라인 결과에 `collector.to_pipeline_telemetry()` 딕셔너리가 포함되는가?
- [ ] **원장과 실행 이력 분리:**
  - 실행 상태는 `data/runs/{run_id}/events.jsonl`에 남긴다.
  - 단계 상세는 `data/runs/{run_id}/ledger.jsonl`에 남긴다 (`tracer.record_pipeline_telemetry` 호출).
  - LLM 호출 비용은 `data/ledger/{YYYY-MM}.jsonl` 월별 원장에 반드시 기록한다.
- [ ] **프론트엔드 수정 0줄 원칙:** 백엔드 규격만 준수하면 `apps/inspector` 프론트엔드 코드는 1줄도 수정하지 않아도 자동으로 워크플로우 카탈로그와 타임라인에 등재된다.

---

### 8. 기존 워크플로우 리팩토링 시 점검 사항

- [ ] **함수 분리/이동 시:** `source_of(...)`의 대상 심볼을 새 클래스/함수로 갱신했는가?
- [ ] **단계 순서 변경 시:** 인스펙터는 실행 흐름을 그대로 그리므로, 비즈니스 로직 순서에 맞춰 `with collector.step(...)`의 배치만 조정하면 된다.
- [ ] **과거 런과의 호환성:** 마이그레이션 v4에 따라 과거 런 데이터(`data_via` 등)를 강제로 고칠 필요가 없으며, 신규 런부터 신형 규격(`sources`)으로 쌓이게 하면 된다.

---

### 9. 무결성 검증 (게이트)

- [ ] `pnpm lint` 통과 (Import Linter 계약 6건 유지 확인)
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm build` 통과
- [ ] `apps/api/venv/Scripts/python.exe -m pytest apps/api/tests/test_observability_contract.py --basetemp=.pytest-tmp` 통과
- [ ] 새로 추가/수정한 파이프라인의 텔레메트리 검증 테스트 통과

---

## 🤖 에이전트 행동 지침 (Agent Prompt)

이 스킬이 활성화되면, 에이전트는 코드 작성을 마친 후 다음과 같이 점검 결과를 보고해야 합니다.

> "지시하신 파이프라인 Telemetry 작업을 완료했습니다. `develop_50_telemetry_generator` 체크리스트 점검 결과:
> 1. StepCollector 식별자 및 기록 시점 라벨링 (통과/위반 사유)
> 2. 단계 정체성 네이밍 및 소문자 어휘 준수 (통과/위반 사유)
> 3. source_of 정적 심볼 바인딩 (통과/위반 사유)
> 4. 인스펙터 UI 품질 속성(summary_pill, 입출력, 스냅샷) (통과/위반 사유)
> 5. LLM 토큰/비용 규격 (통과/위반 사유)
> 6. Dotted Order 계층 구조 (통과/위반 사유)
> 7. 호스트 영속화 연결 (통과/위반 사유)
> 8. 리팩토링 호환성 점검 (해당 시 결과)
> 9. 무결성 검증 게이트 (실행한 명령과 결과)"
