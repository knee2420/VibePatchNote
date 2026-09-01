---
type: card
title: "AHA Programming (Avoid Hasty Abstractions)"
description: "섣부른 추상화보다 복제가 낫다는 변경 용이성 중심의 모듈 설계 철학"
resource: "../../../99.archive/aha-programming/README.md"
timestamp: 2026-09-01
---

# summary
미래의 변경 가능성을 섣불리 예측하여 공통 모듈로 묶는 대신, **요구사항과 공통점이 완전히 명확해질 때까지 코드 중복(Duplication)을 적극적으로 수용**하여 모듈 간 불필요한 결합을 막는 아키텍처 원칙이다. **변경 용이성**을 최우선으로 최적화한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 원칙 | 변경 용이성 최적화 | 잘못된 추상화보다 코드 중복이 나으며, 변경 용이성을 최우선으로 설계해야 한다는 Sandi Metz와 Kent C. Dodds의 핵심 격언 | `## 1. The Principle` |
| E2 | 비교 | DRY vs WET vs AHA | 교조적인 DRY의 결합도 문제, WET의 기계적 반복 한계, 그리고 요구사항이 명확해질 때까지 중복을 수용하는 AHA 원칙의 차이점 | `## 2. DRY vs WET vs AHA` |
| E3 | 절차 | 추상화 해체(Inline) | 조건문으로 덕지덕지 오염된 잘못된 공통 모듈을 부끄러워하지 말고 즉시 원래 자리로 복제(Inline)하여 분리하라는 행동 지침 | `## 3. Key Takeaways` |

# 밖으로
- ⚠️ 이 카드의 원칙은 공통 컴포넌트(shared layer) 설계 시 매우 높은 기준을 요구하며, 기능(feature) 간의 격리를 강제하는 근거로 작용한다.

# 원문
[AHA Programming 원본](../../../99.archive/aha-programming/README.md) · [Kent C. Dodds 블로그](https://kentcdodds.com/blog/aha-programming)
