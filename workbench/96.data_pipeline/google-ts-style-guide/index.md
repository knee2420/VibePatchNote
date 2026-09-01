---
type: index
title: "Google TypeScript Style Guide"
description: "Google TS 코딩 컨벤션 및 네이밍, 포맷팅 규칙 파이프라인"
resource: "../../99.archive/google-ts-style-guide/"
timestamp: "2026-09-01"
---

원본 출처: [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html) · 약 137KB / 단일 가이드 분할

# 이 프로젝트는
구글 내부의 TypeScript 프로젝트에서 통용되는 엄격한 코딩 컨벤션, 네이밍 규칙, 포맷팅 가이드라인을 정의한다.
단일 파일(137KB)로 제공되는 원본을 논리적 대주제(H2) 단위로 4분할하여 지식 카드로 구축했다.

# 지도
```text
google-ts-style-guide/
├── C-tsguide_01_introduction.md         카드 1장
├── C-tsguide_02_source_file_basics.md   카드 1장
├── C-tsguide_03_source_file_structure.md 카드 1장
└── C-tsguide_04_language_features.md    카드 1장

원문: ../../99.archive/google-ts-style-guide/
```

# 전체 카드 (SiteMap)

## google-ts-style-guide (최상위)
- [C-tsguide_01_introduction](C-tsguide_01_introduction.md) — 스타일 가이드 개요 및 용어 정의
- [C-tsguide_02_source_file_basics](C-tsguide_02_source_file_basics.md) — 파일 인코딩 및 기본 명명 규칙
- [C-tsguide_03_source_file_structure](C-tsguide_03_source_file_structure.md) — 임포트(Import)/익스포트(Export) 및 선언 순서 규칙
- [C-tsguide_04_language_features](C-tsguide_04_language_features.md) — 인터페이스, 클래스, 함수 등 핵심 언어 기능 사용 규칙

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 |
|---|---|
| 컴포넌트/훅/유틸 파일의 Import/Export 순서가 궁금할 때 | [C-tsguide_03_source_file_structure](C-tsguide_03_source_file_structure.md) |
| 변수명, 클래스명 등 네이밍 컨벤션 확인이 필요할 때 | [C-tsguide_02_source_file_basics](C-tsguide_02_source_file_basics.md) |
| TS 고유 기능(Interface, Type Alias) 사용 규칙 | [C-tsguide_04_language_features](C-tsguide_04_language_features.md) |
