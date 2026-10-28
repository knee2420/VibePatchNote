# [TEST-SPEC] 실행 경로와 예산

- **문서 ID**: `TEST-SPEC-EXECUTION`
- **상태**: `Active`
- **최종 개정**: 2026-09-14
- **근거 감사**: [`audit/2026-09-14/`](../../audit/2026-09-14/audit_test_suite_baseline.md) §4-1, §4-3

---

## 1. 경로 3개

| 명령 | 무엇이 도는가 | 예산 | 언제 |
| --- | --- | ---: | --- |
| `pnpm lint` | ruff + **import-linter(L0)** + oxlint | ~2초 | 매 저장 |
| `pnpm test` | **L1 + L2** (`-m "not wiring"`) | ~3초 | 매 저장 · 완료 게이트 |
| `pnpm test:all` | + **L3** (`wiring`) | ~10초 | 커밋 전 |

> 세 경로가 **겹치지 않는다.** L0 은 테스트에 없고, L3 은 기본 실행에 없다.
> 겹치면 같은 실패가 두 번 보고되고, 어느 쪽이 진짜인지 다시 판단해야 한다.

---

## 2. turbo 캐시가 실제 절감을 만든다

`turbo` 가 워크스페이스별로 해시를 비교하므로, **바뀐 워크스페이스만 돈다.**

```text
packages/scaffold-engine 만 수정
  → scaffold-engine 테스트만 실행, apps/api 는 캐시 적중
```

이것이 "전체 10초"를 "보통 2~3초"로 만드는 유일한 수단이다. 테스트를 줄이거나
병렬화해서 얻는 것이 아니다.

설정: [`01.turbo-task.md`](./01.turbo-task.md)

---

## 3. 예산 초과의 의미

예산은 성능 목표가 아니라 **등급 이탈 탐지기**다.

| 초과 | 의심 |
| --- | --- |
| `pnpm test` > 5초 | L3 가 마커 없이 섞였다 (`--strict-markers` 로 오타 차단) |
| `pnpm test:all` > 20초 | 앱을 여러 번 부팅한다 (`api_client` 세션 픽스처 미사용) |
| `pnpm lint` > 5초 | L0 이 애플리케이션 코드를 실행하고 있다 |

측정:

```bash
cd apps/api && venv/Scripts/python.exe -m pytest tests -q --durations=10
```

---

## 4. 문서 인덱스

| 문서 | 내용 |
| --- | --- |
| [`01.turbo-task.md`](./01.turbo-task.md) | `test` 태스크 정의 · 캐시 입력 · 워크스페이스 스크립트 |
| [`02.pytest-config.md`](./02.pytest-config.md) | `[tool.pytest.ini_options]` · 옵션별 근거 |
| [`03.gates.md`](./03.gates.md) | 완료 기준 개정안 · 실패 진단 순서 |

---

## 5. 현재 상태 (2026-09-14)

| 항목 | 상태 |
| --- | --- |
| `turbo.json` 의 `test` 태스크 | ❌ 없음 → **T0** |
| 루트 `test` 스크립트 | ❌ 없음 → **T0** |
| `[tool.pytest.ini_options]` | ❌ 없음 → **T0** |
| `packages/*` 테스트 스크립트 | ❌ 없음 → **T0** |
| 완료 게이트에 테스트 포함 | ❌ 없음 → **T0** |

이행: [`../../migration/01.T0-harness.md`](../../migration/01.T0-harness.md)
