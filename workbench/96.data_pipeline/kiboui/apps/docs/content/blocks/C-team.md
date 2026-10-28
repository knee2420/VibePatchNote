---
type: card
title: "Team Block Spec"
description: "A team showcase block with a title, description, and a responsive grid of team member avatars, names, and roles."
resource: "../../../../../../99.archive/kiboui/apps/docs/content/blocks/team.mdx"
timestamp: "2026-09-16"
---

# summary
A team showcase block with a title, description, and a responsive grid of team member avatars, names, and roles.로, 여러 개의 기초 컴포넌트를 조립하여 **단일 페이지 섹션을 완성형으로 제공하는 블록 스펙**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | team 블록 역할 | A team showcase block with a title, description, and a responsive grid of team member avatars, names, and roles. | `title:` |
| E2 | 구조 | 컴포넌트 의존성 결합 | 하위 Kibo UI 위젯들을 합성하여 완성된 team 섹션을 구축하는 구조 | `dependencies:` |
| E3 | 도구 | CLI 설치 명세 | `npx shadcn add @kibo-ui/team` 기반 원클릭 블록 다운로드 규약 | `installer:` |

# 밖으로
- [E2] 이 블록을 구성하는 기초 위젯들은 `[components/index.md](../components/index.md)`의 개별 스펙을 따른다.

# 원문
[team.mdx](../../../../../../99.archive/kiboui/apps/docs/content/blocks/team.mdx) · [kibo-ui.com/blocks/team](https://www.kibo-ui.com/blocks/team)
