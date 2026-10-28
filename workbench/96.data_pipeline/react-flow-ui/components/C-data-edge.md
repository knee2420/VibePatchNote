---
type: card
title: "Data Edge Component"
description: "연결선 위에 데이터 타입, 흐름 건수, 라벨 뱃지를 표시하는 데이터 플로우 엣지"
resource: "../../../99.archive/react-flow-ui/components/data-edge.tsx"
timestamp: "2026-09-06"
---

# summary
노드 간에 전송되는 데이터 규격이나 상태 라벨을 엣지 상에 뱃지로 렌더링하는 컴포넌트. 곡선 중앙 좌표(labelX, labelY)에 맞춰 라벨 뱃지를 회전 없이 수평 유지한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | DataEdge Component | 라벨 뱃지 및 메타데이터를 표시하는 엣지 컴포넌트 | `export function DataEdge` |
| E2 | 구조 | Edge Badge Slot | 엣지 중앙에 위치하는 텍스트/뱃지 슬롯 | `EdgeLabelRenderer` |
| E3 | 코드 | Label Positioning | transform translate(-50%, -50%) 기반의 정밀 중앙 정렬 | `style` |

# 밖으로
- 액션 버튼 엣지는 [C-button-edge.md](C-button-edge.md)를 참조하십시오.

# 원문
[data-edge.tsx](../../../99.archive/react-flow-ui/components/data-edge.tsx)
