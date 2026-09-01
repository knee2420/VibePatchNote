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
- [C-.gitattributes](C-.gitattributes.md) — .gitattributes 카드
- [C-.gitignore](C-.gitignore.md) — .gitignore 카드
- [C-.prettierignore](C-.prettierignore.md) — .prettierignore 카드
- [C-.prettierrc](C-.prettierrc.md) — .prettierrc 카드
- [C-CHANGELOG](C-CHANGELOG.md) — CHANGELOG 카드
- [C-CODE_OF_CONDUCT](C-CODE_OF_CONDUCT.md) — CODE_OF_CONDUCT 카드
- [C-CODE_OF_CONDUCT.ru](C-CODE_OF_CONDUCT.ru.md) — CODE_OF_CONDUCT.ru 카드
- [C-CONTRIBUTING](C-CONTRIBUTING.md) — CONTRIBUTING 카드
- [C-DEV](C-DEV.md) — DEV 카드
- [C-LICENSE](C-LICENSE.md) — LICENSE 카드
- [C-README](C-README.md) — README 카드
- [C-astro.config](C-astro.config.md) — astro.config 카드
- [C-eslint.config](C-eslint.config.md) — eslint.config 카드
- [C-lunaria.config](C-lunaria.config.md) — lunaria.config 카드
- [C-package](C-package.md) — package 카드
- [C-pnpm-lock](C-pnpm-lock.md) — pnpm-lock 카드
- [C-pnpm-workspace](C-pnpm-workspace.md) — pnpm-workspace 카드
- [C-tsconfig.astro](C-tsconfig.astro.md) — tsconfig.astro 카드
- [C-tsconfig](C-tsconfig.md) — tsconfig 카드

## .github
- [C-CODEOWNERS](.github/C-CODEOWNERS.md) — CODEOWNERS 카드
- [C-FUNDING](.github/C-FUNDING.md) — FUNDING 카드
- [C-pull_request_template](.github/C-pull_request_template.md) — pull_request_template 카드

## .github/workflows
- [C-build-preview](.github/workflows/C-build-preview.md) — build-preview 카드
- [C-deploy-preview](.github/workflows/C-deploy-preview.md) — deploy-preview 카드
- [C-deploy](.github/workflows/C-deploy.md) — deploy 카드
- [C-testing](.github/workflows/C-testing.md) — testing 카드

## .vscode
- [C-extensions](.vscode/C-extensions.md) — extensions 카드
- [C-settings](.vscode/C-settings.md) — settings 카드

## scripts
- [C-generate-og-background](scripts/C-generate-og-background.md) — generate-og-background 카드

## src
- [C-content.config](src/C-content.config.md) — content.config 카드

## src/content/docs
- [C-index](src/content/docs/C-index.md) — index 카드

## src/content/docs/docs
- [C-branding](src/content/docs/docs/C-branding.md) — branding 카드
- [C-llms](src/content/docs/docs/C-llms.md) — llms 카드

## src/content/docs/docs/about
- [C-alternatives](src/content/docs/docs/about/C-alternatives.md) — alternatives 카드
- [C-mission](src/content/docs/docs/about/C-mission.md) — mission 카드
- [C-motivation](src/content/docs/docs/about/C-motivation.md) — motivation 카드

## src/content/docs/docs/about/promote
- [C-for-company](src/content/docs/docs/about/promote/C-for-company.md) — for-company 카드
- [C-for-team](src/content/docs/docs/about/promote/C-for-team.md) — for-team 카드
- [C-integration](src/content/docs/docs/about/promote/C-integration.md) — integration 카드
- [C-partial-application](src/content/docs/docs/about/promote/C-partial-application.md) — partial-application 카드

## src/content/docs/docs/about/understanding
- [C-abstractions](src/content/docs/docs/about/understanding/C-abstractions.md) — abstractions 카드
- [C-architecture](src/content/docs/docs/about/understanding/C-architecture.md) — architecture 카드
- [C-knowledge-types](src/content/docs/docs/about/understanding/C-knowledge-types.md) — knowledge-types 카드
- [C-naming](src/content/docs/docs/about/understanding/C-naming.md) — naming 카드
- [C-needs-driven](src/content/docs/docs/about/understanding/C-needs-driven.md) — needs-driven 카드
- [C-signals](src/content/docs/docs/about/understanding/C-signals.md) — signals 카드

