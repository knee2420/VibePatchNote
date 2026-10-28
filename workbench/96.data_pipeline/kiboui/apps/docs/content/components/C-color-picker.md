---
type: card
title: "Color Picker Component Spec"
description: "Allows users to select a color. Modeled after the color picker in Figma."
resource: "../../../../../../99.archive/kiboui/apps/docs/content/components/color-picker.mdx"
timestamp: "2026-09-16"
---

# summary
Allows users to select a color. Modeled after the color picker in Figma.에 관한 공식 명세서로, **컴포넌트의 주요 기능, 다양한 사용 사례(Examples), 그리고 스타일 확장 포인트**를 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | color-picker 컴포넌트 정체성 | Allows users to select a color. Modeled after the color picker in Figma. | `## Features` |
| E2 | 기능 | 핵심 상호작용 | Interactive color selection with drag and drop functionality | `## Features` |
| E3 | 인터페이스 | 구성 및 스타일 커스텀 | Hue and alpha sliders for precise color adjustments | `## Features` |
| E4 | 사례 | 프리뷰 및 활용 패턴 | EyeDropper tool for picking colors from anywhere on screen | `icon:` |

# 밖으로
- [E1] 이 컴포넌트의 실제 TypeScript 소스코드 구현체는 `[packages/color-picker](../../../../packages/color-picker/C-index.md)`에 위치한다.
- [E2] 기본 테마 토큰 및 스타일 의존성은 `[C-setup.md](../docs/C-setup.md)`를 상속한다.

# 원문
[color-picker.mdx](../../../../../../99.archive/kiboui/apps/docs/content/components/color-picker.mdx) · [kibo-ui.com/components/color-picker](https://www.kibo-ui.com/components/color-picker)
