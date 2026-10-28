---
type: card
title: "typography Core Stylesheet"
description: "Kibo UI 전역 타이포그래피(Heading, Body, Code, List) CSS 스타일 시트 명세"
resource: "../../../../99.archive/kiboui/packages/typography/styles.css"
timestamp: "2026-09-16"
---

# summary
Kibo UI `typography` 패키지의 **실제 프로덕션 구현체(`styles.css`)**로, Typography 렌더러와 CSS Classes 인터페이스를 제공한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | 타이포그래피 스타일 규약 | Heading(h1~h4), 본문(p), 인용구(blockquote) 표준 폰트 및 행간 정의 | `.typography` |
| E2 | 구조 | 코드 블록 및 인라인 코드 | 인라인 code 및 pre 블록의 모노스페이스 폰트 패밀리 및 패딩 규약 | `code` |
| E3 | 규칙 | 리스트 및 링크 스타일 | ul, ol 목록 기호 및 하이퍼링크 밑줄/호버 마이크로 인터랙션 스타일 | `ul` |
| E4 | 아키텍처 | Tailwind 타이포그래피 확장 | shadcn/ui 디자인 토큰과 완벽 결합되는 prose 스타일 시트 | `@layer` |

# 밖으로
- [E1, E2] 이 컴포넌트의 사용 예시와 프리뷰 명세는 `[C-typography.md](../../apps/docs/content/components/C-typography.md)`에서 확인한다.
- [E4] 스타일링의 기반이 되는 Tailwind CSS 변수 테마는 `[C-setup.md](../../apps/docs/content/docs/C-setup.md)`를 참조한다.

# 원문
[styles.css](../../../../99.archive/kiboui/packages/typography/styles.css)
