---
name: "pipeline_96_deep_reader"
description: "사용자가 'workbench/96.data_pipeline'의 지식과 카드를 기반으로 질문하거나 아키텍처/로직/사상 조회를 요청할 때 발동합니다. 환각(Hallucination)과 자의적 재해석을 원천 차단하고, [원문 직인용(Micro Fact) + 저자의 가치서열/대립쌍 추출(Macro Insight)]의 이중 레이어로 저자의 본 취지와 사실성을 100% 보존하여 답변합니다."
---

# Pipeline 96: Deep Reader (심층 지식 감사 및 통찰 리더)

## 1. 목적 및 철학

기존 리더 스킬은 2차 요약본(카드)만을 기반으로 하여, **요약본을 또다시 요약하면서 발생하는 '맥락 절단'과 '자의적 재해석(짜깁기)'**이라는 고질적 한계가 있었습니다.
`pipeline_96_deep_reader`는 다음 2대 원칙을 기술적으로 강제하여, **저자의 원문 사실성과 거시적 본 취지를 1%의 왜곡 없이 복원**합니다:

1. **미시적 사실 감사 (Micro Fact Audit)**: 카드의 요약에 의존하지 않고, 원문(Resource) 텍스트를 직접 열어 저자의 원문 문장(Verbatim)과 줄 번호(Line)를 박제하여 거짓말을 방지한다.
2. **거시적 사상 통찰 (Macro Insight)**: 단어의 유무에만 갇히지 않고, 저자의 전체 체계(가로축)와 **[최우선 핵심(Primary) vs 경계/부차적 요소(Secondary)] 대립쌍 매트릭스**를 추출하여 저자의 깊은 뉘앙스를 왜곡 없이 포착한다.

---

## 2. 3대 절대 가드레일 (위반 시 답변 무효)

1. **원문 문장(Verbatim) 박제 없는 해석 절대 금지**: 
   - 저자의 주장이나 규칙을 설명할 때는 반드시 원문 파일의 영어 원문 문장 또는 원본 텍스트를 인용구(`>`)로 먼저 박제해야 한다. 에이전트의 한국어 해설은 박제된 원문의 범위를 벗어나 임의로 살을 붙일 수 없다.
2. **2차 요약본(카드) 단독 참조 금지 (원문 직독 의무)**:
   - 카드는 어디까지나 '색인 네비게이터'일 뿐이다. 핵심 답변을 구성할 때는 반드시 카드의 `resource:` 원문 파일의 해당 줄 번호 범위를 열람(`view_file`)하여 전후 맥락을 검증해야 한다.
3. **용어 정체성 선언 의무 (저자 직설 vs 2차 합성 분리)**:
   - 질문에 포함된 개념/표현이 **[A. 저자가 원문에서 직접 쓴 고유 어휘]**인지, **[B. 후대 기획자/요약자가 프레임워크화하며 합성(Synthesis)한 2차 가공 개념]**인지를 답변 서두에서 명확히 분리하여 밝혀야 한다.

---

## 3. 이중 질의 판정 및 5단계 심층 탐색 프로토콜

질문을 받으면 에이전트는 반드시 다음 순서대로 사고하고 도구를 호출한다:

```
[Step 0: 질의 유형 판정] ➔ [Step 1: 지도 및 가로축 횡단] ➔ [Step 2: 카드 라우팅] 
  ➔ [Step 3: 원본 직독 & Verbatim 추출] ➔ [Step 4: 대립쌍 매트릭스 도출] ➔ [Step 5: 이중 레이어 답변]
```

### Step 0: 질의 유형 판정 (Query Type Discrimination)
- **Type A (사실 확인형 / Micro Fact)**: "A라는 단어가 몇 줄에 나오는가?", "B의 4가지 속성은 무엇인가?", "수치나 규칙이 어떻게 명시되어 있는가?"
- **Type B (사상 통찰형 / Macro Insight)**: "저자가 가장 강조하는 핵심은 무엇인가?", "저자는 '타임라인'을 어떻게 취급하고 있는가?", "이 책의 근본적인 뉘앙스는 무엇인가?"
- **Type C (복합형)**: 사실 확인과 사상적 평가가 동시에 요구되는 경우.

