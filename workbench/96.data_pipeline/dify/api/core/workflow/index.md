---
type: index
title: "02_workflow (Canvas Workflow Engine)"
description: "시각적 캔버스에서 들어온 노드와 엣지를 파싱하고 비동기적으로 실행하는 워크플로우 런타임 엔진"
resource: "../../../../../99.archive/dify/api/core/workflow"
timestamp: "2026-09-02"
---

# 이 섹션은

ReactFlow나 기타 프론트엔드 캔버스에서 작성된 노드 기반 워크플로우를 파이썬 객체로 변환하여 실행(Execute)하는 엔진이다. 각 노드는 `base_node` 인터페이스를 따르며, LLM 노드, 조건부 노드 등 개별 로직을 모듈화하여 관리한다. 

# 카드

| 카드 | 핵심 가치 (값나가는 것) | elements |
|---|---|---|
| [C-node_runtime](C-node_runtime.md) | 그래프 엔진과 워크플로우를 이어주는 실행 런타임 래퍼 및 상태 관리 | 3 |

# 이 섹션 밖

- [상위 연결: `../index.md` 코어 허브]
- 프론트엔드에서 오는 JSON 구조를 파싱하는 것은 `workflow_entry.py`나 `graph_engine.py`에서 담당.
