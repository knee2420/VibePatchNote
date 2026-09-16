---
type: card
title: "Ticker Component Spec"
description: "A composable finance ticker for displaying symbols, prices and changes."
resource: "../../../../../../99.archive/kiboui/apps/docs/content/components/ticker.mdx"
timestamp: "2026-09-16"
---

# summary
A composable finance ticker for displaying symbols, prices and changes.에 관한 공식 명세서로, **컴포넌트의 주요 기능, 다양한 사용 사례(Examples), 그리고 스타일 확장 포인트**를 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ticker 컴포넌트 정체성 | A composable finance ticker for displaying symbols, prices and changes. | `## Features` |
| E2 | 기능 | 핵심 상호작용 | Flexible composition with optional icon, symbol, price, and change components | `## Features` |
| E3 | 인터페이스 | 구성 및 스타일 커스텀 | Color-coded up/down price change indicators with optional percentage formatting | `## Features` |
| E4 | 사례 | 프리뷰 및 활용 패턴 | Support for [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) currencies and [IETF BCP 47](https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag) locales | `## Examples` |

# 밖으로
- [E1] 이 컴포넌트의 실제 TypeScript 소스코드 구현체는 `[packages/ticker](../../../../packages/ticker/C-index.md)`에 위치한다.
- [E2] 기본 테마 토큰 및 스타일 의존성은 `[C-setup.md](../docs/C-setup.md)`를 상속한다.

# 원문
[ticker.mdx](../../../../../../99.archive/kiboui/apps/docs/content/components/ticker.mdx) · [kibo-ui.com/components/ticker](https://www.kibo-ui.com/components/ticker)
