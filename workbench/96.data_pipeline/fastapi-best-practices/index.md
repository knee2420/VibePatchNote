---
type: index
title: "FastAPI Best Practices"
description: "파이썬 FastAPI 프로덕션 레벨 아키텍처 가이드 파이프라인"
resource: "../../99.archive/fastapi-best-practices/"
timestamp: "2026-09-01"
---

원본 출처: [FastAPI Best Practices (zhanymkanov)](https://github.com/zhanymkanov/fastapi-best-practices) · 약 32KB / 6분할

# 이 프로젝트는
FastAPI 기반 백엔드 애플리케이션을 프로덕션 레벨로 운영하기 위한 구조적 모범 사례와 디자인 패턴을 제공한다.
32KB의 원문을 25KB 초과 분할 원칙에 따라, 논리적 구성 요소(Project Structure, Async Routes 등)별로 디렉터리를 쪼개어 세분화했다.

# 지도
```text
fastapi-best-practices/
├── 01_project_structure/    하위 인덱스 참조    카드 1장
├── 02_async_routes/         하위 인덱스 참조    카드 1장
├── 03_pydantic/             하위 인덱스 참조    카드 1장
├── 04_dependencies/         하위 인덱스 참조    카드 1장
├── 05_miscellaneous/        하위 인덱스 참조    카드 1장
└── 06_bonus/                하위 인덱스 참조    카드 1장

원문: ../../99.archive/fastapi-best-practices/
```

# 전체 카드 (SiteMap)

## 01_project_structure
- [C-01_project_structure](01_project_structure/C-01_project_structure.md) — 디렉터리 구조 및 계층 분리

## 02_async_routes
- [C-02_async_routes](02_async_routes/C-02_async_routes.md) — 비동기 엔드포인트 작성 규칙

## 03_pydantic
- [C-03_pydantic](03_pydantic/C-03_pydantic.md) — 스키마 설계 및 검증

## 04_dependencies
- [C-04_dependencies](04_dependencies/C-04_dependencies.md) — 의존성 주입 패턴

## 05_miscellaneous
- [C-05_miscellaneous](05_miscellaneous/C-05_miscellaneous.md) — 예외 처리, 로깅 등 기타 규칙

## 06_bonus
- [C-06_bonus](06_bonus/C-06_bonus.md) — 추가 심화 사례

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 |
|---|---|
| 비즈니스 로직을 라우터에서 분리하는 구조가 필요할 때 | [01_project_structure/index.md](01_project_structure/index.md) |
| 글로벌 예외 처리 및 로깅 패턴 | [05_miscellaneous/index.md](05_miscellaneous/index.md) |
