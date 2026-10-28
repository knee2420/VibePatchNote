---
type: card
title: "Base Node Component"
description: "헤더, 타이틀, 본문, 푸터 레이아웃과 선택 상태 스타일이 결합된 표준 캔버스 카드"
resource: "../../../99.archive/react-flow-ui/components/base-node.tsx"
timestamp: "2026-09-06"
---

# summary
React Flow 캔버스 노드의 단일 정본 템플릿. BaseNode, BaseNodeHeader, BaseNodeHeaderTitle, BaseNodeContent, BaseNodeFooter 서브 컴포넌트로 구성되며, in-[.selected]:border-muted-foreground shadow-lg 로 선택 인터랙션을 기본 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | BaseNode Shell | ComponentProps<"div"> 기반의 카드 최외곽 래퍼 및 선택 상태 스타일 | `export function BaseNode` |
| E2 | 구조 | Header & Title Slots | 아이콘/액션 배치용 Header 및 텍스트 선택 방지(user-select-none) Title 슬롯 | `export function BaseNodeHeader` |
| E3 | 코드 | Content & Footer Slots | 내부 본문 영역(p-3 flex-col) 및 상단 테두리 구분선이 있는 Footer 슬롯 | `export function BaseNodeContent` |

# 밖으로
- 복합 테이블 노드는 [C-database-schema-node.md](C-database-schema-node.md)를 참조하십시오.
- 노드 외곽 툴팁은 [C-node-tooltip.md](C-node-tooltip.md)와 결합됩니다.

# 원문
[base-node.tsx](../../../99.archive/react-flow-ui/components/base-node.tsx)