## src/content/docs/docs/get-started
- [C-faq](src/content/docs/docs/get-started/C-faq.md) — faq 카드
- [C-overview](src/content/docs/docs/get-started/C-overview.md) — overview 카드
- [C-tutorial](src/content/docs/docs/get-started/C-tutorial.md) — tutorial 카드

## src/content/docs/docs/guides/examples
- [C-api-requests](src/content/docs/docs/guides/examples/C-api-requests.md) — api-requests 카드
- [C-auth](src/content/docs/docs/guides/examples/C-auth.md) — auth 카드
- [C-handling-assets](src/content/docs/docs/guides/examples/C-handling-assets.md) — handling-assets 카드
- [C-page-layout](src/content/docs/docs/guides/examples/C-page-layout.md) — page-layout 카드
- [C-types](src/content/docs/docs/guides/examples/C-types.md) — types 카드

## src/content/docs/docs/guides/issues
- [C-cross-imports](src/content/docs/docs/guides/issues/C-cross-imports.md) — cross-imports 카드
- [C-desegmented](src/content/docs/docs/guides/issues/C-desegmented.md) — desegmented 카드
- [C-excessive-entities](src/content/docs/docs/guides/issues/C-excessive-entities.md) — excessive-entities 카드

## src/content/docs/docs/guides/migration
- [C-from-custom](src/content/docs/docs/guides/migration/C-from-custom.md) — from-custom 카드
- [C-from-v1](src/content/docs/docs/guides/migration/C-from-v1.md) — from-v1 카드
- [C-from-v2-0](src/content/docs/docs/guides/migration/C-from-v2-0.md) — from-v2-0 카드

## src/content/docs/docs/guides/tech
- [C-with-astro](src/content/docs/docs/guides/tech/C-with-astro.md) — with-astro 카드
- [C-with-electron](src/content/docs/docs/guides/tech/C-with-electron.md) — with-electron 카드
- [C-with-nextjs](src/content/docs/docs/guides/tech/C-with-nextjs.md) — with-nextjs 카드
- [C-with-nuxtjs](src/content/docs/docs/guides/tech/C-with-nuxtjs.md) — with-nuxtjs 카드
- [C-with-react-query](src/content/docs/docs/guides/tech/C-with-react-query.md) — with-react-query 카드
- [C-with-sveltekit](src/content/docs/docs/guides/tech/C-with-sveltekit.md) — with-sveltekit 카드

## src/content/docs/docs/reference
- [C-layers](src/content/docs/docs/reference/C-layers.md) — layers 카드
- [C-public-api](src/content/docs/docs/reference/C-public-api.md) — public-api 카드
- [C-slice-groups](src/content/docs/docs/reference/C-slice-groups.md) — slice-groups 카드
- [C-slices-segments](src/content/docs/docs/reference/C-slices-segments.md) — slices-segments 카드

## src/content/docs/ja/docs
- [C-branding](src/content/docs/ja/docs/C-branding.md) — branding 카드

## src/content/docs/ja/docs/about
- [C-alternatives](src/content/docs/ja/docs/about/C-alternatives.md) — alternatives 카드
- [C-mission](src/content/docs/ja/docs/about/C-mission.md) — mission 카드
- [C-motivation](src/content/docs/ja/docs/about/C-motivation.md) — motivation 카드

## src/content/docs/ja/docs/about/promote
- [C-integration](src/content/docs/ja/docs/about/promote/C-integration.md) — integration 카드

## src/content/docs/ja/docs/about/understanding
- [C-abstractions](src/content/docs/ja/docs/about/understanding/C-abstractions.md) — abstractions 카드
- [C-architecture](src/content/docs/ja/docs/about/understanding/C-architecture.md) — architecture 카드
- [C-knowledge-types](src/content/docs/ja/docs/about/understanding/C-knowledge-types.md) — knowledge-types 카드
- [C-naming](src/content/docs/ja/docs/about/understanding/C-naming.md) — naming 카드
- [C-needs-driven](src/content/docs/ja/docs/about/understanding/C-needs-driven.md) — needs-driven 카드

## src/content/docs/ja/docs/get-started
- [C-faq](src/content/docs/ja/docs/get-started/C-faq.md) — faq 카드
- [C-overview](src/content/docs/ja/docs/get-started/C-overview.md) — overview 카드
- [C-tutorial](src/content/docs/ja/docs/get-started/C-tutorial.md) — tutorial 카드

