# [Audit] 테스트 스위트 기준선 감사

- **감사 일자**: `2026-09-14`
- **상태**: `✅ 완료`
- **대상**: `apps/api/tests`, `packages/*/tests`, `turbo.json`, `pyproject.toml`
- **기준 커밋**: `8550301 fix-runtime-work` + 미커밋 작업분
- **재현 명령**: [`artifacts/commands.md`](./artifacts/commands.md)
- **후속 문서**: [`../../migration/README.md`](../../migration/README.md)

> 이 카드는 **시점 고정 기록**이다. 수치는 이 날짜의 사실이며, 이후 갱신하지 않는다.
> 재감사가 필요하면 새 날짜 폴더에 새 카드를 쓰고, 이 카드는 이행 전후 대조용으로 남긴다.

---

## 1. 측정 방법

측정은 전부 아래 세 명령으로 얻었다. 추정치는 없다.

```bash
# 규모
find apps/api/tests -name "*.py" | xargs wc -l
grep -c "^def test_\|^async def test_" apps/api/tests/*.py

# 실행 시간 · 느린 테스트
cd apps/api && venv/Scripts/python.exe -m pytest tests -q --durations=25

# 앱 임포트 비용
cd apps/api && venv/Scripts/python.exe -X importtime -c "import main" 2>&1 | tail -1
```

전체 명령과 원시 출력은 [`artifacts/commands.md`](./artifacts/commands.md) 에 있다.

---

## 2. 규모

| 항목 | 값 |
| --- | --- |
| 테스트 파일 | 26 (`apps/api/tests/test_*.py`) + 1 (`conftest.py`) + 5 (`packages/*/tests`) |
| 테스트 수 | **131** (api) + **14** (packages) = 145 |
| 테스트 코드 | 3,977줄 — 앱 코드 9,099줄의 **44%** |
| 전체 실행 (api) | **10.1초** (수집 1.37초 포함) |
| 전체 실행 (packages) | 0.61초 |
| 최장 단일 테스트 | **0.40초** (`test_generated_types_match_contracts`) |
| `import main` | **1.59초** — 수집 시간의 대부분 |

### 파일별 테스트 수 (상위 10)

| 파일 | 테스트 수 |
| --- | ---: |
| `test_inspector.py` | 18 |
| `test_observability_contract.py` | 16 |
| `test_run_recovery.py` | 11 |
| `test_bootstrap.py` | 7 |
| `test_payload_externalization.py` | 7 |
| `test_storage_lifecycle.py` | 6 |
| `test_scaffold_observability.py` | 6 |
| `test_llm_runtime_policy.py` | 6 |
| `test_provider_state.py` | 5 |
| `test_provenance.py` | 5 |

---

## 3. 낭비가 **아닌** 것 — 먼저 배제한다

> `04.measurement` 의 원칙: **배제된 가설이 핵심 자산이다.**

| 가설 | 검증 | 판정 |
| --- | --- | :---: |
| 테스트 실행 시간이 병목이다 | 전체 10.1초, 최장 0.40초 | **❌ 배제** |
| 느린 테스트가 소수 있어 끌고 간다 | 상위 25개 합계가 4.5초 미만, 분포가 평평 | **❌ 배제** |
| 외부 API·LLM 을 실제로 호출한다 | 모든 외부 경계가 `monkeypatch` 로 차단됨 | **❌ 배제** |
| 병렬화(`pytest-xdist`)가 답이다 | 10초짜리를 쪼개는 비용이 이득보다 큼 | **❌ 배제** |

**이 배제가 중요한 이유**: 위 넷 중 하나라도 참이라고 착각하면 잘못된 최적화(병렬화, 테스트 삭제,
타임아웃 조정)에 시간을 쓰게 된다. 실제 원인은 전부 **관리 구조**에 있다.

---

## 4. 발견 — 문제 7건

### 4-1. 🔴 테스트가 어떤 게이트에도 없다

```text
turbo.json      tasks: build / typecheck / lint / dev        ← test 없음
package.json    scripts: dev / build / lint / typecheck      ← test 없음
.github/        없음                                          ← CI 없음
```

`apps/api/package.json` 에만 `test` 스크립트가 있다.
**`turbo.json` 에 `test` 태스크가 정의되어 있지 않아 `turbo run test` 로 실행할 수 없다.**

`AGENTS.md` 의 완료 기준(`pnpm lint && pnpm typecheck && pnpm build`)에도 테스트가 빠져 있다.

> **결과**: 언제 돌릴지가 사람의 판단에 달려 있고, 부분 실행 수단이 없어 **매번 전체**를 돌린다.
> 체감되는 낭비의 정체가 이것이다 — 10초가 비싼 게 아니라 선택지가 전체뿐인 것.

> 참고: `.agents/skills/develop_50_back_generator/SKILL.md` 의 완료 게이트는 이미
> `pnpm --filter @vibe/api test` 를 요구한다. **규칙은 있는데 게이트에 반영되지 않았고
> `packages/*` 는 빠져 있다.**

### 4-2. 🔴 `packages/*` 테스트는 고아다

| 패키지 | 테스트 | 상태 |
| --- | ---: | --- |
| `scaffold-engine` | 11 | 통과. 자동 실행 안 됨 |
| `agent-core` | 3 | 통과. 자동 실행 안 됨 |

`package.json` 에 `test` 스크립트가 없고 `pyproject.toml` 에 pytest 설정도 없다.
경로를 손으로 지정해야만 돈다. **정본이 패키지인 엔진의 테스트가 방치된 구조다.**

