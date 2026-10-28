---
type: card
title: "Root Package Config"
description: "모노레포 루트 패키지 설정 및 워크스페이스 스크립트"
resource: "../../99.archive/originui/package.json"
timestamp: "2026-09-06"
---

# summary
Turborepo 기반의 빌드, 린트, 포맷팅, 개발 서버 통합 명령어를 정의한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Workspace Scripts | pnpm/bun 기반의 dev, build, lint 파이프라인 명령어 | `scripts` |
| E2 | 참조 | Package Dependencies | 모노레포 전역 빌드 도구 및 Turborepo 버전 의존성 | `devDependencies` |
| E3 | 구조 | Package Workspaces | apps/* 및 packages/* 워크스페이스 패키지 선언 | `workspaces` |

# 밖으로
- 관련 설정은 [C-package.md](C-package.md)와 연계된다.

# 원문
[package.json](../../99.archive/originui/package.json)
