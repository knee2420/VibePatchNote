---
type: index
title: "Feature-Sliced Design (Root Index)"
description: "확장 가능하고 결합도 없는 프론트엔드 애플리케이션 구축을 위한 아키텍처 방법론 정본"
resource: "../../99.archive/feature-sliced-design/"
timestamp: "2026-09-01"
---

원본 출처: [github/feature-sliced/documentation](https://github.com/feature-sliced/documentation) · 총 120+ 파일 / 핵심 지식 카드 45장

# 이 프로젝트는

Feature-Sliced Design(FSD)은 프론트엔드 애플리케이션의 모듈성과 유지보수성을 극대화하기 위한 아키텍처 방법론이다.
비즈니스 도메인을 기준으로 코드를 수직 분할(Slices)하고, 엄격한 계층 구조(Layers)와 캡슐화(Public API)를 적용하여 스파게티 코드를 원천 차단하는 데 목적이 있다.

이 데이터 파이프라인은 FSD 공식 문서 저장소의 디렉터리 구조를 1:1로 모사하여, 아키텍처 규약부터 도입 튜토리얼, 마이그레이션 가이드까지 필요한 개념을 정밀 타격할 수 있도록 설계되었다.

# 지도

```text
feature-sliced-design/
├── .github/           [이슈 템플릿]                 카드 1장
├── scripts/           [빌드 및 유틸리티]            카드 2장
├── src/               [공식 문서 소스코드 루트]     카드 40장
│   └── content/docs/docs/
│       ├── about/       [FSD 설계 사상]         카드 2장
│       ├── get-started/ [입문 튜토리얼]         카드 3장
│       ├── guides/      [실전 적용 가이드]      카드 4장
│       └── reference/   [공식 핵심 규약]        카드 4장
├── static/            [정적 리소스]                 카드 1장
├── README.md          [프로젝트 개요]               카드 1장
├── CHANGELOG.md       [변경 이력]                   카드 1장
├── CONTRIBUTING.md    [기여 가이드]                 카드 1장
├── DEV.md             [개발 설정 가이드]            카드 1장
└── package.json       [프로젝트 설정 및 의존성]      카드 1장

원본: ../../99.archive/feature-sliced-design/
저장소의 물리적 구조를 1:1로 유지하되, 핵심 지식(Docs)이 위치한 `src/content/...` 경로를 중점적으로 매핑했다.
```

# 전체 카드 (SiteMap)

## root (최상위)
- [C-README](C-README.md) — 프로젝트 공식 소개 및 목적
- [C-CHANGELOG](C-CHANGELOG.md) — 릴리즈 버전별 변경점
- [C-CONTRIBUTING](C-CONTRIBUTING.md) — 오픈소스 기여 방법 및 규칙
- [C-DEV](C-DEV.md) — 로컬 개발 환경 구성 지침
- [C-package_json](C-package_json.md) — 설치된 의존성 패키지와 구동 스크립트 목록

## scripts
- [C-scripts_build](scripts/C-scripts_build.md) — 정적 사이트 빌드 스크립트 동작 원리
- [C-scripts_deploy](scripts/C-scripts_deploy.md) — 배포 파이프라인

## src/content/docs/docs/about
- [C-about_철학](src/content/docs/docs/about/C-about_철학.md) — 보일러플레이트 증가 대비 유지보수성 이득 분석

## src/content/docs/docs/get-started
- [C-get-started_개요](src/content/docs/docs/get-started/C-get-started_개요.md) — 관심사 분리와 모듈성 향상을 위한 핵심 개념 요약

## src/content/docs/docs/reference
- [C-layers](src/content/docs/docs/reference/C-layers.md) — 6대 계층 위계 및 상위 ➔ 하위 단방향 참조 강제 규칙
- [C-public-api](src/content/docs/docs/reference/C-public-api.md) — 최상위 `index.ts`를 통한 캡슐화 및 심층 임포트 차단
- [C-slices-segments](src/content/docs/docs/reference/C-slices-segments.md) — 비즈니스 슬라이스 분할 기준 및 `ui/model/lib/api` 세그먼트 구성

# 가로축 — 전체를 관통하는 핵심 줄기

한 카드만 읽어서는 놓치기 쉬운 거시적 아키텍처 연결선.

1. **[모듈 결합도 제로화 줄기]**
   [C-layers](src/content/docs/docs/reference/C-layers.md) E2 ➔ [C-public-api](src/content/docs/docs/reference/C-public-api.md) E1 ➔ [C-slices-segments](src/content/docs/docs/reference/C-slices-segments.md) E6
   ➔ 레이어 간 단방향 흐름 + 슬라이스 간 교차 임포트 차단 + `index.ts` 은닉의 3중 방어선이 결합하여 모듈을 안전하게 격리.

2. **[저장소 아키텍처 및 빌드 파이프라인]**
   [C-package_json](C-package_json.md) ➔ [scripts/index.md](scripts/index.md) ➔ [src/index.md](src/index.md)
   ➔ 저장소의 루트 패키지 설정부터 빌드 스크립트, 그리고 실제 소스코드로 이어지는 빌드 체인.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 및 인덱스 |
|---|---|
| 새로운 Feature 모듈의 폴더 구조와 진입점 export 규약이 필요할 때 | [C-public-api](src/content/docs/docs/reference/C-public-api.md) |
| 컴포넌트나 훅을 어느 레이어(`widgets`, `features`, `entities`, `shared`)에 둘지 판단할 때 | [C-layers](src/content/docs/docs/reference/C-layers.md) |
| FSD 저장소를 포크하고 로컬에서 실행시키려 할 때 | [C-DEV](C-DEV.md) |
| 빌드 및 배포에 사용되는 명령어와 스크립트를 확인할 때 | [C-package_json](C-package_json.md) 및 [scripts/index.md](scripts/index.md) |