### 4-3. 🟠 pytest 설정이 아예 없다

저장소 어디에도 `[tool.pytest.ini_options]` 가 없다.

| 없는 것 | 결과 |
| --- | --- |
| `testpaths` | 경로를 매번 손으로 지정 |
| **`markers`** | 빠른 일부만 돌릴 방법이 없음 → **4-1 의 직접 원인** |
| `addopts` | 옵션을 매번 손으로 |
| `filterwarnings` | 경고가 계속 쌓임 |

비동기 스타일도 둘이 섞여 있다: `@pytest.mark.anyio` (2파일) vs `asyncio.run()` (2파일).

### 4-4. 🟠 아키텍처 규칙이 이중 구현이다

| 규칙 | import-linter | pytest |
| --- | --- | --- |
| packages 는 app 을 import 하지 않는다 | ✅ 계약 | ✅ `test_adapters.py:65` (AST 순회) |
| 도메인 내부를 직접 import 하지 않는다 | ✅ 계약 7건 | ✅ `test_adapters.py:82` (AST 순회) |

pytest 쪽은 `domains = {"documents", "outline", "wireframe", "workspaces"}` 로 도메인을
하드코딩하고 있어 **이미 낡았다** (`inspector`, `runtime`, `llm_settings` 누락).
같은 날 `import-linter` 계약에서는 열거 방식을 없앴는데, 여기에 그대로 남아 있다.

### 4-5. 🟠 파일이 '대상'이 아니라 '사건'별로 쌓여 있다

관측 하나를 검증하는 테스트가 **5개 파일에 49개(전체의 37%)** 흩어져 있다.

```text
test_inspector.py               18   조회 + 소스 + 워크플로우 + 계측 저장
test_observability_contract.py  16   어휘 + 사용량 변환 + 생성 타입 + 문서 존재 + 마이그레이션
test_payload_externalization.py  7   외부화 + 엔드포인트
test_scaffold_observability.py   6   엔진 파이프라인 + 스팬
test_outline_observability.py    2   엔진 파이프라인 + 스팬
```

각 파일은 과거의 사고 하나를 기념한다. **주석에 남은 사고 기록은 이 저장소의 자산이고
없애면 안 된다.** 문제는 배치 기준이 없어서 같은 대상을 건드릴 때 어느 파일을 봐야 하는지
알 수 없다는 것이다. 실제로 이날 인스펙터를 리팩터링하자 4개 파일이 동시에 깨졌다.

또 `test_scaffold_multipage.py`, `test_outline_observability.py` 는
**`packages/scaffold-engine` 파이프라인을 검증하는데 `apps/api` 에 산다.**

### 4-6. 🔴 전역 `TestClient` 가 lifespan 미실행 상태를 검증한다

```python
# test_inspector.py, test_observability_contract.py,
# test_payload_externalization.py, test_scaffold_observability.py
client = TestClient(app)      # 모듈 최상단, with 없음
```

`with` 없이 만든 `TestClient` 는 **lifespan 을 실행하지 않는다.** 이 4개 모듈의 테스트는
재개 핸들러 등록도, 정책 복원도, 고아 정리도 일어나지 않은 앱을 상대로 돈다 —
**프로덕션에 존재하지 않는 상태다.**

같은 날 발견된 부팅 순서 버그(새 설치가 `StorageVersionError` 로 거부됨)가 테스트에
잡히지 않은 이유다. 상세: [`../../examples/90.antipattern-global-client.md`](../../examples/90.antipattern-global-client.md)

### 4-7. 🟡 픽스처가 중복이다

| 중복 | 위치 |
| --- | --- |
| `StorageRoots(tmp_path)` 직접 조립 | 4개 파일이 각자 |
| 가짜 대역 클래스 | 13개가 7개 파일에 흩어짐 (`FakeHarness`, `_StubHarness`, `_CredentialStore`, …) |
| 외부 차단 지점 | 파일마다 다른 지점에서 `monkeypatch` |

공용 픽스처는 사실상 `observability_runs` 하나뿐이다.

---

## 5. 보존해야 할 자산

이 감사의 결론은 **"테스트를 줄이자"가 아니다.**

| 자산 | 왜 지켜야 하나 |
| --- | --- |
| **사고 기록 주석** | "왜 이 테스트가 있는가"의 유일한 답. 지우면 다음 사람이 같은 버그를 다시 만든다 |
| **실제 산출물 픽스처** | `fixtures/observability/` 는 손으로 지은 샘플이 아니라 진짜 생산자가 쓴 파일이다 |
| **계약 테스트** | 어휘·스키마 테스트는 등급만 정리하면 그대로 유효하다 |

---

## 6. 이날 이미 고친 것

| 항목 | 이전 | 이후 |
| --- | --- | --- |
| 테스트 저장소 격리 | 개발 PC 의 실제 `apps/api/data/` 에 기록 | `apps/api/.pytest_tmp/storage-<pid>/` |
| 순서 의존 실패 | run 66건 누적 시 픽스처가 목록 상한(50)에 밀려 관측 테스트 다수 실패 | 해소 |

상세: [`../../examples/92.antipattern-real-data.md`](../../examples/92.antipattern-real-data.md)

---

## 7. 결론

실행 시간이 아니라 **관리 구조**가 비용이다. 이행은 `turbo`/`pytest` 설정 신설(T0)부터
시작하는 것이 옳다 — **테스트 코드를 한 줄도 고치지 않고** 4-1·4-3 이 해소되기 때문이다.

→ [`../../migration/README.md`](../../migration/README.md)