## src/content/docs/ja/docs/guides/examples
- [C-auth](src/content/docs/ja/docs/guides/examples/C-auth.md) — auth 카드
- [C-page-layout](src/content/docs/ja/docs/guides/examples/C-page-layout.md) — page-layout 카드
- [C-types](src/content/docs/ja/docs/guides/examples/C-types.md) — types 카드

## src/content/docs/ja/docs/guides/migration
- [C-from-custom](src/content/docs/ja/docs/guides/migration/C-from-custom.md) — from-custom 카드
- [C-from-v1](src/content/docs/ja/docs/guides/migration/C-from-v1.md) — from-v1 카드
- [C-from-v2-0](src/content/docs/ja/docs/guides/migration/C-from-v2-0.md) — from-v2-0 카드

## src/content/docs/ja/docs/guides/tech
- [C-with-nextjs](src/content/docs/ja/docs/guides/tech/C-with-nextjs.md) — with-nextjs 카드
- [C-with-nuxtjs](src/content/docs/ja/docs/guides/tech/C-with-nuxtjs.md) — with-nuxtjs 카드
- [C-with-react-query](src/content/docs/ja/docs/guides/tech/C-with-react-query.md) — with-react-query 카드
- [C-with-sveltekit](src/content/docs/ja/docs/guides/tech/C-with-sveltekit.md) — with-sveltekit 카드

## src/content/docs/ja/docs/reference
- [C-layers](src/content/docs/ja/docs/reference/C-layers.md) — layers 카드
- [C-public-api](src/content/docs/ja/docs/reference/C-public-api.md) — public-api 카드
- [C-slices-segments](src/content/docs/ja/docs/reference/C-slices-segments.md) — slices-segments 카드

## src/content/docs/kr/docs/about
- [C-mission](src/content/docs/kr/docs/about/C-mission.md) — mission 카드
- [C-motivation](src/content/docs/kr/docs/about/C-motivation.md) — motivation 카드

## src/content/docs/kr/docs/about/understanding
- [C-architecture](src/content/docs/kr/docs/about/understanding/C-architecture.md) — architecture 카드
- [C-knowledge-types](src/content/docs/kr/docs/about/understanding/C-knowledge-types.md) — knowledge-types 카드
- [C-naming](src/content/docs/kr/docs/about/understanding/C-naming.md) — naming 카드
- [C-needs-driven](src/content/docs/kr/docs/about/understanding/C-needs-driven.md) — needs-driven 카드

## src/content/docs/kr/docs/get-started
- [C-faq](src/content/docs/kr/docs/get-started/C-faq.md) — faq 카드
- [C-overview](src/content/docs/kr/docs/get-started/C-overview.md) — overview 카드
- [C-tutorial](src/content/docs/kr/docs/get-started/C-tutorial.md) — tutorial 카드

## src/content/docs/kr/docs/guides/examples
- [C-api-requests](src/content/docs/kr/docs/guides/examples/C-api-requests.md) — api-requests 카드
- [C-auth](src/content/docs/kr/docs/guides/examples/C-auth.md) — auth 카드
- [C-handling-assets](src/content/docs/kr/docs/guides/examples/C-handling-assets.md) — handling-assets 카드
- [C-page-layout](src/content/docs/kr/docs/guides/examples/C-page-layout.md) — page-layout 카드
- [C-types](src/content/docs/kr/docs/guides/examples/C-types.md) — types 카드

## src/content/docs/kr/docs/guides/issues
- [C-cross-imports](src/content/docs/kr/docs/guides/issues/C-cross-imports.md) — cross-imports 카드
- [C-desegmented](src/content/docs/kr/docs/guides/issues/C-desegmented.md) — desegmented 카드
- [C-excessive-entities](src/content/docs/kr/docs/guides/issues/C-excessive-entities.md) — excessive-entities 카드

## src/content/docs/kr/docs/guides/migration
- [C-from-custom](src/content/docs/kr/docs/guides/migration/C-from-custom.md) — from-custom 카드
- [C-from-v1](src/content/docs/kr/docs/guides/migration/C-from-v1.md) — from-v1 카드
- [C-from-v2-0](src/content/docs/kr/docs/guides/migration/C-from-v2-0.md) — from-v2-0 카드

