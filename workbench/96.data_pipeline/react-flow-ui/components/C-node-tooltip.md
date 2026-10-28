---
type: card
title: "Node Tooltip Component"
description: "노드나 캔버스 요소 호버 시 플로팅되는 고해상도 정보 툴팁"
resource: "../../../99.archive/react-flow-ui/components/node-tooltip.tsx"
timestamp: "2026-09-06"
---

# summary
Radix UI Tooltip Primitives를 React Flow 캔버스 좌표계에 완벽히 매핑한 툴팁 시스템. NodeTooltip, NodeTooltipTrigger, NodeTooltipContent 로 구성되어 줌/팬 인터랙션 중에도 정확한 위치를 유지한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Tooltip Primitives | Trigger와 Content를 연결하는 Radix 기반 플로팅 툴팁 | `export function NodeTooltip` |
| E2 | 아키텍처 | Canvas Viewport Alignment | React Flow 확대/축소 배율에 영향받지 않는 팝오버 좌표 보정 | `NodeTooltipContent` |
| E3 | 코드 | Animation & Shadow | bg-popover, text-popover-foreground 기반 시맨틱 스타일 | `className` |

# 밖으로
- 노드 본체는 [C-base-node.md](C-base-node.md)에 위치합니다.

# 원문
[node-tooltip.tsx](../../../99.archive/react-flow-ui/components/node-tooltip.tsx)
