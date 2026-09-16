---
type: card
title: "Turborepo Pipeline Configuration"
description: "Kibo UI Turborepo 빌드 캐시, dev/lint 태스크 파이프라인 구성"
resource: "../../99.archive/kiboui/turbo.json"
timestamp: "2026-09-16"
---

# summary
Kibo UI Turborepo 빌드 캐시, dev/lint 태스크 파이프라인 구성를 다루며, Kibo UI 모노레포의 **핵심 운영 아키텍처 및 품질 규약**을 규정한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 규칙 | 빌드 파이프라인 의존성 | `build` 태스크의 패키지 선행 빌드(`^build`) 및 출력 캐시(`dist/**`) 지정 | `"build"` |
| E2 | 도구 | 린트 및 타입 검사 | `lint`, `typecheck`의 무캐시/캐시 병렬 실행 파이프라인 선언 | `"lint"` |
| E3 | 아키텍처 | 개발 서버 태스크 | `dev` 태스크의 캐시 비활성화(`cache: false`) 및 영속 프로세스(`persistent: true`) 규약 | `"dev"` |

# 밖으로
- [E1] 모노레포 내 상세 가이드는 `[apps/docs/content/docs/C-setup.md](apps/docs/content/docs/C-setup.md)`를 참조한다.
- [E2] 빌드 파이프라인의 구체적인 캐싱 정책은 `[C-turbo.md](C-turbo.md)`에서 선언된다.

# 원문
[turbo.json](../../99.archive/kiboui/turbo.json) · [kibo-ui.com](https://www.kibo-ui.com)
