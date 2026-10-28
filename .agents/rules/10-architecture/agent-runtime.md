---
description: "Agent Runtime 및 다중 LLM 실행의 확정 경계"
---

# Agent Runtime Architecture

이 문서는 F-02의 장기 이행에서 이미 합의된 경계만 다룬다. 기능 우선순위와 후보 비교의 정본은 `workbench/01.requirements_analysis/features/F-02-agent-runtime-and-resilient-llm-execution.md`다.

## 경계

- `core/agent_runtime/`은 Run, 재시도, 승인 대기, 재개처럼 도메인 무관 실행 제어만 소유한다. 도메인을 import하거나 도메인 프롬프트를 소유하지 않는다.
- 도메인 Agent는 해당 도메인 아래에 둔다. 일반 CRUD·조회·저장 기능을 Agent Runtime으로 보내지 않는다.
- `core/llm/`은 공급자 선택, 실행, 관측, 폴백, 자격증명 조회를 담당한다. 사용자용 도메인 문구와 HTTP 상태를 만들지 않는다.
- `packages/*`는 `apps/*`를 import하지 않는다. 모델 실행 계약의 정본은 패키지 Public API다.
- AI 실행 실패는 성공 결과나 빈 산출물로 위장하지 않는다. 도메인은 코드, 재시도 가능 여부, traceId를 포함한 결과로 변환한다.

## 상태 계약

`AgentRun` 은 로그가 아니라 **재개 가능한 실행 상태**다. 중단·재개가 요구사항인 이상
프로세스가 죽어도 "무엇을 어디까지 했는가"가 복원돼야 한다.

- 상태는 6가지다. `queued` `running` `completed` `failed` `waiting_for_configuration` `waiting_for_approval`
- `waiting_*` 은 **실패가 아니라 보류**다. 사람이 설정·동의를 마쳐야 풀린다.
  프런트가 이 둘을 실패로 그리면 사용자는 풀리지 않는 재시도만 반복한다
- 이력(`events.jsonl`)이 정본이고 `snapshot.json` 은 폴드 결과다. 스냅샷은 잃어도 복원된다
- 재개는 클로저가 아니라 **"유스케이스 이름 + 입력 스냅샷"** 으로만 가능하다.
  `AgentRuntime.register_use_case()` 로 등록하지 않은 실행은 이어갈 수 없다
- 부팅 시 `queued`/`running` 인 run 은 `AGENT_RUN_INTERRUPTED` 로 정리한다.
  그러지 않으면 사용자에게 영원히 "분석 중"으로 보인다
- 승인 대기는 프로세스 밖(`data/agreements/`)에 남긴다. 메모리에 두면 재시작에 사라진다

## 데이터

실행 상태·승인·원장의 저장 위치와 수명주기는 [`60-data/rule.md`](../60-data/rule.md) 가 정본이다.
요지만 옮기면:

```text
data/runs/{run_id}/        실행 상태 — 재개해야 하므로 data/ 다
data/agreements/{id}.json  사람의 결정 — 불변
data/ledger/{YYYY-MM}.jsonl 토큰·비용 원장 — 영구. provider-state 는 이것의 파생
state/log/traces/{date}/   디버그 트레이스 — 보존 14일
```

`core/agent_runtime` 은 저장 경로를 모른다. `bootstrap/container.py` 가 루트를 주입한다.

## 구현 전 확인

새 Agent 또는 공급자를 구현하기 전에는 F-02의 해당 원자 카드와 `workbench/02.tech_specs_candidates/`의 후보 문서를 갱신하거나 확정한다.
