---
type: card
title: "Labeled Group Node"
description: "캔버스 위의 여러 노드를 시각적으로 묶어주는 영역 래퍼 및 그룹 라벨 컴포넌트"
resource: "../../../99.archive/react-flow-ui/components/labeled-group-node.tsx"
timestamp: "2026-09-06"
---

# summary
노드들을 논리적/시각적으로 그룹핑하는 컨테이너 노드. LabeledGroupNode와 상단 라벨 슬롯을 제공하며, 반투명 배경과 점선/실선 테두리로 하위 노드들의 영역을 명확히 정의한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Group Container | 하위 노드를 감싸는 캔버스 뷰포트 영역 컨테이너 | `export function LabeledGroupNode` |
| E2 | 구조 | Group Label Slot | 그룹 영역 좌상단에 부착되는 제목 및 상태 라벨 슬롯 | `export function LabeledGroupNode` |
| E3 | 코드 | Styling & Z-Index | 노드들 아래에 위치하도록 설계된 최소 배경색 및 테두리 스타일링 | `className` |

# 밖으로
- 단일 카드는 [C-base-node.md](C-base-node.md)를 참조하십시오.

# 원문
[labeled-group-node.tsx](../../../99.archive/react-flow-ui/components/labeled-group-node.tsx)
