---
type: card
title: "Root Package & Workspace Config"
description: "Kibo UI 모노레포 루트 워크스페이스 의존성 및 빌드/린트 스크립트 명세"
resource: "../../99.archive/kiboui/package.json"
timestamp: "2026-09-16"
---

# summary
Kibo UI 모노레포 루트 워크스페이스 의존성 및 빌드/린트 스크립트 명세를 다루며, Kibo UI 모노레포의 **핵심 운영 아키텍처 및 품질 규약**을 규정한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 구조 | 워크스페이스 구조 | `apps/*` 및 `packages/*`를 아우르는 pnpm 모노레포 워크스페이스 선언 | `"workspaces"` |
| E2 | 도구 | 빌드 및 품질 스크립트 | Turborepo 연계 `build`, `lint`, `typecheck`, `dev` 파이프라인 명령어 | `"scripts"` |
| E3 | 규칙 | 패키지 매니저 강제 | `pnpm@9.x` 버전 고정 및 일관된 의존성 트리 보장 규칙 | `"packageManager"` |
| E4 | 도구 | 코드 품질 도구군 | Biome, TypeScript, Changesets 기반 릴리스 자동화 도구 체인 | `"devDependencies"` |

# 밖으로
- [E1] 모노레포 내 상세 가이드는 `[apps/docs/content/docs/C-setup.md](apps/docs/content/docs/C-setup.md)`를 참조한다.
- [E2] 빌드 파이프라인의 구체적인 캐싱 정책은 `[C-turbo.md](C-turbo.md)`에서 선언된다.

# 원문
[package.json](../../99.archive/kiboui/package.json) · [kibo-ui.com](https://www.kibo-ui.com)
