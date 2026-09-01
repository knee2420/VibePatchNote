# AHA Programming 💡

* **Author**: Kent C. Dodds (with principles from Sandi Metz and Cher Scarlett)
* **Source**: [https://kentcdodds.com/blog/aha-programming](https://kentcdodds.com/blog/aha-programming)

---

## 1. The Principle

> **"AHA = Avoid Hasty Abstractions"**  
> *(성급한 추상화를 피하라)*

> **"Prefer duplication over the wrong abstraction."** — *Sandi Metz*  
> *(잘못된 추상화보다 코드 중복이 훨씬 낫다.)*

> **"Optimize for change first."** — *Kent C. Dodds*  
> *(변경 용이성을 최우선으로 최적화하라.)*

---

## 2. DRY vs WET vs AHA

* **DRY (Don't Repeat Yourself)**:
  - 모든 지식은 시스템 내에서 단일하고 명확한 표현을 가져야 한다는 원칙.
  - 지나치게 교조적(dogmatic)으로 적용할 경우, 서로 다른 요구사항을 가진 코드들이 하나의 거대한 괴물 함수로 묶여버리는 치명적인 결합도(Coupling)를 유발함.
* **WET (Write Everything Twice)**:
  - "2번까지는 중복을 허용하고 3번째에 추상화하라"는 기계적 규칙.
* **AHA (Avoid Hasty Abstractions)**:
  - 추상화 시점에 대해 맹목적인 숫자에 얽매이지 않고, 요구사항과 공통점이 완전히 명확해질 때까지 코드 중복을 적극적으로 수용함.

---

## 3. Key Takeaways

1. **섣부른 추상화의 위험성**:
   - 초기에 성급하게 공통화된 컴포넌트나 함수는, 새로운 요구사항이 들어올 때마다 `if` 조건문과 옵셔널 플래그가 덕지덕지 붙어 결국 전체 애플리케이션을 망가뜨림.
2. **코드 복제의 용기**:
   - 새로운 기능이 필요할 때 기존 코드를 복제(Copy & Paste)하여 독립적으로 발전시키는 것을 두려워하지 말라.
3. **추상화 해체(Inline)**:
   - 만약 잘못된 추상화로 인해 고통받고 있다면, 부끄러워하지 말고 즉시 추상화를 해체하여 다시 각 위치에 코드를 인라인/중복 상태로 되돌려라.
