---
type: card
title: "Contribution Guide"
description: "오픈소스 기여 절차, PR 작성 규칙, 모노레포 로컬 개발 환경 구동법"
resource: "../../../../../../99.archive/kiboui/apps/docs/content/docs/how-to-contribute.mdx"
timestamp: "2026-09-16"
---

# summary
오픈소스 기여 절차, PR 작성 규칙, 모노레포 로컬 개발 환경 구동법를 다루며, Kibo UI의 **설계 원칙과 개발자 경험(DX)을 최적화하기 위한 기술 규약**을 명시한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 절차 | 로컬 환경 셋업 | 저장소 클론, pnpm install, dev 서버 실행 워크플로우 | `## Local Development` |
| E2 | 규칙 | 코드 스타일 및 린트 | Biome 기반 자동 포맷팅 및 Changeset을 통한 릴리스 노트 작성 | `## Code Style` |
| E3 | 절차 | 풀 리퀘스트(PR) 규칙 | 기능 브랜치 생성, 컴포넌트 문서 작성 및 PR 템플릿 준수 요건 | `## Pull Request Process` |

# 밖으로
- [E1] 아키텍처 규칙은 `[C-philosophy.md](C-philosophy.md)`의 합성 가능성 원칙과 결합한다.
- ⚠️ 설정 시 누락된 의존성은 `[C-troubleshooting.md](C-troubleshooting.md)`를 즉시 참조하여 디버깅한다.

# 원문
[how-to-contribute.mdx](../../../../../../99.archive/kiboui/apps/docs/content/docs/how-to-contribute.mdx) · [kibo-ui.com/docs](https://www.kibo-ui.com/docs)
