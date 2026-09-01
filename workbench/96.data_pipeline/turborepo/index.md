---
type: index
title: "Turborepo (Monorepo Standard)"
description: "TS/JS 풀스택 모노레포 아키텍처 가이드 파이프라인"
resource: "../../99.archive/turborepo/"
timestamp: "2026-09-01"
---

원본 출처: [Turborepo Docs (Core Concepts)](https://turbo.build/repo/docs/core-concepts/monorepos) · 약 252KB / 3분할

# 이 프로젝트는
현대 프론트엔드 및 풀스택 생태계의 표준으로 자리 잡은 모노레포(Monorepo) 아키텍처의 핵심 철학을 정의한다.
구동 가능한 서비스(`apps/`)와 재사용 가능한 모듈(`packages/`)을 명확히 분리하여, 코드 중복을 막고 헤드리스(Headless) 플러그인 아키텍처를 구현하기 위한 기반을 다진다.
원문이 250KB가 넘는 대용량 문서이므로, 논리적 흐름에 맞게 3개의 파트로 분할(Split)하여 지식 카드를 구축했다.

# 지도
```text
turborepo/
├── 01_what_is_turborepo/       하위 인덱스 참조    카드 1장
├── 02_the_monorepo_problem/    하위 인덱스 참조    카드 1장
└── 03_the_monorepo_solution/   하위 인덱스 참조    카드 1장

원문: ../../99.archive/turborepo/
```

# 전체 카드 (SiteMap)

## 01_what_is_turborepo
- [C-01_what_is_turborepo](01_what_is_turborepo/C-01_what_is_turborepo.md) — Turborepo의 기본 개념

## 02_the_monorepo_problem
- [C-02_the_monorepo_problem](02_the_monorepo_problem/C-02_the_monorepo_problem.md) — 기존 멀티레포 및 거대 저장소의 한계와 문제점

## 03_the_monorepo_solution
- [C-03_the_monorepo_solution](03_the_monorepo_solution/C-03_the_monorepo_solution.md) — apps/와 packages/ 분리를 통한 모노레포 해결책 및 구조 설계

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 하위 인덱스 |
|---|---|
| 공통 UI, 유틸을 독립적인 패키지로 분리하는 구조 설계 | [03_the_monorepo_solution/index.md](03_the_monorepo_solution/index.md) |
| 멀티레포 방식과 모노레포 방식의 트레이드오프 비교 | [02_the_monorepo_problem/index.md](02_the_monorepo_problem/index.md) |
