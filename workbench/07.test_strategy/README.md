# [07.test_strategy] 테스트 전략 및 관리 체계

> **이 작업대가 답하는 질문**: 테스트를 **어디에 두고, 언제 돌리고, 무엇을 쓰지 않을 것인가.**

---

## 1. 한 줄 요약

**테스트를 '사건'이 아니라 '경계'로 관리한다.**

이 저장소는 이미 경계가 코드로 강제되는 구조다 (헥사고날 + `import-linter` 계약 11건).
테스트도 같은 경계를 따르면 "어디에 둘지"와 "언제 돌릴지"가 **판단 없이** 결정된다.

---

## 2. 배경 — 무엇이 문제였나

2026-09-14 감사 결과, 테스트 스위트는 **131개 / 10.1초**다. **실행 시간은 문제가 아니다.**
가장 느린 테스트가 0.40초이고, 전체를 돌려도 10초다.

문제는 다른 곳에 있었다.

| # | 문제 | 결과 |
| :---: | --- | --- |
| 1 | `turbo.json` 에 `test` 태스크가 없음 | 실행 선택지가 **"전체" 하나뿐** |
| 2 | `packages/*` 테스트 14개가 고아 | 엔진 정본의 테스트가 방치 |
| 3 | `[tool.pytest.ini_options]` 부재 | 마커가 없어 부분 실행 불가 |
| 4 | 아키텍처 규칙이 lint·pytest 이중 구현 | 규칙 하나에 수정 두 곳, 이미 낡음 |
| 5 | 파일이 사건별 축적 (관측 49/131이 5파일에 분산) | 하나 고치면 네 파일이 깨짐 |
| 6 | 전역 `TestClient(app)` 4개 모듈 | **lifespan 미실행 상태**를 검증 |
| 7 | 픽스처 중복 | 같은 준비를 파일마다 다시 씀 |

근거와 측정 방법: [`audit/2026-09-14/audit_test_suite_baseline.md`](./audit/2026-09-14/audit_test_suite_baseline.md)

---

## 3. 두 축 — 정본과 기록을 섞지 않는다

이 저장소는 이미 두 방식을 쓰고 있다. 이 작업대도 같은 구분을 따른다.

| 축 | 위치 | 정체성 | 형상 관리 |
| --- | --- | --- | --- |
| ◆ **정본** | `spec/` | "지금 유효한 규칙" | git + 문서 헤더(상태·개정일) |
| ◇ **기록** | `audit/YYYY-MM-DD/` | "그때 잰 사실" | **날짜 폴더 = 불변** |
| ▣ **전이** | `migration/` | "무엇이 어긋났고 어떤 순서로 되돌리나" | 진행 상태표 |

> 원칙·등급 사양을 날짜 폴더에 넣으면 *"그래서 지금 유효한 규칙이 어느 폴더냐"* 를 알 수 없게 된다.
> 반대로 현황 감사를 정본에 두면 **낡은 수치가 규칙인 척** 하게 된다.

---

## 4. 문서 인덱스

### ◆ `spec/` — 정본

| 문서 | 내용 |
| --- | --- |
| [`01.principles.md`](./spec/01.principles.md) | 관리 대원칙 7가지 |
| [`02.tiers/`](./spec/02.tiers/README.md) | **등급 사양 L0~L3** · 판정 결정 표 |
| [`03.layout.md`](./spec/03.layout.md) | 소유권 · 파일 명명 · conftest 계층 |
| [`04.execution/`](./spec/04.execution/README.md) | 실행 경로 · turbo · pytest 설정 · 게이트 |
| [`05.fixtures/`](./spec/05.fixtures/README.md) | 공용 픽스처 · 대역 정책 · 외부 차단 지점 |

### ★ `templates/` — 복사해서 쓰는 실물

