---
type: card
title: "Button Handle Component"
description: "클릭하여 즉시 새 노드를 생성하거나 팝오버 메뉴를 띄우는 버튼형 연결 포트"
resource: "../../../99.archive/react-flow-ui/components/button-handle.tsx"
timestamp: "2026-09-06"
---

# summary
단순 드래그 연결뿐 아니라 원클릭 액션을 지원하는 인터랙티브 포트. 플러스(+) 아이콘이 내장되어 있어 클릭 시 다음 단계 노드를 원클릭으로 추가할 수 있다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | ButtonHandle Component | 버튼 클릭 이벤트와 포트 연결 기능을 결합한 컴포넌트 | `export function ButtonHandle` |
| E2 | 아키텍처 | Click vs Drag Separation | 마우스 드래그 연결과 단일 클릭 이벤트를 분리 처리하는 로직 | `onClick` |
| E3 | 코드 | Plus Icon Button Style | 포트 중심에 플러스 아이콘이 배치된 세련된 원형 버튼 스타일 | `className` |

# 밖으로
- 표준 연결 포트는 [C-base-handle.md](C-base-handle.md)를 참조하십시오.

# 원문
[button-handle.tsx](../../../99.archive/react-flow-ui/components/button-handle.tsx)
