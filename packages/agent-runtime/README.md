# Agent Runtime (`@vibe/agent-runtime`)

도메인 및 호스트에 독립적인(Domain-Agnostic & Host-Independent) 범용 Agent 실행 생명주기 및 승인 커널입니다.

`documents`, `scaffolds`, 파일 포맷, 특정 비즈니스 엔티티, 프롬프트 같은 도메인 세부를 import 하거나 저장하지 않습니다.
도메인별 Agent 정의는 각 도메인의 서비스/유스케이스에 두고, 이 패키지는 상태 전이, 이벤트 소싱, 승인 대기, 그리고 중단·재개 메커니즘만을 제공합니다.

## 모듈 구성

| 모듈 | 책임 |
| --- | --- |
| `models.py` | `AgentRun`(6상태) · `Agreement` · `LedgerEntry` · `RunCost` · `AgentRunInput` |
| `events.py` | `AgentRunEvent` 와 `fold()` — 이력이 정본, 상태는 그 폴드(Fold) 결과 |
| `repository.py` | `events.jsonl`(append-only) + `snapshot.json`(파생 캐시) 영속화 |
| `policy.py` | 실패 코드 → 재시도 / 설정 대기 / 실패 판정 규칙 일원화 |
| `approval.py` | 사람의 결정(`Agreement`) 발급 및 소비. 프로세스 외부에 영속화 |
| `runtime.py` | 실행·대기 전이·재개·부팅 시 고아 실행 정리 |
| `ports.py` | 저장소 추상 인터페이스 (`AgentRunRepositoryPort`, `AgreementRepositoryPort`, `LedgerPort`) |

## 설계 원칙

### 1. 왜 이벤트 소싱(이력)인가
단순 상태 덮어쓰기 방식으로는 "왜 이 상태가 되었는가"와 실행 경로가 남지 않습니다. 그러면 재개할 수도, 장애 원인을 되짚을 수도 없습니다.
`events.jsonl`이 영구 정본이며, `snapshot.json`은 읽기 성능 최적화를 위한 파생 캐시일 뿐입니다. 스냅샷이 손상되어도 이력으로부터 100% 복원됩니다.

### 2. 왜 부팅 시 고아 정리를 하는가
`asyncio.create_task`로 기동된 백그라운드 태스크는 서버 프로세스가 비정상 종료되면 함께 사라지지만, 영속 저장소에는 `running`으로 남습니다.
이를 부팅 시점에 `mark_interrupted`로 정리하지 않으면 사용자 화면에 영원히 "진행 중"으로 표기됩니다.
반면 사람 승인 대기나 설정 대기(`waiting_*`)는 정상적인 대기 상태이므로 정리 대상에서 제외됩니다.