### Step 1: 지도(Map) 및 가로축 횡단 (Top-Down Anchoring)
- 타겟 주제 폴더의 루트 `index.md`를 열람한다.
- **★Type B/C일 경우 필수**: `index.md`의 **`# 가로축 — 전체를 관통하는 핵심 줄기`**를 반드시 읽고, 질문받은 주제가 저자의 4대 핵심 궤적 중 어디에 위치하는지 기준 좌표계를 잡는다.

### Step 2: 핀포인트 카드 라우팅 (Card Routing)
- 질문과 직결된 카드 1~3개를 선별하여 카드의 `# elements`와 `# summary`를 읽는다.

### Step 3: 원본 아카이브 직독 및 Verbatim 추출 (Deep Fetch)
- 카드의 `resource:` 링크를 타고 **원본 텍스트 파일(Resource/Archive)**을 직접 연다.
- 저자가 실제로 사용한 원문 문장(Verbatim Sentence)과 줄 번호(Line Number)를 확보한다.
- **저자의 단서 조항(Nuance & Caveat) 포착**: 저자가 그 주장을 할 때 함께 언급한 **전제 조건, 예외, 혹은 경계한 함정(Warnings)**을 함께 추출한다.

### Step 4: [Type B/C 전용] 저자의 대립쌍 매트릭스(Dichotomy Matrix) 작성
저자의 통찰을 증명하기 위해, 저자가 본문에서 설정한 **[Primary(본질) vs Secondary(부차적 수단/경계 대상)]**의 대립 구도를 기계적으로 정렬한다:

| 저자가 경계/하위로 둔 것 (Secondary / Trap) | 저자가 최우선으로 강조한 것 (Primary / Core) | 저자의 원문 논거 (Verbatim Basis) |
| :--- | :--- | :--- |
| 일정 준수 / 마감 기한 (Timeline / Date) | 필수 성과 및 리스크 해소 (Outcome / Risk) | 원문 인용구 및 줄 번호 |
| 산출물 채우기 (Output / Feature) | 고객과 비즈니스의 실질 변화 (Outcome) | 원문 인용구 및 줄 번호 |

### Step 5: 이중 레이어 충실도 보고 (Fidelity Reporting)
- Layer 1(미시적 사실)과 Layer 2(거시적 사상 위상)를 엄격히 분리하여 사용자에게 보고한다.

---

## 4. 표준 답변 출력 템플릿

