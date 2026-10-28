---
type: card
title: "Base Handle Component"
description: "포트 호버 효과 및 연결 가능 상태를 시각화하는 표준 연결 핸들/포트"
resource: "../../../99.archive/react-flow-ui/components/base-handle.tsx"
timestamp: "2026-09-06"
---

# summary
React Flow Handle 컴포넌트를 shadcn 테마 토큰으로 감싼 표준 연결 포트. type(source, target)과 position(Top, Bottom, Left, Right)을 지원하며, 포트 연결 호버 시 링(ring-2) 효과를 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | BaseHandle Props | HandleProps 기반의 확장 포트 인터페이스 | `export function BaseHandle` |
| E2 | 규칙 | Connection Valid State | 드래그 연결 가능/불가 상태에 따른 커서 및 보더 피드백 | `className` |
| E3 | 코드 | Port Dot Styling | bg-primary, border-background 기반의 깔끔한 원형 포트 스타일 | `rounded-full` |

# 밖으로
- 라벨이 있는 포트는 [C-labeled-handle.md](C-labeled-handle.md)를 참조하십시오.

# 원문
[base-handle.tsx](../../../99.archive/react-flow-ui/components/base-handle.tsx)
