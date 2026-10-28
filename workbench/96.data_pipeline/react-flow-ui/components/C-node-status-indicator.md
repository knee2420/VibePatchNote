---
type: card
title: "Node Status Indicator"
description: "노드의 실행, 완료, 에러, 대기 상태를 실시간 시각화하는 인디케이터 점/뱃지"
resource: "../../../99.archive/react-flow-ui/components/node-status-indicator.tsx"
timestamp: "2026-09-06"
---

# summary
AI 파이프라인이나 비동기 작업의 상태를 캔버스 노드에 직관적으로 표시하는 상태 컴포넌트. status(loading, success, error, idle) prop에 따라 펄스 애니메이션과 시맨틱 색상을 전환한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Status Indicator Props | status 유니온 타입(success | error | loading | idle) 정의 | `export function NodeStatusIndicator` |
| E2 | 코드 | Pulse Animation | 로딩 및 진행 중 상태를 알리는 animate-ping / animate-pulse 스타일 | `animate-ping` |
| E3 | 규칙 | Semantic Status Colors | text-emerald-500, text-destructive, text-amber-500 매핑 규약 | `className` |

# 밖으로
- 상태 표시가 결합되는 카드는 [C-base-node.md](C-base-node.md)입니다.

# 원문
[node-status-indicator.tsx](../../../99.archive/react-flow-ui/components/node-status-indicator.tsx)
