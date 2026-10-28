---
type: card
title: "Mini Calendar Component Spec"
description: "A composable mini calendar component for picking dates close to today."
resource: "../../../../../../99.archive/kiboui/apps/docs/content/components/mini-calendar.mdx"
timestamp: "2026-09-16"
---

# summary
A composable mini calendar component for picking dates close to today.에 관한 공식 명세서로, **컴포넌트의 주요 기능, 다양한 사용 사례(Examples), 그리고 스타일 확장 포인트**를 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | mini-calendar 컴포넌트 정체성 | A composable mini calendar component for picking dates close to today. | `## Features` |
| E2 | 기능 | 핵심 상호작용 | Displays a configurable number of consecutive days (default: 5) in a compact horizontal layout | `## Features` |
| E3 | 인터페이스 | 구성 및 스타일 커스텀 | Navigation with chevron buttons to move between date ranges by the configured number of days | `## Features` |
| E4 | 사례 | 프리뷰 및 활용 패턴 | Fully composable with separate components for navigation, days container, and individual days | `## Examples` |

# 밖으로
- [E1] 이 컴포넌트의 실제 TypeScript 소스코드 구현체는 `[packages/mini-calendar](../../../../packages/mini-calendar/C-index.md)`에 위치한다.
- [E2] 기본 테마 토큰 및 스타일 의존성은 `[C-setup.md](../docs/C-setup.md)`를 상속한다.

# 원문
[mini-calendar.mdx](../../../../../../99.archive/kiboui/apps/docs/content/components/mini-calendar.mdx) · [kibo-ui.com/components/mini-calendar](https://www.kibo-ui.com/components/mini-calendar)
