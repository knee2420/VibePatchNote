---
type: index
title: "AHA Programming 💡"
description: "섣부른 추상화를 경계하고 변경 용이성을 최우선으로 하는 엔지니어링 철학"
resource: "../../99.archive/aha-programming/"
timestamp: 2026-09-01
---

원문 출처: [Kent C. Dodds 블로그](https://kentcdodds.com/blog/aha-programming) · 1개 파일 / 카드 총 1장

# 이 지식 파이프라인은

섣부른 코드 공통화와 추상화(Hasty Abstraction)로 인해 발생하는 시스템 결합도 문제와 복잡성 증가를 방지하기 위한 소프트웨어 설계 원칙을 다룬다.
미래의 중복을 미리 예측하여 코드를 묶기보다는, 코드 복제(Duplication)를 적극적으로 수용하여 각 모듈의 독립성과 변경 용이성(Optimize for change first)을 극대화하는 것에 집중한다.
추상화의 타이밍과 해체(Inline) 시점에 대한 명확한 기준을 제시하여 유지보수성을 높인다.

# 지도

```text
aha-programming/
└── 01_core/      [AHA 핵심 철학과 개념]       카드 1장   (2 KB)

원문: ../../99.archive/aha-programming/
```

# 전체 카드

## 01_core
- [C-01-01 AHA Programming](01_core/C-01-01_aha_programming.md) — 섣부른 추상화의 위험성과 코드 복제 허용을 통한 모듈 격리 철학

# 가로축 — 전체를 관통하는 핵심 줄기

1. **[추상화보다는 변경 용이성]**
   [C-01-01 AHA Programming](01_core/C-01-01_aha_programming.md) E1 → [C-01-01 AHA Programming](01_core/C-01-01_aha_programming.md) E2
   → 기능 구현 시 단순히 코드를 줄이는 것보다, 추후 요구사항 변경 시 다른 모듈에 영향을 주지 않고 안전하게 수정할 수 있는 구조를 택하는 것이 훨씬 중요함을 일깨운다.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 것 | 바로 가야 할 카드 |
|---|---|
| 공통 컴포넌트를 만들지, 코드를 복제할지 고민될 때 | [C-01-01 AHA Programming](01_core/C-01-01_aha_programming.md) |
| 기존의 복잡해진 공통 함수를 분해(Inline)해야 할 때 | [C-01-01 AHA Programming](01_core/C-01-01_aha_programming.md) |
