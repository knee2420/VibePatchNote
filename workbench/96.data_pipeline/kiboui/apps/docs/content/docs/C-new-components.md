---
type: card
title: "Authoring New Components"
description: "새로운 복합 위젯을 제작할 때 준수해야 할 구조, 네이밍, Props 컨벤션"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs/new-components.mdx"
timestamp: "2026-09-16"
---

# summary
새로운 복합 위젯을 제작할 때 준수해야 할 구조, 네이밍, Props 컨벤션를 다루며, Kibo UI의 **설계 원칙과 개발자 경험(DX)을 최적화하기 위한 기술 규약**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | 컴포넌트 설계 가이드 | Radix Primitives 래핑 및 독립적인 책임 분리를 위한 모듈 구조 | `## Component Structure` |
| E2 | 인터페이스 | Props 및 타입 규약 | 표준 HTML 속성 확장(`ComponentProps`) 및 cva variant 인터페이스 선언 | `## Props and Types` |
| E3 | 규칙 | 접근성 및 키보드 지원 | ARIA 속성 매핑 및 포커스 트랩, 키보드 인터랙션 필수 구현 요건 | `## Accessibility` |

# 밖으로
- [E1] 아키텍처 규칙은 `[C-philosophy.md](C-philosophy.md)`의 합성 가능성 원칙과 결합한다.
- ⚠️ 설정 시 누락된 의존성은 `[C-troubleshooting.md](C-troubleshooting.md)`를 즉시 참조하여 디버깅한다.

# 원문
[new-components.mdx](../../../../../../99.archive/kiboui/apps/docs/content/docs/new-components.mdx) · [kibo-ui.com/docs](https://www.kibo-ui.com/docs)