| 파일 | 용도 |
| --- | --- |
| [`conftest.workspace.py`](./templates/conftest.workspace.py) | 저장소 격리 + 공용 픽스처 3종 |
| [`test_L1_contract.py`](./templates/test_L1_contract.py) | 계약 테스트 골격 |
| [`test_L2_unit.py`](./templates/test_L2_unit.py) | 어댑터 · 유스케이스 골격 |
| [`test_L3_wiring.py`](./templates/test_L3_wiring.py) | 배선 테스트 골격 |
| [`pytest.ini_options.toml`](./templates/pytest.ini_options.toml) | pyproject 에 붙일 설정 블록 |
| [`turbo.test-task.json`](./templates/turbo.test-task.json) | `turbo.json` 조각 |
| [`package.test-script.json`](./templates/package.test-script.json) | 워크스페이스 스크립트 조각 |
| [`regression-header.md`](./templates/regression-header.md) | **사고 기록 주석 형식** |

### ★ `examples/` — 이 저장소의 실제 사례

정상 사례 4개와 **반례 3개**. 반례는 전부 2026-09-14 에 실제로 일어난 일이다.

| 문서 | 무엇을 보여주는가 |
| --- | --- |
| [`01.L1-usage-vocabulary.md`](./examples/01.L1-usage-vocabulary.md) | 어휘 변환 계약을 앱 없이 지키는 법 |
| [`02.L2-run-observation-store.md`](./examples/02.L2-run-observation-store.md) | 저장소 어댑터 + 경로 탈출 방어 |
| [`03.L3-resume-flow.md`](./examples/03.L3-resume-flow.md) | 승인 → 재개 배선 |
| [`04.L0-ast-to-contract.md`](./examples/04.L0-ast-to-contract.md) | AST 검사 → import-linter 이관 (before/after) |
| [`90.antipattern-global-client.md`](./examples/90.antipattern-global-client.md) | 전역 `TestClient` 가 놓친 부팅 순서 버그 |
| [`91.antipattern-none-collaborators.md`](./examples/91.antipattern-none-collaborators.md) | `agent_runtime=None` 조합이 놓친 것 |
| [`92.antipattern-real-data.md`](./examples/92.antipattern-real-data.md) | 실제 `data/` 오염이 만든 순서 의존 실패 |

### ▣ `migration/` — 이행

[`migration/README.md`](./migration/README.md) 에 진행 상태표와 열린 결정이 있다.
T0 → T4 순서로 진행하며, **T0 은 테스트 코드를 한 줄도 건드리지 않는다.**

---

## 5. 읽는 순서

| 목적 | 읽을 것 |
| --- | --- |
| 처음 접한다 | `spec/01.principles.md` → `spec/02.tiers/README.md` |
| **테스트를 쓰려 한다** | `spec/02.tiers/README.md` 의 결정 표 → 해당 등급 문서 → `templates/` |
| 이행 작업을 한다 | `migration/README.md` → 해당 단계 문서 |
| 현황이 왜 이런지 궁금하다 | `audit/2026-09-14/` |
| 같은 실수를 피하고 싶다 | `examples/90~92` (반례) |

---

## 6. 정본 관계

이 작업대는 **사양과 근거**다. 강제 수단은 코드에 있다.

| 무엇 | 강제 수단 |
| --- | --- |
| 아키텍처 경계 | [`.agents/rules/00-core/rule.md`](../../.agents/rules/00-core/rule.md) + `apps/api/pyproject.toml` 의 `import-linter` 계약 |
| 데이터 수명주기 등급 | [`.agents/rules/60-data/rule.md`](../../.agents/rules/60-data/rule.md) |
| 테스트 등급·실행 | `apps/api/pyproject.toml` 의 `[tool.pytest.ini_options]` + `turbo.json` (**T0 에서 신설**) |

> 사양과 구현이 어긋나면 **구현을 고친다.** 사양을 바꿔야 한다고 판단되면 `spec/` 를 먼저
> 개정하고 `migration/` 에 근거를 남긴다.

> **범위 note (2026-09-14):** 이 작업대는 workbench 문서만 다룬다.
> `.agents/rules/` 정본 승격과 `.agents/skills/` 생성기 반영은 **아직 하지 않았다.**
> 관련 논의는 [`migration/README.md`](./migration/README.md) §열린 결정 에 있다.
