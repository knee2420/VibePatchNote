---
type: card
title: "Node Runtime (노드 실행 런타임 추상화)"
description: "각 워크플로우 노드(Tool, LLM 등)가 Graphon 및 ModelRuntime과 상호작용하기 위한 어댑터/래퍼 계층"
resource: "../../../../../99.archive/dify/api/core/workflow/node_runtime.py"
timestamp: "2026-09-02"
---

# summary
워크플로우 그래프 엔진(Graphon 등)이 개별 노드(예: Tool Node, LLM Node)를 실행할 때, 실제 `model_manager`나 `tool_manager`의 복잡한 API를 직접 호출하지 않도록 **추상화된 프로토콜(Adapter)을 제공**한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 어댑터 | DifyPreparedLLM | ModelInstance를 감싸 Graphon 엔진이 LLM 노드를 쉽게 호출(invoke_llm)할 수 있게 하는 래퍼 | `## class DifyPreparedLLM` |
| E2 | 인터페이스 | PollingLLMRuntimeProtocol | 비동기 폴링 방식의 실행 상태(Running, Succeeded)를 관리하기 위한 프로토콜 | `## class PollingLLMRuntimeProtocol` |
| E3 | 규칙 | Quota 정산 로직 | 노드 실행 완료(Succeeded) 시 LLM 사용량(Usage)을 측정하고 쿼터를 커밋(Commit/Release) | `## def _settle_polling_quota` |

# 밖으로
- [E1, E3] 실제 LLM 호출 및 쿼터 차감은 `[C-model_manager](../C-model_manager.md)`의 인스턴스를 통해 이루어진다.

# 원문
[node_runtime.py 원본](../../../../../99.archive/dify/api/core/workflow/node_runtime.py)