## src/content/docs/kr/docs/guides/tech
- [C-with-astro](src/content/docs/kr/docs/guides/tech/C-with-astro.md) — with-astro 카드
- [C-with-electron](src/content/docs/kr/docs/guides/tech/C-with-electron.md) — with-electron 카드
- [C-with-nextjs](src/content/docs/kr/docs/guides/tech/C-with-nextjs.md) — with-nextjs 카드
- [C-with-nuxtjs](src/content/docs/kr/docs/guides/tech/C-with-nuxtjs.md) — with-nuxtjs 카드
- [C-with-react-query](src/content/docs/kr/docs/guides/tech/C-with-react-query.md) — with-react-query 카드
- [C-with-sveltekit](src/content/docs/kr/docs/guides/tech/C-with-sveltekit.md) — with-sveltekit 카드

## src/content/docs/kr/docs/reference
- [C-layers](src/content/docs/kr/docs/reference/C-layers.md) — layers 카드
- [C-public-api](src/content/docs/kr/docs/reference/C-public-api.md) — public-api 카드
- [C-slice-groups](src/content/docs/kr/docs/reference/C-slice-groups.md) — slice-groups 카드
- [C-slices-segments](src/content/docs/kr/docs/reference/C-slices-segments.md) — slices-segments 카드

## src/content/docs/ru/docs
- [C-branding](src/content/docs/ru/docs/C-branding.md) — branding 카드
- [C-llms](src/content/docs/ru/docs/C-llms.md) — llms 카드

## src/content/docs/ru/docs/about
- [C-alternatives](src/content/docs/ru/docs/about/C-alternatives.md) — alternatives 카드
- [C-mission](src/content/docs/ru/docs/about/C-mission.md) — mission 카드
- [C-motivation](src/content/docs/ru/docs/about/C-motivation.md) — motivation 카드

## src/content/docs/ru/docs/about/promote
- [C-for-company](src/content/docs/ru/docs/about/promote/C-for-company.md) — for-company 카드
- [C-for-team](src/content/docs/ru/docs/about/promote/C-for-team.md) — for-team 카드
- [C-integration](src/content/docs/ru/docs/about/promote/C-integration.md) — integration 카드
- [C-partial-application](src/content/docs/ru/docs/about/promote/C-partial-application.md) — partial-application 카드

## src/content/docs/ru/docs/about/understanding
- [C-abstractions](src/content/docs/ru/docs/about/understanding/C-abstractions.md) — abstractions 카드
- [C-architecture](src/content/docs/ru/docs/about/understanding/C-architecture.md) — architecture 카드
- [C-knowledge-types](src/content/docs/ru/docs/about/understanding/C-knowledge-types.md) — knowledge-types 카드
- [C-naming](src/content/docs/ru/docs/about/understanding/C-naming.md) — naming 카드
- [C-needs-driven](src/content/docs/ru/docs/about/understanding/C-needs-driven.md) — needs-driven 카드
- [C-signals](src/content/docs/ru/docs/about/understanding/C-signals.md) — signals 카드

## src/content/docs/ru/docs/get-started
- [C-faq](src/content/docs/ru/docs/get-started/C-faq.md) — faq 카드
- [C-overview](src/content/docs/ru/docs/get-started/C-overview.md) — overview 카드
- [C-tutorial](src/content/docs/ru/docs/get-started/C-tutorial.md) — tutorial 카드

## src/content/docs/ru/docs/guides/examples
- [C-api-requests](src/content/docs/ru/docs/guides/examples/C-api-requests.md) — api-requests 카드
- [C-auth](src/content/docs/ru/docs/guides/examples/C-auth.md) — auth 카드
- [C-page-layout](src/content/docs/ru/docs/guides/examples/C-page-layout.md) — page-layout 카드
- [C-types](src/content/docs/ru/docs/guides/examples/C-types.md) — types 카드

## src/content/docs/ru/docs/guides/migration
- [C-from-custom](src/content/docs/ru/docs/guides/migration/C-from-custom.md) — from-custom 카드
- [C-from-v1](src/content/docs/ru/docs/guides/migration/C-from-v1.md) — from-v1 카드
- [C-from-v2-0](src/content/docs/ru/docs/guides/migration/C-from-v2-0.md) — from-v2-0 카드

