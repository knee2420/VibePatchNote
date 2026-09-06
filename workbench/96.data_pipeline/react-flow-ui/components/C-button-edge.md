---
type: card
title: "Button Edge Component"
description: "엣지 중앙에 삭제, 분기, 설정 등의 액션 버튼이 부착된 인터랙티브 엣지"
resource: "../../../99.archive/react-flow-ui/components/button-edge.tsx"
timestamp: "2026-09-06"
---

# summary
연결선 중앙 지점에 EdgeLabelRenderer를 사용하여 HTML 버튼을 정확히 배치하는 엣지. 연결선 삭제(Delete)나 조건 설정을 직관적으로 수행할 수 있게 돕는다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | ButtonEdge Component | 중앙 액션 버튼을 렌더링하는 커스텀 엣지 컴포넌트 | `export function ButtonEdge` |
| E2 | 아키텍처 | EdgeLabelRenderer Integration | SVG 컨테이너를 벗어나 DOM 버튼을 엣지 중앙에 앵커링하는 렌더러 | `EdgeLabelRenderer` |
| E3 | 코드 | Action Button Style | 호버 시 노출되거나 항상 클릭 가능한 미니 원형 버튼 스타일 | `className` |

# 밖으로
- 단순 애니메이션 엣지는 [C-animated-svg-edge.md](C-animated-svg-edge.md)를 참조하십시오.

# 원문
[button-edge.tsx](../../../99.archive/react-flow-ui/components/button-edge.tsx)
