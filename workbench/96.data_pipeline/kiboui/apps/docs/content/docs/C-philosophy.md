---
type: card
title: "Kibo UI Philosophy"
description: "Composability, Simplicity, Accessibility를 관통하는 핵심 설계 철학"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs/philosophy.mdx"
timestamp: "2026-09-16"
---

# summary
Composability, Simplicity, Accessibility를 관통하는 핵심 설계 철학를 다루며, Kibo UI의 **설계 원칙과 개발자 경험(DX)을 최적화하기 위한 기술 규약**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | 합성 가능성(Composability) | 레고 블록처럼 작은 모듈을 조합해 복합 UI를 구성하는 서브컴포넌트 패턴 | `## Composability` |
| E2 | 원칙 | 단순성(Simplicity) | 최소한의 import와 직관적인 props로 개발자 인지 부하를 최소화하는 API 설계 | `## Simplicity` |
| E3 | 규칙 | 접근성(Accessibility) | Radix UI 헤드리스 프리미티브 기반 WCAG/ARIA 기본 준수 및 키보드 네비게이션 | `## Accessibility` |
| E4 | 아키텍처 | 커스터마이징 자유도 | Tailwind 유틸리티 클래스와 JSX 오버라이드를 통한 무제한 브랜드 스타일링 | `## Simplicity` |

# 밖으로
- [E1] 아키텍처 규칙은 `[C-philosophy.md](C-philosophy.md)`의 합성 가능성 원칙과 결합한다.
- ⚠️ 설정 시 누락된 의존성은 `[C-troubleshooting.md](C-troubleshooting.md)`를 즉시 참조하여 디버깅한다.

# 원문
[philosophy.mdx](../../../../../../99.archive/kiboui/apps/docs/content/docs/philosophy.mdx) · [kibo-ui.com/docs](https://www.kibo-ui.com/docs)
