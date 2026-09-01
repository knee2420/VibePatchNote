---
type: index
title: "reference"
description: "Feature-Sliced Design의 핵심 아키텍처 규약 (Layers, Public API, Slices & Segments)"
resource: "../../../99.archive/feature-sliced-design/src/content/docs/docs/reference/"
timestamp: "2026-09-01"
---

# 이 섹션은

Feature-Sliced Design 아키텍처의 **가장 기본적이고 엄격한 기술 규약(Standard Reference)**을 모아둔 구간이다.

코드베이스 전체의 위계를 결정하는 **6계층 레이어 구조(Layers)**, 모듈 내부의 은닉성과 캡슐화를 보장하는 **공개 인터페이스(Public API)**, 그리고 대형 비즈니스 도메인을 쪼개는 **슬라이스와 세그먼트(Slices & Segments)**의 정밀한 명세를 다룬다.

코드 리뷰, 폴더 구조 리팩토링, 모듈 간 의존성 문제 발생 시 가장 먼저 열람해야 하는 공식 기준점이다.

# 카드

| 카드 | 핵심 가치 (값나가는 것) | elements |
|---|---|---|
| [C-layers](C-layers.md) | 6대 계층 위계 및 상위 ➔ 하위 단방향 참조 강제 | 11 |
| [C-public-api](C-public-api.md) | 최상위 `index.ts`를 통한 캡슐화 및 심층 임포트 차단 | 6 |
| [C-slices-segments](C-slices-segments.md) | 비즈니스 슬라이스 분할 기준 및 `ui/model/lib/api` 세그먼트 구성 | 8 |
| [C-slice-groups](C-slice-groups.md) | 연관된 슬라이스를 논리적으로 묶어주는 패턴 | 3 |

# 이 섹션 밖

- 이 섹션의 `[C-layers]`와 `[C-public-api]` 규약은 상위 인덱스를 타고 올라가 `guides/` 폴더에 수록된 마이그레이션 전략의 이론적 토대가 된다.
- `shared/` 레이어에 공통 컴포넌트를 올릴 때는 반드시 별도의 `AHA_Programming` 아카이브의 섣부른 추상화 방지 규칙을 함께 고려해야 한다.
