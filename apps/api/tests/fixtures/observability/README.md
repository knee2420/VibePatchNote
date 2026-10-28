# 관측 픽스처 — 실제 생산자 출력

> 생성: [`_build_fixtures.py`](./_build_fixtures.py) · 원본: `apps/api/data` (2026-09-12)
> 규칙 정본: [`.agents/rules/60-data/observability.md`](../../../../../.agents/rules/60-data/observability.md)

## 왜 손으로 짓지 않는가

`test_inspector.py` 가 `{"status": "SUCCESS", "duration_ms": 1250.5}` 라는 샘플로
통과하고 있었다. **생산자(`ingest_pipeline_telemetry`)는 그 키를 쓰지 않는다** —
실제로는 `"status": "success"`, `"total_latency_ms"` 다. 그래서 테스트가 초록불인
채로 "성공한 스팬이 전부 빨간색으로 렌더되는" 버그가 살아남았다.

픽스처가 생산자 출력이 아니면, 테스트는 **자기가 지어낸 세계**를 검증한다.

## 무엇을 잘랐나

커밋 가능한 크기를 위해 **300자를 넘는 문자열 값만** 잘랐다
(`…[truncated N chars for fixture]` 표시가 붙는다).

키 이름·대소문자·중첩 구조·숫자·불리언·null 은 **그대로**다. 검증 대상이
그것들이기 때문이다.

> ⚠️ 잘린 문자열의 길이와 `prompt_chars` 같은 **숫자 필드는 더 이상 일치하지 않는다.**
> 페이로드 길이를 검증하는 테스트에는 이 픽스처를 쓰지 말 것.

## 구성

| 경로 | 대표하는 상황 |
| --- | --- |
| `runs/run-1a094630557-4e4f96ee/` | 풀 텔레메트리 — `meta.json` + `ledger.jsonl` + `events.jsonl` + `snapshots.json` |
| `runs/run-contract-20260911-191719/` | `attempt` 레코드 있음 — `ModelAttemptRecord` 계약 검증용 |
| `runs/agent-5a0846d55d53/` | `events.jsonl` 만 있음 — **`meta.json` 기준 목록에서는 보이지 않는 run** |
| `ledger/2026-09.jsonl` | 월별 원장. camelCase 4행 + snake_case 4행 (스키마 분기 재현) |

## 이 픽스처가 고정하는 사실

아래는 **현재 저장소의 실제 상태**다. 고쳐야 할 대상이지 바람직한 모습이 아니다.

| 사실 | 확인 위치 |
| --- | --- |
| 스팬 `status` 는 소문자 `"success"` | `runs/*/ledger.jsonl` |
| attempt 은 `model_name`·`latency_ms`·`usage` 를 쓴다 (`model`·`duration_ms`·`cost_usd` 아님) | `runs/run-contract-*/ledger.jsonl` |
| `meta.json` 에 `usage` 키가 없다 → 토큰·비용이 0 으로 표시되는 원인 | `runs/*/meta.json` |
| 월별 원장 `status` 는 대문자 `"SUCCESS"` — 스팬과 어휘가 다르다 | `ledger/2026-09.jsonl` |
| 같은 원장 파일에 camelCase·snake_case 두 스키마가 섞여 있다 | `ledger/2026-09.jsonl` |
| `events.jsonl` 만 있는 run 이 존재한다 (전체 54건 중 36건) | `runs/agent-*/` |

## 갱신

```bash
python apps/api/tests/fixtures/observability/_build_fixtures.py --source apps/api/data
```

마이그레이션으로 저장 형식을 바꿨다면 픽스처도 다시 뜬다. 다만 **마이그레이션
이전 형식을 검증하는 테스트가 있다면 그 픽스처는 따로 보존**해야 한다 —
`ledger/2026-09.jsonl` 의 camelCase 행이 그 예다.
