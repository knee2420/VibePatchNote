---
type: card
title: "Turborepo Pipeline Config"
description: "Turborepo 캐시 및 태스크 의존성 파이프라인 설정"
resource: "../../99.archive/originui/turbo.json"
timestamp: "2026-09-06"
---

# summary
빌드, 린트, 테스트 태스크의 출력 디렉토리와 환경변수 의존성을 정의한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Build Pipeline | 의존 패키지 선행 빌드 및 .next/dist 캐싱 규칙 | `build` |
| E2 | 규칙 | Lint & Check Pipeline | 캐시 가능한 정적 분석 태스크 체인 | `lint` |
| E3 | 도구 | Global Env Passthrough | 태스크 실행 시 주입되는 전역 환경변수 목록 | `globalEnv` |

# 밖으로
- 관련 설정은 [C-package.md](C-package.md)와 연계된다.

# 원문
[turbo.json](../../99.archive/originui/turbo.json)