## src/content/docs/ru/docs/guides/tech
- [C-with-electron](src/content/docs/ru/docs/guides/tech/C-with-electron.md) — with-electron 카드
- [C-with-nextjs](src/content/docs/ru/docs/guides/tech/C-with-nextjs.md) — with-nextjs 카드
- [C-with-nuxtjs](src/content/docs/ru/docs/guides/tech/C-with-nuxtjs.md) — with-nuxtjs 카드
- [C-with-react-query](src/content/docs/ru/docs/guides/tech/C-with-react-query.md) — with-react-query 카드
- [C-with-sveltekit](src/content/docs/ru/docs/guides/tech/C-with-sveltekit.md) — with-sveltekit 카드

## src/content/docs/ru/docs/reference
- [C-layers](src/content/docs/ru/docs/reference/C-layers.md) — layers 카드
- [C-public-api](src/content/docs/ru/docs/reference/C-public-api.md) — public-api 카드
- [C-slices-segments](src/content/docs/ru/docs/reference/C-slices-segments.md) — slices-segments 카드

## src/content/docs/tr/docs/get-started
- [C-faq](src/content/docs/tr/docs/get-started/C-faq.md) — faq 카드
- [C-overview](src/content/docs/tr/docs/get-started/C-overview.md) — overview 카드
- [C-tutorial](src/content/docs/tr/docs/get-started/C-tutorial.md) — tutorial 카드

## src/content/docs/tr/docs/guides/examples
- [C-api-requests](src/content/docs/tr/docs/guides/examples/C-api-requests.md) — api-requests 카드
- [C-auth](src/content/docs/tr/docs/guides/examples/C-auth.md) — auth 카드
- [C-handling-assets](src/content/docs/tr/docs/guides/examples/C-handling-assets.md) — handling-assets 카드
- [C-page-layout](src/content/docs/tr/docs/guides/examples/C-page-layout.md) — page-layout 카드
- [C-types](src/content/docs/tr/docs/guides/examples/C-types.md) — types 카드

## src/content/docs/tr/docs/guides/migration
- [C-from-custom](src/content/docs/tr/docs/guides/migration/C-from-custom.md) — from-custom 카드
- [C-from-v1](src/content/docs/tr/docs/guides/migration/C-from-v1.md) — from-v1 카드
- [C-from-v2-0](src/content/docs/tr/docs/guides/migration/C-from-v2-0.md) — from-v2-0 카드

## src/content/docs/tr/docs/guides/tech
- [C-with-nextjs](src/content/docs/tr/docs/guides/tech/C-with-nextjs.md) — with-nextjs 카드
- [C-with-react-query](src/content/docs/tr/docs/guides/tech/C-with-react-query.md) — with-react-query 카드

## src/content/docs/uz/docs
- [C-branding](src/content/docs/uz/docs/C-branding.md) — branding 카드

## src/content/docs/uz/docs/get-started
- [C-overview](src/content/docs/uz/docs/get-started/C-overview.md) — overview 카드

## src/content/docs/uz/docs/reference
- [C-layers](src/content/docs/uz/docs/reference/C-layers.md) — layers 카드

## src/content/docs/vi/docs
- [C-branding](src/content/docs/vi/docs/C-branding.md) — branding 카드
- [C-llms](src/content/docs/vi/docs/C-llms.md) — llms 카드

## src/content/docs/vi/docs/about
- [C-alternatives](src/content/docs/vi/docs/about/C-alternatives.md) — alternatives 카드
- [C-mission](src/content/docs/vi/docs/about/C-mission.md) — mission 카드
- [C-motivation](src/content/docs/vi/docs/about/C-motivation.md) — motivation 카드

## src/content/docs/vi/docs/about/promote
- [C-integration](src/content/docs/vi/docs/about/promote/C-integration.md) — integration 카드

## src/content/docs/vi/docs/about/understanding
- [C-architecture](src/content/docs/vi/docs/about/understanding/C-architecture.md) — architecture 카드
- [C-knowledge-types](src/content/docs/vi/docs/about/understanding/C-knowledge-types.md) — knowledge-types 카드
- [C-naming](src/content/docs/vi/docs/about/understanding/C-naming.md) — naming 카드
- [C-needs-driven](src/content/docs/vi/docs/about/understanding/C-needs-driven.md) — needs-driven 카드

