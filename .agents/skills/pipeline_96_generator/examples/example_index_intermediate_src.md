---
type: index
title: "src"
description: "FSD 저장소의 핵심 소스코드 및 문서 루트 폴더"
resource: "../../../99.archive/feature-sliced-design/src/"
timestamp: "2026-09-01"
---

# 이 섹션은

이 디렉터리는 FSD 공식 문서 사이트의 실제 소스코드와 마크다운 콘텐츠가 위치하는 가장 핵심적인 진입점이다.
이곳 자체에는 구체적인 지식 카드가 많지 않으나, 목적에 따라 하위 디렉터리로 분기(Routing)하는 중계 역할을 수행한다.

# 디렉터리 (하위 인덱스로 연결)

- [content 폴더](content/index.md) — 실제 FSD 가이드, 레퍼런스, 튜토리얼 마크다운 문서들
- [pages 폴더](pages/index.md) — Astro 프레임워크 기반의 페이지 라우팅 컴포넌트
- [shared 폴더](shared/index.md) — 사이트 구축에 사용된 공통 UI 컴포넌트 및 유틸
- [styles 폴더](styles/index.md) — 전역 CSS 및 스타일링

# 현재 폴더의 지식 카드

| 카드 | 핵심 가치 (값나가는 것) | elements |
|---|---|---|
| [C-content.config](C-content.config.md) | Astro content collection 스키마 설정 | 2 |

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 하위 인덱스 |
|---|---|
| FSD 아키텍처 규약과 가이드라인 문서를 읽고 싶을 때 | [content/index.md](content/index.md) |
| 문서 사이트의 UI 구현체(Astro 컴포넌트)를 볼 때 | [pages/index.md](pages/index.md) 또는 [shared/index.md](shared/index.md) |
