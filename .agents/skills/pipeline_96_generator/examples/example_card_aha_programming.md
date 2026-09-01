---
type: card
title: "AHA Programming (Avoid Hasty Abstractions)"
description: "섣부른 DRY 추상화보다 복제가 훨씬 저렴하다는 Kent C. Dodds의 모듈 격리 철학"
resource: "../../../99.archive/aha-programming/README.md"
timestamp: "2026-09-01"
---

# summary
미래의 변경 가능성을 섣불리 예측하고 공통 모듈로 묶는(Wrong Abstraction) 대신, **3회 이상 실제로 반복되기 전까지는 코드 복제(Duplication)를 적극 허용**하여 모듈 간 불필요한 결합을 원천 차단하는 소프트웨어 설계 철학을 다룬다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | 잘못된 추상화의 비용 | 잘못된 추상화(Wrong Abstraction)를 되돌리는 비용이 중복 코드를 유지하는 비용보다 훨씬 크다 | `## The Problem with Hasty Abstraction` |
| E2 | 규칙 | Rule of Three | 정확히 동일한 패턴이 3번 이상 실제로 등장하기 전까지는 공통화/추상화를 보류한다 | `## When to Abstract: Rule of Three` |
| E3 | 비교 | DRY vs WET vs AHA | DRY(Don't Repeat Yourself)의 맹목적 추종을 경계하고 WET(Write Everything Twice)을 거쳐 적절한 시점에 추상화 | `## DRY vs WET vs AHA` |
| E4 | 절차 | 인라인화와 재추상화 | 추상화된 함수/컴포넌트가 복잡한 조건문(`if/else`)으로 도배되기 시작하면 즉시 원래 자리로 복제(Inline) 후 재설계 | `## De-abstracting Code` |
| E5 | 원칙 | 독립성과 교체 가능성 | 각 Feature 모듈이 자체 훅과 컴포넌트를 소유하여, 하나를 삭제해도 다른 모듈이 깨지지 않게 보장 | `## Module Independence` |

# 밖으로
- [E2, E5] 원칙은 FSD의 `shared/` 레이어 남용을 막고, `features/` 슬라이스 간의 완전한 격리를 지원한다.

# 원문
[AHA Programming 원본](../../../99.archive/aha-programming/README.md) · [Kent C. Dodds 블로그](https://kentcdodds.com/blog/aha-programming)
