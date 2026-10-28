---
type: card
title: "Kibo UI Usage & CLI"
description: "shadcn CLI와 Kibo 커스텀 레지스트리를 통한 컴포넌트 추가 및 활용법"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs/usage.mdx"
timestamp: "2026-09-16"
---

# summary
shadcn CLI와 Kibo 커스텀 레지스트리를 통한 컴포넌트 추가 및 활용법를 다루며, Kibo UI의 **설계 원칙과 개발자 경험(DX)을 최적화하기 위한 기술 규약**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | CLI 컴포넌트 추가 | `npx shadcn add` 명령어를 사용한 단일 위젯 다운로드 및 코드 소유권 확보 | `## Using the CLI` |
| E2 | 절차 | 수동 설치 방식 | 패키지 소스코드를 직접 복사하여 로컬 컴포넌트 디렉터리에 배치하는 절차 | `## Manual Installation` |
| E3 | 규칙 | 컴포넌트 임포트 규약 | 프로젝트 로컬 경로(`@/components/ui/*`)를 통한 투명한 import 경로 유지 | `## Usage` |

# 밖으로
- [E1] 아키텍처 규칙은 `[C-philosophy.md](C-philosophy.md)`의 합성 가능성 원칙과 결합한다.
- ⚠️ 설정 시 누락된 의존성은 `[C-troubleshooting.md](C-troubleshooting.md)`를 즉시 참조하여 디버깅한다.

# 원문
[usage.mdx](../../../../../../99.archive/kiboui/apps/docs/content/docs/usage.mdx) · [kibo-ui.com/docs](https://www.kibo-ui.com/docs)
