---
type: index
title: "Antigravity Docs Data Pipeline"
description: "Google Antigravity 공식 문서 지식베이스 1:1 파이프라인"
resource: "../../99.archive/antigravity-docs/"
timestamp: "2026-09-02"
---

원문 출처: Local Archive (`99.archive/antigravity-docs`) / 총 6개 파일 완벽 매핑 / 카드 총 6장

# 이 지식 파이프라인은

Antigravity 2.0 SDK 및 에이전트 개발에 필수적인 공식 가이드를 구조화한 파이프라인입니다.
이 6개의 HTML 공식 문서에는 Customizations(스킬, 훅, 플러그인 등), MCP 서버 통합, 그리고 워크플로우 통제 룰 등 Document Builder 백엔드 하네스 구성 시 핵심이 되는 Antigravity SDK의 제약 사항과 모범 사례가 모두 담겨 있습니다.

# 지도

```
antigravity-docs/
├── (루트)          [공식 기술 문서 HTML 허브]       카드 6장

원문: ../../99.archive/antigravity-docs/
```

# 전체 카드

## 루트 디렉터리
- [C-best-practices.md](C-best-practices.md) — C-best-practices 공식 문서 요약 카드
- [C-features.md](C-features.md) — C-features 공식 문서 요약 카드
- [C-mcp.md](C-mcp.md) — C-mcp 공식 문서 요약 카드
- [C-reference.md](C-reference.md) — C-reference 공식 문서 요약 카드
- [C-rules-workflows.md](C-rules-workflows.md) — C-rules-workflows 공식 문서 요약 카드
- [C-skills.md](C-skills.md) — C-skills 공식 문서 요약 카드

# 가로축 — 전체를 관통하는 핵심 줄기

1. **[Customization 생태계]**
   `skills` → `rules-workflows` → `mcp` 로 이어지는 Antigravity 확장 시스템의 근간. SDK 환경에서 이 가이드라인을 따르지 않으면 훅이 동작하지 않거나 에이전트 루프가 붕괴됩니다.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 |
|---|---|
| 외부 API나 DB를 연결하는 MCP 서버를 셋업할 때 | [C-mcp.md](C-mcp.md) |
| 에이전트의 작업 지침(Skills)이나 전역 룰(Rules)을 적용해야 할 때 | [C-skills.md](C-skills.md) |
| 최고의 성능을 끌어내는 Best Practice가 필요할 때 | [C-best-practices.md](C-best-practices.md) |