## src/content/docs/vi/docs/get-started
- [C-faq](src/content/docs/vi/docs/get-started/C-faq.md) — faq 카드
- [C-overview](src/content/docs/vi/docs/get-started/C-overview.md) — overview 카드
- [C-tutorial](src/content/docs/vi/docs/get-started/C-tutorial.md) — tutorial 카드

## src/content/docs/vi/docs/guides/examples
- [C-api-requests](src/content/docs/vi/docs/guides/examples/C-api-requests.md) — api-requests 카드
- [C-auth](src/content/docs/vi/docs/guides/examples/C-auth.md) — auth 카드
- [C-page-layout](src/content/docs/vi/docs/guides/examples/C-page-layout.md) — page-layout 카드
- [C-types](src/content/docs/vi/docs/guides/examples/C-types.md) — types 카드

## src/content/docs/vi/docs/guides/migration
- [C-from-custom](src/content/docs/vi/docs/guides/migration/C-from-custom.md) — from-custom 카드
- [C-from-v1](src/content/docs/vi/docs/guides/migration/C-from-v1.md) — from-v1 카드
- [C-from-v2-0](src/content/docs/vi/docs/guides/migration/C-from-v2-0.md) — from-v2-0 카드

## src/content/docs/vi/docs/guides/tech
- [C-with-electron](src/content/docs/vi/docs/guides/tech/C-with-electron.md) — with-electron 카드
- [C-with-nextjs](src/content/docs/vi/docs/guides/tech/C-with-nextjs.md) — with-nextjs 카드
- [C-with-nuxtjs](src/content/docs/vi/docs/guides/tech/C-with-nuxtjs.md) — with-nuxtjs 카드
- [C-with-react-query](src/content/docs/vi/docs/guides/tech/C-with-react-query.md) — with-react-query 카드
- [C-with-sveltekit](src/content/docs/vi/docs/guides/tech/C-with-sveltekit.md) — with-sveltekit 카드

## src/content/docs/vi/docs/reference
- [C-layers](src/content/docs/vi/docs/reference/C-layers.md) — layers 카드
- [C-public-api](src/content/docs/vi/docs/reference/C-public-api.md) — public-api 카드
- [C-slices-segments](src/content/docs/vi/docs/reference/C-slices-segments.md) — slices-segments 카드

## src/content/docs/zh/docs
- [C-branding](src/content/docs/zh/docs/C-branding.md) — branding 카드

## src/content/docs/zh/docs/about
- [C-alternatives](src/content/docs/zh/docs/about/C-alternatives.md) — alternatives 카드
- [C-mission](src/content/docs/zh/docs/about/C-mission.md) — mission 카드
- [C-motivation](src/content/docs/zh/docs/about/C-motivation.md) — motivation 카드

## src/content/docs/zh/docs/about/promote
- [C-integration](src/content/docs/zh/docs/about/promote/C-integration.md) — integration 카드

## src/content/docs/zh/docs/about/understanding
- [C-architecture](src/content/docs/zh/docs/about/understanding/C-architecture.md) — architecture 카드
- [C-knowledge-types](src/content/docs/zh/docs/about/understanding/C-knowledge-types.md) — knowledge-types 카드
- [C-naming](src/content/docs/zh/docs/about/understanding/C-naming.md) — naming 카드
- [C-needs-driven](src/content/docs/zh/docs/about/understanding/C-needs-driven.md) — needs-driven 카드

## src/content/docs/zh/docs/get-started
- [C-faq](src/content/docs/zh/docs/get-started/C-faq.md) — faq 카드
- [C-overview](src/content/docs/zh/docs/get-started/C-overview.md) — overview 카드
- [C-tutorial](src/content/docs/zh/docs/get-started/C-tutorial.md) — tutorial 카드

## src/content/docs/zh/docs/guides/examples
- [C-api-requests](src/content/docs/zh/docs/guides/examples/C-api-requests.md) — api-requests 카드
- [C-auth](src/content/docs/zh/docs/guides/examples/C-auth.md) — auth 카드
- [C-page-layout](src/content/docs/zh/docs/guides/examples/C-page-layout.md) — page-layout 카드
- [C-types](src/content/docs/zh/docs/guides/examples/C-types.md) — types 카드

## src/content/docs/zh/docs/guides/migration
- [C-from-custom](src/content/docs/zh/docs/guides/migration/C-from-custom.md) — from-custom 카드
- [C-from-v1](src/content/docs/zh/docs/guides/migration/C-from-v1.md) — from-v1 카드
- [C-from-v2-0](src/content/docs/zh/docs/guides/migration/C-from-v2-0.md) — from-v2-0 카드

