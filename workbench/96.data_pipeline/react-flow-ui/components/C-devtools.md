---
type: card
title: "Canvas Devtools Panel"
description: "캔버스 노드 수, 선택 상태, 뷰포트 x/y/zoom 좌표를 실시간 디버깅하는 개발자 패널"
resource: "../../../99.archive/react-flow-ui/components/devtools.tsx"
timestamp: "2026-09-06"
---

# summary
React Flow 캔버스 상태를 실시간으로 모니터링하는 디버깅 도구. 뷰포트 트랜스폼 값과 활성 노드 수, 최근 변경 이벤트를 개발 모드에서 오버레이로 보여준다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | Devtools Panel | 캔버스 모서리에 고정되는 모니터링 디버그 창 | `export function Devtools` |
| E2 | 아키텍처 | React Flow Store Subscription | useStoreApi 기반의 고성능 무렌더링 좌표/상태 구독 | `useStoreApi` |
| E3 | 도구 | Metrics Display | 노드 개수, 엣지 개수, 줌 배율을 표시하는 테이블 뷰 | `className` |

# 밖으로
- 디버깅 대상 노드는 [C-base-node.md](C-base-node.md)입니다.

# 원문
[devtools.tsx](../../../99.archive/react-flow-ui/components/devtools.tsx)
