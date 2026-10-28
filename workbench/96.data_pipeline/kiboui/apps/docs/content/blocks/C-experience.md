---
type: card
title: "Experience Block Spec"
description: "A component listing experiences with download CV button, 3-column layout for period, title/description, and company."
resource: "../../../../../../99.archive/kiboui/apps/docs/content/blocks/experience.mdx"
timestamp: "2026-09-16"
---

# summary
A component listing experiences with download CV button, 3-column layout for period, title/description, and company.로, 여러 개의 기초 컴포넌트를 조립하여 **단일 페이지 섹션을 완성형으로 제공하는 블록 스펙**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | experience 블록 역할 | A component listing experiences with download CV button, 3-column layout for period, title/description, and company. | `title:` |
| E2 | 구조 | 컴포넌트 의존성 결합 | 하위 Kibo UI 위젯들을 합성하여 완성된 experience 섹션을 구축하는 구조 | `dependencies:` |
| E3 | 도구 | CLI 설치 명세 | `npx shadcn add @kibo-ui/experience` 기반 원클릭 블록 다운로드 규약 | `installer:` |

# 밖으로
- [E2] 이 블록을 구성하는 기초 위젯들은 `[components/index.md](../components/index.md)`의 개별 스펙을 따른다.

# 원문
[experience.mdx](../../../../../../99.archive/kiboui/apps/docs/content/blocks/experience.mdx) · [kibo-ui.com/blocks/experience](https://www.kibo-ui.com/blocks/experience)