## src/content/docs/zh/docs/guides/tech
- [C-with-electron](src/content/docs/zh/docs/guides/tech/C-with-electron.md) — with-electron 카드
- [C-with-nextjs](src/content/docs/zh/docs/guides/tech/C-with-nextjs.md) — with-nextjs 카드
- [C-with-nuxtjs](src/content/docs/zh/docs/guides/tech/C-with-nuxtjs.md) — with-nuxtjs 카드
- [C-with-react-query](src/content/docs/zh/docs/guides/tech/C-with-react-query.md) — with-react-query 카드
- [C-with-sveltekit](src/content/docs/zh/docs/guides/tech/C-with-sveltekit.md) — with-sveltekit 카드

## src/content/docs/zh/docs/reference
- [C-layers](src/content/docs/zh/docs/reference/C-layers.md) — layers 카드
- [C-public-api](src/content/docs/zh/docs/reference/C-public-api.md) — public-api 카드
- [C-slices-segments](src/content/docs/zh/docs/reference/C-slices-segments.md) — slices-segments 카드

## src/pages/og
- [C-[...path]](src/pages/og/C-[...path].md) — [...path] 카드

## src/pages/og/_fonts/noto-sans-jp
- [C-japanese-500-normal](src/pages/og/_fonts/noto-sans-jp/C-japanese-500-normal.md) — japanese-500-normal 카드

## src/pages/og/_fonts/noto-sans-kr
- [C-korean-500-normal](src/pages/og/_fonts/noto-sans-kr/C-korean-500-normal.md) — korean-500-normal 카드

## src/pages/og/_fonts/noto-sans-sc
- [C-chinese-simplified-500-normal](src/pages/og/_fonts/noto-sans-sc/C-chinese-simplified-500-normal.md) — chinese-simplified-500-normal 카드

## src/pages/og/_fonts/roboto-mono
- [C-RobotoMono-Bold](src/pages/og/_fonts/roboto-mono/C-RobotoMono-Bold.md) — RobotoMono-Bold 카드
- [C-RobotoMono-Regular](src/pages/og/_fonts/roboto-mono/C-RobotoMono-Regular.md) — RobotoMono-Regular 카드

## src/pages/_pages/ui
- [C-HeroBanner](src/pages/_pages/ui/C-HeroBanner.md) — HeroBanner 카드
- [C-PopularGuides](src/pages/_pages/ui/C-PopularGuides.md) — PopularGuides 카드
- [C-Products](src/pages/_pages/ui/C-Products.md) — Products 카드
- [C-index](src/pages/_pages/ui/C-index.md) — index 카드

## src/shared/api
- [C-index](src/shared/api/C-index.md) — index 카드
- [C-social-preview](src/shared/api/C-social-preview.md) — social-preview 카드

## src/shared/lib
- [C-breadcrumbs](src/shared/lib/C-breadcrumbs.md) — breadcrumbs 카드
- [C-document-id](src/shared/lib/C-document-id.md) — document-id 카드
- [C-index](src/shared/lib/C-index.md) — index 카드

## src/shared/ui
- [C-Head](src/shared/ui/C-Head.md) — Head 카드
- [C-ThemeProvider](src/shared/ui/C-ThemeProvider.md) — ThemeProvider 카드

## src/shared/ui/static-image
- [C-StaticImage](src/shared/ui/static-image/C-StaticImage.md) — StaticImage 카드
- [C-StaticImageDownload](src/shared/ui/static-image/C-StaticImageDownload.md) — StaticImageDownload 카드

## src/styles
- [C-custom](src/styles/C-custom.md) — custom 카드
- [C-lunaria](src/styles/C-lunaria.md) — lunaria 카드

## static
- [C-.nojekyll](static/C-.nojekyll.md) — .nojekyll 카드
- [C-llms-full](static/C-llms-full.md) — llms-full 카드
- [C-llms](static/C-llms.md) — llms 카드
- [C-robots](static/C-robots.md) — robots 카드

## static/files
- [C-choosing-a-layer-en](static/files/C-choosing-a-layer-en.md) — choosing-a-layer-en 카드
- [C-choosing-a-layer-ru](static/files/C-choosing-a-layer-ru.md) — choosing-a-layer-ru 카드

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
