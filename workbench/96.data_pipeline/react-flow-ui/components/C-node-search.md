---
type: card
title: "Node Search Bar"
description: "캔버스 내 노드를 실시간 검색하고 해당 노드로 부드럽게 화면을 이동시키는 검색 위젯"
resource: "../../../99.archive/react-flow-ui/components/node-search.tsx"
timestamp: "2026-09-06"
---

# summary
노드가 많아진 캔버스에서 특정 노드를 즉시 탐색하는 검색바. useReactFlow 훅의 fitView, setCenter와 연동되어 검색 결과 클릭 시 해당 노드로 자동 줌/패닝한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | NodeSearch Widget | 검색 인풋창 및 노드 필터링 리스트 UI | `export function NodeSearch` |
| E2 | 아키텍처 | Viewport Pan/Zoom Hook | 선택된 노드 ID로 캔버스 뷰포트를 이동시키는 setCenter 연동 | `useReactFlow` |
| E3 | 코드 | Floating Dock Style | 캔버스 상단/우측에 부착되는 플로팅 글래스모피즘 검색바 디자인 | `className` |

# 밖으로
- 검색 대상 노드는 [C-base-node.md](C-base-node.md)입니다.

# 원문
[node-search.tsx](../../../99.archive/react-flow-ui/components/node-search.tsx)
