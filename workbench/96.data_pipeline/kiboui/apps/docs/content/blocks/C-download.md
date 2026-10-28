---
type: card
title: "Download Block Spec"
description: "A component displaying download options for desktop, iOS, and Android, alongside descriptions and buttons/links for each platform, arranged in a three-column layout."
resource: "../../../../../../99.archive/kiboui/apps/docs/content/blocks/download.mdx"
timestamp: "2026-09-16"
---

# summary
A component displaying download options for desktop, iOS, and Android, alongside descriptions and buttons/links for each platform, arranged in a three-column layout.로, 여러 개의 기초 컴포넌트를 조립하여 **단일 페이지 섹션을 완성형으로 제공하는 블록 스펙**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | download 블록 역할 | A component displaying download options for desktop, iOS, and Android, alongside descriptions and buttons/links for each platform, arranged in a three-column layout. | `title:` |
| E2 | 구조 | 컴포넌트 의존성 결합 | 하위 Kibo UI 위젯들을 합성하여 완성된 download 섹션을 구축하는 구조 | `dependencies:` |
| E3 | 도구 | CLI 설치 명세 | `npx shadcn add @kibo-ui/download` 기반 원클릭 블록 다운로드 규약 | `installer:` |

# 밖으로
- [E2] 이 블록을 구성하는 기초 위젯들은 `[components/index.md](../components/index.md)`의 개별 스펙을 따른다.

# 원문
[download.mdx](../../../../../../99.archive/kiboui/apps/docs/content/blocks/download.mdx) · [kibo-ui.com/blocks/download](https://www.kibo-ui.com/blocks/download)
