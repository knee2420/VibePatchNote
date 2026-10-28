---
type: card
title: "Node Appendix Panel"
description: "노드 카드 외곽에 날개처럼 부착되어 추가 정보나 액션을 확장하는 부가 패널"
resource: "../../../99.archive/react-flow-ui/components/node-appendix.tsx"
timestamp: "2026-09-06"
---

# summary
노드 본체를 어지럽히지 않고 외부로 메타데이터나 액션 버튼을 노출하는 확장 슬롯. position(top, right, bottom, left)에 따라 노드 바깥쪽에 깔끔하게 고정된다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Appendix Container | 노드 경계선 외부에 정렬되는 부착형 패널 컴포넌트 | `export function NodeAppendix` |
| E2 | 구조 | Position Strategy | 상하좌우 4방향 앵커링 및 오프셋 마진 계산 로직 | `position` |
| E3 | 코드 | Subtle Panel Styling | 본체 카드와 구분되는 bg-muted/60 컴팩트 텍스트 스타일 | `className` |

# 밖으로
- 부착 대상 노드는 [C-base-node.md](C-base-node.md)입니다.

# 원문
[node-appendix.tsx](../../../99.archive/react-flow-ui/components/node-appendix.tsx)
