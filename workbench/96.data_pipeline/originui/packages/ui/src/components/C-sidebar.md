---
type: card
title: "sidebar Implementation"
description: "sidebar TypeScript 코어 컴포넌트 소스코드"
resource: "../../../../../../99.archive/originui/packages/ui/src/components/sidebar.tsx"
timestamp: "2026-09-06"
---

# summary
sidebar.tsx 코어 구현체. Radix UI Primitives와 Tailwind 유틸리티(`cn`)를 결합하여 구성됨. 주요 Export: SidebarContextProps, SidebarContext, useSidebar, SidebarProvider, Sidebar.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 인터페이스 | sidebar Exports | 외부로 공개되는 핵심 컴포넌트 및 타입: SidebarContextProps, SidebarContext, useSidebar, SidebarProvider, Sidebar | `export function SidebarContextProps` |
| E2 | 아키텍처 | sidebar Radix Primitive | 접근성(a11y)과 키보드 네비게이션을 보장하는 기저 프리미티브 합성 | `import` |
| E3 | 코드 | sidebar Tailwind Classes | 시맨틱 토큰 기반의 테두리, 배경, 포커스 링, 상태 스타일링 | `className` |

# 밖으로
- 공식 사용 가이드 및 변형은 [apps/ui/content/docs/components](../../../../apps/ui/content/docs/components/index.md)를 참조하십시오.

# 원문
[sidebar.tsx](../../../../../../99.archive/originui/packages/ui/src/components/sidebar.tsx)
