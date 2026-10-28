---
type: card
title: "Kibo UI Introduction"
description: "Kibo UI의 정의, shadcn/ui와의 관계 및 확장 컴포넌트 생태계 개요"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs/index.mdx"
timestamp: "2026-09-16"
---

# summary
Kibo UI의 정의, shadcn/ui와의 관계 및 확장 컴포넌트 생태계 개요를 다루며, Kibo UI의 **설계 원칙과 개발자 경험(DX)을 최적화하기 위한 기술 규약**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Kibo UI의 본질 | shadcn/ui 기반의 합성 가능하고 접근성 높은 오픈소스 컴포넌트 생태계 | `## What is Kibo UI?` |
| E2 | 구조 | shadcn/ui 연계성 | 동일한 Tailwind CSS CSS 변수 테마 시스템을 공유하며 고수준 위젯 확장 | `## How does it relate to shadcn/ui?` |
| E3 | 규칙 | 대상 및 적용성 | 스타트업 및 디자인 시스템 구축 시 보일러플레이트 제거 및 비즈니스 로직 집중 | `## Who is Kibo UI for?` |
| E4 | 참조 | 블록 생태계 | 단순 컴포넌트를 넘어 앱 전체 섹션을 조립하는 빌딩 블록 아키텍처 | `## How does it relate to shadcn/ui?` |

# 밖으로
- [E1] 아키텍처 규칙은 `[C-philosophy.md](C-philosophy.md)`의 합성 가능성 원칙과 결합한다.
- ⚠️ 설정 시 누락된 의존성은 `[C-troubleshooting.md](C-troubleshooting.md)`를 즉시 참조하여 디버깅한다.

# 원문
[index.mdx](../../../../../../99.archive/kiboui/apps/docs/content/docs/index.mdx) · [kibo-ui.com/docs](https://www.kibo-ui.com/docs)
