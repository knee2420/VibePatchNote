# agent-run-panel

Agent 실행의 **보류 상태를 사용자에게 되돌려 주는 창구**입니다.

`waiting_for_configuration` / `waiting_for_approval` 은 실패가 아니라 보류입니다.
사람이 설정하거나 동의해야 풀리며, 그때까지 재시도해도 같은 자리로 돌아옵니다.
이 창구가 없으면 사용자는 왜 분석이 멈춰 있는지 알 방법이 없습니다.

대기 목록의 정본은 서버(`data/agreements/`)입니다. 브라우저 메모리에 두면
새로고침 한 번에 사라지고, "승인했는데 아무 일도 일어나지 않는" 상태가 됩니다.

정본: [`.agents/rules/10-architecture/agent-runtime.md`](../../../../../.agents/rules/10-architecture/agent-runtime.md)
