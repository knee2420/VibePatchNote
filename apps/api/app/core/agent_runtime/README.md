# Agent Runtime

`AgentRun`, 실행 이력, 상태 전이, 재시도·승인 정책, 중단·재개를 제공하는 도메인 무관 런타임이다.

`documents`, `scaffolds`, PDF, 아웃라인, 프롬프트 같은 도메인 세부를 import 하거나 저장하지 않는다.
도메인별 Agent 정의는 각 도메인의 `agents/` 에 둔다. 일반 CRUD·파일 조회 요청은 이 Runtime 을 쓰지 않는다.

## 구성

| 모듈 | 책임 |
| --- | --- |
| `models.py` | `AgentRun`(6상태) · `Agreement` · `LedgerEntry` · `RunCost` |
| `events.py` | `AgentRunEvent` 와 `fold()` — 이력이 정본, 상태는 그 폴드 |
| `repository.py` | `events.jsonl`(append-only) + `snapshot.json`(파생) |
| `policy.py` | 실패 코드 → 재시도 / 설정 대기 / 실패 판정 (한 곳) |
| `approval.py` | 사람의 결정 발급·소비. 프로세스 밖에 남는다 |
| `runtime.py` | 실행·대기 전이·재개·부팅 시 고아 정리 |

## 왜 이력인가

전체 덮어쓰기로는 "왜 이 상태가 되었는가"가 남지 않는다. 그러면 재개할 수도, 실패를
되짚을 수도 없다. `snapshot.json` 은 읽기 최적화일 뿐 잃어도 이력에서 복원된다.

## 왜 부팅 시 정리하는가

`asyncio.create_task` 로 띄운 실행은 프로세스와 함께 사라지지만 파일에는 `running` 으로
남는다. 정리하지 않으면 사용자에게 영원히 "분석 중"으로 보인다.
대기 상태(`waiting_*`)는 정상이므로 건드리지 않는다.

정본: [`.agents/rules/10-architecture/agent-runtime.md`](../../../../../.agents/rules/10-architecture/agent-runtime.md)
· [`.agents/rules/60-data/rule.md`](../../../../../.agents/rules/60-data/rule.md)
