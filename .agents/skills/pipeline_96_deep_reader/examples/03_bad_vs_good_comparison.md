# [Example 3] 나쁜 답변(안티패턴) vs 좋은 답변(모범사례) 대조

---

## ❌ 나쁜 답변 예시 (에이전트의 흔한 거짓말 및 뇌피셜 종합)

> **질문**: "디스커버리에서 타임박스는 어떻게 해야 하나요?"

### 나쁜 답변 출력:
> "SVPG에 따르면 디스커버리는 1~2주의 명확한 타임박스를 두고 진행해야 합니다. 
> 타임박스를 두어야 팀이 집중력을 발휘할 수 있고, 가설을 채택하거나 기각할 수 있습니다. 
> 스프린트와 결합하여 매주 월요일에 시작해서 금요일에 끝내는 것이 모범 사례입니다.
> (출처: [C-2012-08-20_time_boxing_product_discovery.md](workbench/96.data_pipeline/svpg-product-discovery/C-2012-08-20_time_boxing_product_discovery.md))"

### 🚨 왜 이 답변이 치명적인 실패(안티패턴)인가?
1. **맥락 절단 및 사실 왜곡**: 
   - 마티 케이건이 원문에서 *"타임박스는 산출물 매몰 위험이 있어 권장하기를 극도로 주저했다(reluctant to advocate)"*고 밝힌 본 취지를 완전히 거세함.
2. **원문 문장 부재**:
   - 원문의 실제 문장(Verbatim)이 단 한 줄도 박제되지 않았으며, 에이전트가 일반적인 애자일 상식으로 소설을 씀.
3. **출처 세탁**:
   - 요약 카드 링크 하나만 띡 달아놓고 그럴듯하게 거짓말을 정당화함.

---

## ✅ 좋은 답변 예시 (`pipeline_96_deep_reader` 표준)

> **동일한 질문에 대한 모범 답변**:

### 1. 용어 및 개념 정체성 판정 (Concept Identity Audit)
* **질의 개념**: `디스커버리에서의 타임박스(Time-box) 규칙`
* **정체성 분류**: `[ 조건부 한시적 훈련 도구 (권장 규칙 아님) ]`
* **판정 근거**: 저자는 타임박스를 디스커버리의 필수 권장 규칙으로 제시하지 않으며, 오히려 성과(Outcome)를 해칠 수 있다고 경계함.

---

### 2. [Layer 1] 미시적 사실 검증 (Micro Fact & Verbatim Audit)
* **경유 카드**: [C-2012-08-20_time_boxing_product_discovery.md](file:///c:/AI_Projects/WebNovelAssistant/VibePatchNote/workbench/96.data_pipeline/svpg-product-discovery/C-2012-08-20_time_boxing_product_discovery.md)
* **원문 정본**: [2012-08-20 Time-Boxing Product Discovery.md:L39](file:///c:/망고독%20관련%20자료/프로젝트_매니지먼트/What-s-in-my-head/4.🗄️(Archive)%20보관/(Library)%20망고네%20도서관/(Articles)%20TECH%20Blog/svpg(인스파이어드)/Product%20Discovery/2012-08-20%20Time-Boxing%20Product%20Discovery.md#L39)
* **저자 원문 직인용 (Verbatim Quote)**:
  > "**I have been reluctant to advocate for time-boxed product discovery** because with time-boxing the pendulum can easily swing too far towards output rather than outcome (just get something done, also known as “feed the beast”). Also, for good teams the velocity of product discovery is on the order of **multiple iterations per day, in which case time-boxing breaks down.**" (L39)
* **저자의 단서 조항 및 예외/경계 (Nuance & Caveats)**:
  - **경계한 함정**: 타임박스를 도입하면 기간 내에 뭐라도 만들어 제출해야 한다는 압박 때문에 '산출물(Output) 채우기'로 변질됨.
  - **예외적 적용 조건**: 오직 제품 발견 속도가 극단적으로 느려터진 팀에 한해 빠른 반복 호흡을 익히게 할 목적으로만 1주일 미만(1일~1주)의 타임박스를 한시적으로 시도해 볼 것을 제안함.

---

### 3. [Layer 2] 거시적 사상 및 가치 서열 분석 (Macro Insight)
* **가로축 기준선**: `[가로축 2. 프로토타이핑과 '버리는 코드' 철학]`
* **저자의 가치 서열 대립쌍 매트릭스 (Dichotomy Matrix)**:

| 저자가 경계/하위 수단으로 둔 것 (Secondary / Trap) | 저자가 최우선으로 강조한 본질 (Primary / Core) | 원문 논거 (Verbatim Basis) |
| :--- | :--- | :--- |
| **시간 박스 채우기 (Just get something done)** | **핵심 성과 달성 (Delivering Outcomes)** | > *"pendulum can easily swing too far towards output rather than outcome"* (L39) |
| **주간 단위 타임박스 고착 (1-week box)** | **하루에도 수차례 반복 검증 (Multiple iterations per day)** | > *"velocity of product discovery is on the order of multiple iterations per day"* (L39) |

* **통찰적 본질 해설**:
  저자에게 디스커버리는 일정표에 갇힌 프로젝트가 아니라 **'상시적인 고속 가설 검증 루프'**입니다. 따라서 1~2주의 타임박스를 고정하는 것은 저자의 본래 취지가 아니며, 오히려 하루 단위로 가설을 검증하고 실패한 아이디어는 즉시 폐기하는 속도감이 진정한 SVPG식 디스커버리입니다.
