---
type: card
title: "Gantt Component Spec"
description: "The Gantt chart is a powerful tool for visualizing project schedules and tracking the progress of tasks. It provides a clear, hierarchical view of tasks, allowing you to easily identify manage project timelines."
resource: "../../../../../../99.archive/kiboui/apps/docs/content/components/gantt.mdx"
timestamp: "2026-09-16"
---

# summary
The Gantt chart is a powerful tool for visualizing project schedules and tracking the progress of tasks. It provides a clear, hierarchical view of tasks, allowing you to easily identify manage project timelines.에 관한 공식 명세서로, **컴포넌트의 주요 기능, 다양한 사용 사례(Examples), 그리고 스타일 확장 포인트**를 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | gantt 컴포넌트 정체성 | The Gantt chart is a powerful tool for visualizing project schedules and tracking the progress of tasks. It provides a clear, hierarchical view of tasks, allowing you to easily identify manage project timelines. | `## Features` |
| E2 | 기능 | 핵심 상호작용 | Resizable and draggable timeline items | `## Features` |
| E3 | 인터페이스 | 구성 및 스타일 커스텀 | Markers to highlight important dates | `## Features` |
| E4 | 사례 | 프리뷰 및 활용 패턴 | Today marker to highlight the current date | `## Examples` |

# 밖으로
- [E1] 이 컴포넌트의 실제 TypeScript 소스코드 구현체는 `[packages/gantt](../../../../packages/gantt/C-index.md)`에 위치한다.
- [E2] 기본 테마 토큰 및 스타일 의존성은 `[C-setup.md](../docs/C-setup.md)`를 상속한다.

# 원문
[gantt.mdx](../../../../../../99.archive/kiboui/apps/docs/content/components/gantt.mdx) · [kibo-ui.com/components/gantt](https://www.kibo-ui.com/components/gantt)
