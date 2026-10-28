---
type: index
title: "Kibo UI Documentation Guides"
description: "Kibo UI 아키텍처 철학, 셋업, CLI 사용법 및 기여 가이드라인 모음"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs"
timestamp: "2026-09-16"
---

# 이 섹션은

Kibo UI 공식 가이드라인의 핵심 문서 구간으로, **설계 철학(Philosophy), 프로젝트 설정(Setup), CLI 사용법(Usage), MCP AI 연동** 등 라이브러리 전체의 운영 표준을 제공한다.

# 카드

| 카드 | 핵심 가치 (값나가는 것) | elements |
|---|---|---|
| [Kibo UI Introduction](C-index.md) | Kibo UI의 정의, shadcn/ui와의 관계 및 확장 컴포넌트 생태계 개요 | 4 |
| [Kibo UI Philosophy](C-philosophy.md) | Composability, Simplicity, Accessibility를 관통하는 핵심 설계 철학 | 4 |
| [Kibo UI Project Setup](C-setup.md) | 프로젝트 초기화, 패키지 설치, Tailwind 테마 변수 및 글로벌 CSS 설정 규약 | 4 |
| [Kibo UI Usage & CLI](C-usage.md) | shadcn CLI와 Kibo 커스텀 레지스트리를 통한 컴포넌트 추가 및 활용법 | 3 |
| [Model Context Protocol (MCP) Integration](C-mcp.md) | AI 코딩 어시스턴트에게 Kibo UI 컴포넌트 명세와 지식을 직접 주입하는 MCP 프로토콜 | 3 |
| [Kibo UI Core Benefits](C-benefits.md) | 개발 속도 가속화, 접근성 보장, 코드 소유권 확보의 실질적 이점 | 3 |
| [Authoring New Components](C-new-components.md) | 새로운 복합 위젯을 제작할 때 준수해야 할 구조, 네이밍, Props 컨벤션 | 3 |
| [Contribution Guide](C-how-to-contribute.md) | 오픈소스 기여 절차, PR 작성 규칙, 모노레포 로컬 개발 환경 구동법 | 3 |
| [Troubleshooting & Common Issues](C-troubleshooting.md) | Tailwind 변수 누락, React 19 호환성, 하이드레이션 오류 해결 가이드 | 3 |
| [Community & Support](C-community.md) | GitHub Discussions, Discord, 이슈 트래킹 채널 및 피드백 루프 | 3 |

# 이 섹션 밖

- [선행 조건: 루트 환경 구성] `[C-package.md](../../../../C-package.md)`에서 pnpm 모노레포 워크스페이스 구조를 먼저 파악한다.
- [후속 연결: 컴포넌트 스펙] 본 가이드의 설정을 마친 후 `[components/index.md](../components/index.md)`의 개별 위젯 명세를 참조한다.