```markdown
### 1. 용어 및 개념 정체성 판정 (Audit Summary)
* **질의 개념**: `{질문 키워드}`
* **판정 결과**: `[저자 원문 직설 개념 / 후대 2차 합성 프레임워크]`
* **판정 사유**: 저자 원문에 해당 문자열이 직접 존재하는지, 아니면 어떤 원문 표현을 후대에서 범주화한 것인지 명시.

---

### 2. [Layer 1] 미시적 사실 검증 (Micro Fact & Verbatim)
* **참조 카드**: `[카드명](파일경로)`
* **원본 파일**: `[아티클/도서명:Line 번호](파일경로#L...)`
* **저자 원문 박제 (Verbatim Quote)**:
  > "{저자가 작성한 영어 원문 또는 본문 문장 그대로}"
* **맥락 및 예외 조건 (Nuance & Caveats)**:
  - 저자가 붙인 단서, 조건부 한정, 혹은 경고한 부작용 기술.

---

### 3. [Layer 2] 거시적 사상 및 가치 서열 분석 (Macro Insight)
*(Type B, C 질문 시 필수 작성)*

* **가로축 좌표**: `{루트 index.md 가로축 중 해당하는 궤적}`
* **저자의 가치 서열 대립쌍 (Dichotomy Matrix)**:

| 저자가 부차적/경계로 본 요소 (Secondary) | 저자가 최상위로 강조한 본질 (Primary) | 원문 근거 (Quote & Line) |
| :--- | :--- | :--- |
| ... | ... | ... |

* **통찰적 결론**: 저자가 이 개념을 다루는 궁극적인 태도와 의도 해설.
```

---

## 5. 실전 Few-Shot 예시

### 질문: "책에서 타임라인(시간 제약)을 어떻게 취급하라고 나와 있나?"

```markdown
### 1. 용어 및 개념 정체성 판정 (Audit Summary)
* **질의 개념**: `타임라인 (시간 제약 / 타임 리미트)`
* **판정 결과**: `[저자 원문 직설 거부 및 개념 분리]`
* **판정 사유**: 저자는 워터폴식 '시간 제한(Time-limiting)'을 명시적으로 거부하며, 타임박스 역시 성과(Outcome)보다 산출물(Output)에 치우칠 위험이 있어 도입을 소극적으로 대했다고 직접 밝힘.

---

### 2. [Layer 1] 미시적 사실 검증 (Micro Fact & Verbatim)
* **참조 카드**: [C-2012-08-20_time_boxing_product_discovery.md](workbench/96.data_pipeline/svpg-product-discovery/C-2012-08-20_time_boxing_product_discovery.md)
* **원본 파일**: [2012-08-20 Time-Boxing Product Discovery.md:L29-L39](workbench/96.data_pipeline/svpg-product-discovery/2012-08-20 Time-Boxing Product Discovery.md#L29-L39)
* **저자 원문 박제 (Verbatim Quote)**:
  > "First, for those that are not familiar with the term, **time-boxing is not the same as time-limiting. Time-limiting is what we did in Waterfall.**" (Line 29)
  > "**I have been reluctant to advocate for time-boxed product discovery** because with time-boxing the pendulum can easily swing too far towards output rather than outcome... Also, for good teams the velocity of product discovery is on the order of **multiple iterations per day, in which case time-boxing breaks down.**" (Line 39)
* **맥락 및 예외 조건 (Nuance & Caveats)**:
  - 훌륭한 팀은 하루에도 수차례 반복하므로 타임박스 자체가 무의미함.
  - 단, 진행 속도가 극단적으로 느린 팀에 한해 빠른 호흡을 훈련시키기 위한 가속 페달용으로만 1주일 미만의 타임박스를 한시적으로 제안함.

---

### 3. [Layer 2] 거시적 사상 및 가치 서열 분석 (Macro Insight)
* **가로축 좌표**: [2. 프로토타이핑과 '버리는 코드' 철학] & [4. 문제 공간과 솔루션 공간의 통합]
* **저자의 가치 서열 대립쌍 (Dichotomy Matrix)**:

| 저자가 부차적/경계로 본 요소 (Secondary) | 저자가 최상위로 강조한 본질 (Primary) | 원문 근거 (Quote & Line) |
| :--- | :--- | :--- |
| **일정/마감 준수 (Time-limiting / Dates)** | **4대 리스크 선제 제거 (Value, Usability, Feasibility, Viability)** | *"I have been reluctant to advocate... pendulum swing too far towards output rather than outcome"* (Line 39) |
| **시간 내에 부품 찍어내기 (Feed the beast)** | **가설 검증을 통한 빠른 배움 (Build to Learn)** | *"what is the fastest, cheapest way to validate the idea?"* (Line 45) |

* **통찰적 결론**: 
  저자에게 시간과 타임라인은 '철저히 관리해야 할 프로젝트 마감선'이 아닙니다. 저자는 오히려 시간에 쫓기다 보면 쓸모없는 기능을 제때 납품하는 함정(Feature Factory)에 빠진다고 경고합니다. 시간은 리스크를 털어내기 위한 훈련용 보조 바퀴일 뿐이며, 진짜 핵심은 "개발 착수 전에 4대 리스크를 얼마나 빠르고 싸게 제거(또는 실패 후 폐기)했는가"입니다.
```

---

## 6. 번들 컴포넌트 색인 (Templates & Examples)

본 스킬은 에이전트의 답변 품질 일관성과 팩트 충실도를 보장하기 위해 아래의 전용 템플릿과 실전 예시 컴포넌트를 번들로 포함합니다:

* **표준 출력 템플릿**:
  - [`templates/fidelity_report_template.md`](templates/fidelity_report_template.md): 2개 레이어 분리 및 대립쌍 표를 탑재한 정본 보고서 서식.
* **실전 케이스 스터디 (Examples)**:
  - [`examples/01_micro_fact_verification.md`](examples/01_micro_fact_verification.md): 사실 확인형 (OUTCOME 정의 및 4대 속성의 원문 매핑 감사 사례).
  - [`examples/02_macro_insight_dichotomy.md`](examples/02_macro_insight_dichotomy.md): 사상 통찰형 (타임라인/시간제한에 대한 저자의 본 취지와 대립쌍 표 도출 사례).
  - [`examples/03_bad_vs_good_comparison.md`](examples/03_bad_vs_good_comparison.md): 안티패턴(요약본 기반 뇌피셜 소설) vs 모범사례(원문 직독 및 단서 조항 명시) 1:1 대조.
