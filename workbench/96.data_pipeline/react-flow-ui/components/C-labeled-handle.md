---
type: card
title: "Labeled Handle Component"
description: "입출력 파라미터명이나 데이터 타입 라벨이 나란히 표시되는 텍스트 라벨 포트"
resource: "../../../99.archive/react-flow-ui/components/labeled-handle.tsx"
timestamp: "2026-09-06"
---

# summary
포트 옆에 텍스트 라벨(예: "Input Data", "Success", "Error")을 나란히 렌더링하는 포트. 좌측 포트는 텍스트가 오른쪽에, 우측 포트는 텍스트가 왼쪽에 자동 정렬된다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | LabeledHandle Props | label 텍스트 prop 및 HandleProps 결합 인터페이스 | `export function LabeledHandle` |
| E2 | 구조 | Auto Label Placement | position(Left vs Right)에 따른 flex-row / flex-row-reverse 자동 전환 | `position` |
| E3 | 코드 | Typography & Gap | 포트와 라벨 사이의 4px 간격 및 text-xs muted 타이포그래피 | `className` |

# 밖으로
- 단일 포트는 [C-base-handle.md](C-base-handle.md)를 참조하십시오.

# 원문
[labeled-handle.tsx](../../../99.archive/react-flow-ui/components/labeled-handle.tsx)
