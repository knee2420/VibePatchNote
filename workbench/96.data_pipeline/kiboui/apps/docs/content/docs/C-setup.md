---
type: card
title: "Kibo UI Project Setup"
description: "프로젝트 초기화, 패키지 설치, Tailwind 테마 변수 및 글로벌 CSS 설정 규약"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs/setup.mdx"
timestamp: "2026-09-16"
---

# summary
프로젝트 초기화, 패키지 설치, Tailwind 테마 변수 및 글로벌 CSS 설정 규약를 다루며, Kibo UI의 **설계 원칙과 개발자 경험(DX)을 최적화하기 위한 기술 규약**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 절차 | 전제 조건 | React 19+, Next.js 및 Tailwind CSS 기본 환경 설정 요건 | `## Prerequisites` |
| E2 | 코드 | 의존성 패키지 설치 | lucide-react, clsx, tailwind-merge 등 필수 유틸리티 라이브러리 설치 | `## Installation` |
| E3 | 규칙 | 글로벌 CSS 테마 | shadcn/ui와 동일한 HSL/OKLCH 컬러 CSS 변수 토큰 매핑 | `## Configure styles` |
| E4 | 도구 | cn 유틸리티 함수 | clsx와 twMerge를 결합한 클래스 합성 유틸리티 표준 | `## Add utility helper` |

# 밖으로
- [E1] 아키텍처 규칙은 `[C-philosophy.md](C-philosophy.md)`의 합성 가능성 원칙과 결합한다.
- ⚠️ 설정 시 누락된 의존성은 `[C-troubleshooting.md](C-troubleshooting.md)`를 즉시 참조하여 디버깅한다.

# 원문
[setup.mdx](../../../../../../99.archive/kiboui/apps/docs/content/docs/setup.mdx) · [kibo-ui.com/docs](https://www.kibo-ui.com/docs)
