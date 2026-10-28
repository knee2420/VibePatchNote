---
type: card
title: "Calendar Component Spec"
description: "The calendar view displays features on a grid calendar. Specifically it shows the end date of each feature, and groups features by day."
resource: "../../../../../../99.archive/kiboui/apps/docs/content/components/calendar.mdx"
timestamp: "2026-09-16"
---

# summary
The calendar view displays features on a grid calendar. Specifically it shows the end date of each feature, and groups features by day.에 관한 공식 명세서로, **컴포넌트의 주요 기능, 다양한 사용 사례(Examples), 그리고 스타일 확장 포인트**를 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | calendar 컴포넌트 정체성 | The calendar view displays features on a grid calendar. Specifically it shows the end date of each feature, and groups features by day. | `## Features` |
| E2 | 기능 | 핵심 상호작용 | Features are grouped by day | `## Features` |
| E3 | 인터페이스 | 구성 및 스타일 커스텀 | Features are color-coded by their status | `## Features` |
| E4 | 사례 | 프리뷰 및 활용 패턴 | Features are truncated if there are too many to fit in the grid cell | `## Examples` |

# 밖으로
- [E1] 이 컴포넌트의 실제 TypeScript 소스코드 구현체는 `[packages/calendar](../../../../packages/calendar/C-index.md)`에 위치한다.
- [E2] 기본 테마 토큰 및 스타일 의존성은 `[C-setup.md](../docs/C-setup.md)`를 상속한다.

# 원문
[calendar.mdx](../../../../../../99.archive/kiboui/apps/docs/content/components/calendar.mdx) · [kibo-ui.com/components/calendar](https://www.kibo-ui.com/components/calendar)
