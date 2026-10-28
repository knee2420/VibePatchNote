---
type: card
title: "Placeholder Node"
description: "데이터 로딩 중이거나 드롭 대기 상태를 나타내는 플레이스홀더/스켈레톤 노드"
resource: "../../../99.archive/react-flow-ui/components/placeholder-node.tsx"
timestamp: "2026-09-06"
---

# summary
캔버스에 새로운 노드를 드롭하거나 비동기 데이터를 가져올 때 표시되는 플레이스홀더. 점선 테두리(border-dashed)와 플러스 아이콘 또는 안내 문구를 포함한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Placeholder Shell | 점선 테두리와 안내 문구를 포함하는 스켈레톤 노드 래퍼 | `export function PlaceholderNode` |
| E2 | 규칙 | Interactive States | 드래그 오버 시 포커스 링 및 활성화 피드백 스타일 | `className` |
| E3 | 코드 | Visual Feedback | 사용자 액션을 유도하는 중앙 정렬 안내 UI | `flex items-center` |

# 밖으로
- 완성된 카드는 [C-base-node.md](C-base-node.md)로 교체됩니다.

# 원문
[placeholder-node.tsx](../../../99.archive/react-flow-ui/components/placeholder-node.tsx)
