---
type: card
title: "FSD 6대 레이어 구조와 단방향 의존성 (layers)"
description: "app, pages, widgets, features, entities, shared 6계층 정의 및 상위->하위 단방향 참조 원칙"
resource: "../../../99.archive/feature-sliced-design/src/content/docs/docs/reference/layers.mdx"
timestamp: "2026-09-01"
---

# summary
프론트엔드 코드베이스의 비대화와 순환 참조를 방지하기 위해, **책임과 변경 주기에 따라 6개 표준 레이어로 분할하고 상위 계층은 오직 하위 계층만을 참조(단방향 의존성)**하도록 강제하는 아키텍처 원칙을 다룬다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | 6대 표준 계층 | `app > pages > widgets > features > entities > shared` 위계 구조 정의 | `## Overview` |
| E2 | 규칙 | 단방향 의존성 | 모듈은 오직 자신보다 물리적으로 아래에 위치한 레이어만 import 가능 | `## Layer Hierarchy and Direction` |
| E3 | 안티패턴 | 역방향 참조 금지 | `entities`가 `features`를 import하거나 `shared`가 상위 레이어를 참조하는 행위 절대 차단 | `## Forbidden Dependencies` |
| E4 | 정의 | app 레이어 | 전역 프로바이더, 라우터, 글로벌 스타일, 진입점 설정 담당 | `## Layer: App` |
| E5 | 정의 | pages 레이어 | 실제 라우트와 매핑되는 페이지 컴포넌트, 하위 레이어의 조합체 | `## Layer: Pages` |
| E6 | 정의 | widgets 레이어 | 독립적으로 완결된 대형 UI 블록 (예: Header, Sidebar, Feed) | `## Layer: Widgets` |
| E7 | 정의 | features 레이어 | 비즈니스 가치를 지닌 사용자 인터랙션 단위 (예: AuthByEmail, AddToCart) | `## Layer: Features` |
| E8 | 정의 | entities 레이어 | 비즈니스 핵심 도메인 모델 및 상태 (예: User, Product, Article) | `## Layer: Entities` |
| E9 | 정의 | shared 레이어 | 특정 도메인에 종속되지 않는 재사용 가능 UI 킷(ShadCN), 유틸, API 클라이언트 | `## Layer: Shared` |
| E10 | 규칙 | 동일 계층 격리 | 같은 레이어 내 슬라이스 간 교차 import 금지 (Composition으로 상위에서 결합) | `## Cross-Slice Rule` |
| E11 | 절차 | 점진적 도입 | 기존 프로젝트에서 `shared` ➔ `entities` ➔ `features` 순서로 상향식 정리 | `## Migration Strategy` |

# 밖으로
- [E1, E2] 단방향 원칙은 `[C-public-api](C-public-api.md)`와 결합하여 파일 단위의 격리를 완성한다.
- [E9] `shared` 레이어의 과도한 비대화를 막기 위해 섣부른 추상화 방지 룰을 별도의 아카이브에서 참조한다.

# 원문
[FSD Layers 원본](../../../99.archive/feature-sliced-design/src/content/docs/docs/reference/layers.mdx) · [공식 사이트](https://feature-sliced.design/docs/reference/layers)
