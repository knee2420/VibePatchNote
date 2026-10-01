# [Example 1] 미시적 사실 검증 사례 (Micro Fact Verification)

> **질문(User)**: 
> "SVPG 아티클 `Planning Product Discovery`와 `Product Discovery Pitfalls`에 'OUTCOME'의 4가지 속성(Problem Statement, Target Metric, Solution Agnostic, Strategic Context)이 직접 등장하는가? 몇 줄 몇 번째 단락에 있는가?"

---

### 1. 용어 및 개념 정체성 판정 (Concept Identity Audit)

* **질의 개념 / 키워드**: `OUTCOME의 4대 핵심 속성 (Problem Statement, Target Metric, Solution Agnostic, Strategic Context)`
* **정체성 분류**: `[ 후대 2차 합성/프레임워크 개념 ]`
* **판정 근거**:
  - 두 아티클 원문 본문에는 영어 단어 `outcome` 자체가 **0회 등장(단어 부재)**합니다.
  - 또한 "Solution Agnostic", "Target Metric" 등의 4대 속성 명칭은 원문의 직접 어휘가 아닙니다.
  - 본 볼트의 [SVPG(인스파이어드)기반 프로젝트 개념도.canvas](file:///c:/망고독%20관련%20자료/프로젝트_매니지먼트/What-s-in-my-head/1.🎯(Project)%20프로젝트/🤔R&D%20스피린트%20프로젝트%20관리기법%20도입/SVPG(인스파이어드)기반%20프로젝트%20개념도.canvas#L15) 내 `node_outcome` 카드 작성자가 두 아티클의 핵심 논리를 실무 프레임워크로 2차 합성·분류한 것입니다.

---

### 2. [Layer 1] 미시적 사실 검증 (Micro Fact & Verbatim Audit)

#### ① 속성 1 (Problem Statement) & 속성 2 (Target Metric)의 실제 원문 근거
* **경유 카드**: [C-2016-11-28_planning_product_discovery.md](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/96.data_pipeline/svpg-product-discovery/C-2016-11-28_planning_product_discovery.md)
* **원문 정본**: [2016-11-28 Planning Product Discovery.md:L35](file:///c:/망고독%20관련%20자료/프로젝트_매니지먼트/What-s-in-my-head/4.🗄️(Archive)%20보관/(Library)%20망고네%20도서관/(Articles)%20TECH%20Blog/svpg(인스파이어드)/Product%20Discovery/2016-11-28%20Planning%20Product%20Discovery.md#L35)
* **저자 원문 직인용 (Verbatim Quote)**:
  > "The first is to ensure the team is all on the same page in terms of clarity of purpose and alignment. In particular, we need to agree on **the specific problem we are intending to solve** (also referred to as “job to be done” if you prefer that nomenclature), **which user or customers you’re solving that problem for**, and **how will you know if you’ve succeeded. Not accidentally, these should align directly to your OKR’s.**" (L35)
* **맥락 및 예외 조건 (Nuance & Caveats)**:
  - 마티 케이건은 이를 'Outcome의 4대 속성'이라고 부르지 않고, 디스커버리 계획 단계에서 팀 전원이 합의해야 할 **첫 번째 목표(Clarity of purpose & alignment)**이자 **OKR과의 직접적 정렬 기준**으로 서술함.

#### ② 속성 3 (Solution Agnostic)의 실제 원문 근거
* **경유 카드**: [C-2017-04-04_product_discovery_pitfalls_and_anti_patterns.md](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/96.data_pipeline/svpg-product-discovery/C-2017-04-04_product_discovery_pitfalls_and_anti_patterns.md)
* **원문 정본**: [2017-04-04 Product Discovery Pitfalls.md:L41, L95](file:///c:/망고독%20관련%20자료/프로젝트_매니지먼트/What-s-in-my-head/4.🗄️(Archive)%20보관/(Library)%20망고네%20도서관/(Articles)%20TECH%20Blog/svpg(인스파이어드)/Product%20Discovery/2017-04-04%20Product%20Discovery%20Pitfalls%20and%20Anti-Patterns.md#L41)
* **저자 원문 직인용 (Verbatim Quote)**:
  > "**Confirmation-Biased Discovery puts your solution at the center of the process instead of the problem you’re trying to solve.**" (L41)
  > "- Discovery requires an open mind. **By definition, “discovery” means you don’t know the answer when you start. You must approach it with an openness to kill or dramatically alter our ideas based on you learn**" (L95)
* **맥락 및 예외 조건 (Nuance & Caveats)**:
  - 크리스 존스는 'Solution Agnostic'이라는 학술적 단어 대신, **"솔루션을 프로세스 중심에 두는 확증 편향 안티패턴"**을 비판하며, 배운 것에 따라 아이디어를 폐기하거나 바꿀 수 있는 열린 마음을 가질 것을 요구함.

---

### 3. [결론] 감사 판정 요약
질문자가 제시한 4대 속성은 두 아티클의 **문자열 그대로는 존재하지 않으나, 각 속성이 가리키는 원문 문장(Line 35, Line 41, Line 95)의 의미와 경고를 매우 정확하게 프레임워크화한 2차 합성물**임이 확인됨.
