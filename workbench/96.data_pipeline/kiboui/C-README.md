---
type: card
title: "Kibo UI Overview & Architecture"
description: "shadcn/ui 기반 고밀도 확장 컴포넌트 라이브러리 및 커스텀 레지스트리 개요"
resource: "../../99.archive/kiboui/README.md"
timestamp: "2026-09-16"
---

# summary
shadcn/ui 기반 고밀도 확장 컴포넌트 라이브러리 및 커스텀 레지스트리 개요를 다루며, Kibo UI 모노레포의 **핵심 운영 아키텍처 및 품질 규약**을 규정한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Kibo UI 정체성 | shadcn/ui 기반 확장 컴포넌트 레지스트리 및 모던 UI 생태계 정의 | `## What is Kibo UI?` |
| E2 | 원칙 | 실전 위젯 제공 | 단순 디자인 껍데기가 아닌 동작 가능한 복합 상호작용 컴포넌트 공급 원칙 | `## Features` |
| E3 | 도구 | 설치 및 사용성 | shadcn CLI 및 전용 레지스트리를 통한 컴포넌트 직접 소유권(Copy & Paste) 방식 | `## Installation` |
| E4 | 참조 | 라이선스 및 생태계 | Apache-2.0 오픈소스 라이선스 및 커뮤니티 기여 모델 | `## License` |

# 밖으로
- [E1] 모노레포 내 상세 가이드는 `[apps/docs/content/docs/C-setup.md](apps/docs/content/docs/C-setup.md)`를 참조한다.
- [E2] 빌드 파이프라인의 구체적인 캐싱 정책은 `[C-turbo.md](C-turbo.md)`에서 선언된다.

# 원문
[README.md](../../99.archive/kiboui/README.md) · [kibo-ui.com](https://www.kibo-ui.com)
