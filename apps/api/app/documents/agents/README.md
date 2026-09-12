# Documents Agents

documents 도메인의 **Agent 경로**를 정의한다. **LLM 이 개입하며, Agent Runtime 을 통과**한다.

| Agent | 하는 일 | 산출물 위치 / 방식 |
| --- | --- | --- |
| `extract_outline` | 계층 아웃라인 + 엘리먼트 추출 | `data/knowledge/.../artifacts/outline/` 불변 커밋 + HEAD 갱신 |
| `generate_scaffold` | PDF 로부터 Tiptap 스캐폴딩(HTML & MD) 생성 | 독립 애그리거트 스캐폴드 아카이브 |

## 규칙

- **Agent Runtime 통과**: 비결정적이고 비용이 발생하는 LLM 호출은 Agent Runtime (`core/agent_runtime`)을 거친다.
- **아티팩트 커밋**: 결과는 단순 캐시가 아니므로 `data/` 에 provenance(모델, 토큰, 프롬프트 해시 등)와 함께 불변으로 커밋한다. 실패 폴백은 커밋하지 않는다.
- **포트와 계약 의존**: 저장 경로를 직접 알지 않고 포트(`ports.py`)에 의존한다. `app.core.config` 를 직접 import 하지 않는다 (import-linter 강제).
- **재개 등록**: 재개 가능한 작업은 `service.py` 에서 `register_use_case()` 로 등록한다.

정본: [`.agents/rules/10-architecture/agent-runtime.md`](../../../../../.agents/rules/10-architecture/agent-runtime.md) · [`.agents/rules/60-data/rule.md`](../../../../../.agents/rules/60-data/rule.md)
