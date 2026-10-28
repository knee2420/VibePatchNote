---
type: card
title: "Troubleshooting & Common Issues"
description: "Tailwind 변수 누락, React 19 호환성, 하이드레이션 오류 해결 가이드"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs/troubleshooting.mdx"
timestamp: "2026-09-16"
---

# summary
Tailwind 변수 누락, React 19 호환성, 하이드레이션 오류 해결 가이드를 다루며, Kibo UI의 **설계 원칙과 개발자 경험(DX)을 최적화하기 위한 기술 규약**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 안티패턴 | 스타일 깨짐 현상 | Tailwind CSS 변수 및 postcss 플러그인 미설정으로 인한 스타일 누락 복구 | `## Styling Issues` |
| E2 | 안티패턴 | 클라이언트 컴포넌트 에러 | Next.js App Router에서 `"use client"` 누락 시 발생하는 훅 에러 해결 | `## Client Component Issues` |
| E3 | 규칙 | 패키지 버전 충돌 | peerDependencies(React 19, Radix) 버전 불일치 해결 전략 | `## Dependency Issues` |

# 밖으로
- [E1] 아키텍처 규칙은 `[C-philosophy.md](C-philosophy.md)`의 합성 가능성 원칙과 결합한다.
- ⚠️ 설정 시 누락된 의존성은 `[C-troubleshooting.md](C-troubleshooting.md)`를 즉시 참조하여 디버깅한다.

# 원문
[troubleshooting.mdx](../../../../../../99.archive/kiboui/apps/docs/content/docs/troubleshooting.mdx) · [kibo-ui.com/docs](https://www.kibo-ui.com/docs)
