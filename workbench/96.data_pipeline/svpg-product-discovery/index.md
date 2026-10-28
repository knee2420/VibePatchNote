---
type: index
title: "SVPG Product Discovery 지식 파이프라인"
description: "마티 케이건(Marty Cagan)과 SVPG가 2007년부터 2026년까지 정립한 프로덕트 디스커버리(Product Discovery) 핵심 원칙, 4대 리스크 검증, 프로토타이핑 및 아키텍처 가이드"
resource: "../../../../../../망고독 관련 자료/프로젝트_매니지먼트/What-s-in-my-head/4.🗄️(Archive) 보관/(Library) 망고네 도서관/(Articles) TECH Blog/svpg(인스파이어드)/Product Discovery/"
timestamp: 2026-09-24
---

원문 출처: [SVPG Official Blog (Product Discovery)](https://www.svpg.com/category/product-discovery/) · 40개 아티클 원문 / 카드 총 40장

# 이 지식 파이프라인은

실리콘밸리 제품 조직이 수많은 시간과 자본을 투입하고도 시장에서 실패하는 근본 원인은 '무엇을 만들지(Discovery)' 철저히 검증하지 않고 무작정 '개발 및 배포(Delivery)'에 착수하기 때문입니다. 본 파이프라인은 마티 케이건(Marty Cagan)이 20년 넘게 현장에서 정립한 **제품 발견(Product Discovery)**의 핵심 원칙, 엔지니어링-디자인-제품 관리 3자의 협업 아키텍처, 그리고 빠른 가설 검증 기법을 고밀도로 체계화합니다.

본 파이프라인은 **4대 핵심 리스크(가치, 사용성, 실현가능성, 사업성)의 조기 해소**와, '배우기 위한 빌드(Build to Learn)'와 '돈을 벌기 위한 빌드(Build to Earn)'의 엄격한 분리를 핵심 기둥으로 삼습니다. 특히 엔지니어를 단순한 스프린트 티켓 처리자가 아닌 디스커버리 단계의 핵심 파트너로 참여시키는 수평적 협업 메커니즘을 강조합니다.

본 파이프라인의 카드들은 `Product Operating Model`, `Product Teams`, `Product Management` 등 다른 제품 조직 주제들과 유기적으로 상호작용합니다. 디스커버리는 한 번 하고 끝내는 프로젝트가 아니라 주간 단위로 지속되는 반복 루프(Continuous Discovery)이며, 코딩에 본격 착수하기 전 프로토타입으로 리스크를 90% 이상 제거하는 것을 절대 규칙으로 합니다.

# 지도

```
svpg-product-discovery/
├── 01_기초_및_개념_정립 (2007~2013)       디스커버리의 기원, 최적화와의 차이, 지속적 발견    카드 10장
├── 02_4대_리스크_및_협업_규칙 (2015~2019)  4대 리스크, 듀얼 트랙, 안티패턴, 애플 사례        카드 11장
├── 03_원격_발견_및_판단력_원칙 (2020~2021) 문제 vs 솔루션, 판단력, 데일리 프로토타입        카드 12장
└── 04_현대적_확장_및_AI_시대 (2023~2026)  리스크 분류학, 프로토타입 목적, Build to Learn  카드 7장

원문: ../../../../../../망고독 관련 자료/프로젝트_매니지먼트/What-s-in-my-head/4.🗄️(Archive) 보관/(Library) 망고네 도서관/(Articles) TECH Blog/svpg(인스파이어드)/Product Discovery/
```

# 전체 카드

## 01_기초 및 개념 정립 (2007~2013)
- [Product Discovery 정의와 3대 핵심 리스크 검증](C-2007-09-24_product_discovery.md) — 제품 발견의 본질은 사양서 작성이 아니라 가치, 사용성, 실현가능성의 3대 리스크를 선제적으로 검증하는 것이다.
- [시장 발견(Market Discovery)과 제품 발견(Product Discovery)의 분리](C-2008-05-12_market_discovery_vs_product_discovery.md) — 시장 기회를 발견하는 것과 실제 작동하는 구체적 제품 솔루션을 발견하는 것은 명확히 구분되어야 한다.
- [제품 발견(Discovery)과 국소 최적화(Optimization)의 경계](C-2009-09-08_product_discovery_vs_product_optimization.md) — A/B 테스트 기반 최적화에만 매몰되면 로컬 맥시멈에 갇히므로, 근본적 가치 도약을 위한 발견이 병행되어야 한다.
- [Product Discovery 계획 수립과 4단계 프레임워크](C-2009-10-12_the_product_discovery_plan.md) — 체계적인 디스커버리는 명확한 가설, 트라이어드 팀 구성, 프로토타입 전략으로 설계된다.
- [실제 디스커버리 1주일 실행 일지와 일일 리듬](C-2009-11-12_product_discovery_diary.md) — 월요일 가설 수립부터 금요일 검증 완료까지 주간 단위 디스커버리 루프의 실제 현장 기록.
- [비기술 제품 및 물리적 환경에서의 Product Discovery](C-2010-03-05_product_discovery_for_non_technology_products.md) — 소프트웨어가 아닌 하드웨어, 오프라인 서비스, 복합 제품에서도 프로토타입 기반 발견이 유효하다.
- [라이브 데이터 프로토타입(Live-Data Prototype)을 활용한 실증 검증](C-2011-02-20_product_discovery_with_live_data_prototypes.md) — 정적 와이어프레임으로는 알 수 없는 실제 트래픽과 사용자 행동 데이터를 수집하기 위한 최소 코드 스파이크.
- [디스커버리의 타임박싱(Time-Boxing)과 분석 마비 방지](C-2012-08-20_time_boxing_product_discovery.md) — 디스커버리는 끝없는 연구가 아니며, 1~2주의 엄격한 타임박스를 통해 의사결정 속도를 통제해야 한다.
- [지속적 제품 발견(Continuous Discovery)의 습관화](C-2012-10-24_continuous_discovery.md) — 디스커버리는 분기별 이벤트가 아니라, 매주 정기적으로 고객과 대면하는 상시적 운영 모델이어야 한다.
- [기존 대기업/성숙 기업의 디스커버리와 2대 보호 장치](C-2013-11-22_product_discovery_in_established_companies.md) — 성숙 기업은 스타트업과 달리 기존 매출/브랜드 및 기존 고객/직원을 보호하면서 혁신해야 한다.

## 02_4대 리스크 및 협업 규칙 (2015~2019)
- [디스커버리와 딜리버리의 듀얼 트랙 구조와 목적 분리](C-2015-10-22_discovery_vs_delivery.md) — 디스커버리는 학습을 위한 것이고 딜리버리는 상용 배포를 위한 것이며, 두 트랙은 동시 병렬로 순환해야 한다.
- [디스커버리 스프린트(Discovery Sprints)의 올바른 활용과 제약](C-2016-02-29_discovery_sprints.md) — 구글 벤처스의 디자인 스프린트를 제품 디스커버리에 적용할 때의 강점과 주의해야 할 엔지니어링 한계.
- [제품 발견의 계획 수립과 성과(Outcome) 중심 정렬](C-2016-11-28_planning_product_discovery.md) — 기능(Feature) 목록이 아니라 해결할 비즈니스 문제와 성과 지표(Outcome)로 디스커버리를 계획해야 한다.
- [Product Discovery 10대 함정과 안티패턴 카탈로그](C-2017-04-04_product_discovery_pitfalls_and_anti_patterns.md) — 현장 제품 조직들이 디스커버리를 흉내 내다 빠지는 10가지 치명적 실패 패턴과 극복법.
- [데이터 사이언스를 제품 발견의 핵심 동력으로 통합하기](C-2017-09-05_leveraging_data_science.md) — 데이터 사이언티스트를 사후 지표 분석가가 아닌 디스커버리 파트너로 초기부터 결합해야 한다.
- [제품 발견의 4대 핵심 리스크와 역할별 책임(R&R)](C-2017-12-04_the_four_big_risks.md) — 가치(Value), 사용성(Usability), 실현가능성(Feasibility), 사업성(Business Viability)의 4대 리스크 정의.
- [규제 환경(금융/의료/개인정보)에서의 Product Discovery](C-2018-01-29_product_discovery_in_regulated_environments.md) — 법무, 컴플라이언스, 정보보안 이해관계자를 적대자가 아닌 디스커버리 파트너로 초기 포섭하는 전략.
- [스케이트보드 vs 자동차 은유(MVP)의 치명적 오해와 진실](C-2018-05-31_skateboards_vs_cars_revisited.md) — MVP는 자동차 대신 스케이트보드를 파는 것이 아니라, 이동이라는 가치를 학습하기 위한 프로토타입이어야 한다.
- [애플(Apple)의 디스커버리 문화: 데모 중심의 창조적 선택(Creative Selection)](C-2018-09-28_product_discovery_at_apple.md) — 스티브 잡스 시절 애플의 소프트웨어 엔지니어 켄 코시엔다가 증언하는 데모 기반 제품 발견.
- [프로덕트 매니저가 자주 노출되는 4대 취약 영역과 코칭](C-2019-01-16_more_pm_problem_areas.md) — PM이 디스커버리를 그르치는 4대 원인: 비즈니스 문해력 부족, 데이터 왜곡, 엔지니어 신뢰 결여, 우선순위 부재.
- [진정한 협업(Collaboration)의 본질과 PM 코칭](C-2019-08-09_coaching_collaboration.md) — 협업은 타협(Compromise)이나 합의(Consensus)가 아니며, 엔지니어·디자이너와 함께 더 나은 솔루션을 공동 도출하는 것이다.

## 03_원격 발견 및 판단력 원칙 (2020~2021)
- [원격/재택 근무 환경에서의 Product Discovery 지속 전략](C-2020-04-13_discovery_when_working_remotely.md) — 원격 환경에서 발생하는 소통 단절과 기계적 스프린트 매몰을 방지하는 디지털 디스커버리 프랙티스.
- [Product Discovery 용어의 탄생 배경과 역사적 교훈](C-2020-06-01_the_origin_of_product_discovery.md) — 1990년대 HP와 이베이(eBay) 시절의 뼈아픈 워터폴 실패에서 왜 '발견(Discovery)'이 탄생했는가.
- [단순한 학습(Learning)과 진정한 제품 통찰(Insights)의 구별](C-2020-09-01_discovery_learning_vs_insights.md) — 고객 인터뷰에서 들은 단순한 사실(Fact) 나열을 넘어, 비즈니스 가치로 전환되는 통찰을 도출해야 한다.
- [문제 공간(Problem Space)과 솔루션 공간(Solution Space)의 오해](C-2020-09-04_discovery_problem_vs_solution.md) — 문제와 솔루션을 인위적으로 엄격히 분리하지 마라. 솔루션을 만져보면서 문제가 비로소 명확해진다.
- [데이터를 넘어선 제품 판단력(Product Judgement)의 가치](C-2020-09-10_discovery_judgement.md) — 데이터와 실험 지표가 모든 결정을 대신해 주지 않는다. 최종적인 혁신은 PM의 숙련된 판단력에서 나온다.
- [디스커버리 팀과 딜리버리 팀 분리의 치명적 위험성](C-2020-10-30_discovery_delivery.md) — 생각하는 팀(Discovery)과 코딩하는 팀(Delivery)을 별도로 쪼개는 것은 최악의 안티패턴이다.
- [심층 사고(Deep Thinking)를 위한 시간 블록 확보](C-2021-01-18_deep_thinking.md) — 백투백 회의에 갇힌 PM은 전략적 디스커버리를 할 수 없으므로, 깊은 사고를 위한 고립 시간을 보호해야 한다.
- [일일 프로토타입(Prototype of the Day) 의식과 공유 리듬](C-2021-02-13_prototype_of_the_day.md) — 원격 팀이 매일 최소 하나의 거친 프로토타입을 만들어 공유하고 피드백을 주고받는 일일 의식.
- [디스커버리를 회피하는 5대 변명(Excuses)과 논파](C-2021-03-27_discovery_excuses.md) — "고객 접근 불가", "시간 부족", "규제/보안" 등 현장에서 디스커버리를 기피하는 단골 핑계 격파.
- [도서 저작과 지식 체계화에서의 발견(Discovery) 프로세스](C-2021-06-14_so_you_want_to_write_a_book.md) — 전문 서적 저술 역시 하나의 거대한 프로덕트 디스커버리이며, 목차 프로토타이핑과 독자 피드백 루프로 완성된다.
- [디스커버리(Discovery)와 방대한 문서화(Documentation)의 충돌](C-2021-08-25_discovery_vs_documentation.md) — 수십 페이지의 PRD 문서를 작성하는 관료주의를 멈추고, 작동하는 인터랙티브 프로토타입을 단일 진실 공급원으로 삼아라.
- [비판적 피드백(Feedback) 수용과 제품 리더의 자아(Ego) 분리](C-2021-10-11_discovery_feedback.md) — 고객과 이해관계자의 부정적 피드백을 방어하지 않고, 치명적 리스크를 사전에 제거하는 축복으로 대해야 한다.

## 04_현대적 확장 및 AI 시대 (2023~2026)
- [SVPG Product Discovery 전체 아티클 시리즈 총괄 인덱스](C-2023-01-01_product_discovery_series.md) — SVPG가 15년 이상 발행해 온 제품 발견 아티클들을 4대 영역으로 집대성한 공식 가이드맵.
- [제품 리스크 분류학(Risk Taxonomy) 비교와 SVPG 권장 프레임워크](C-2023-07-10_product_risk_taxonomy.md) — 업계의 다양한 리스크 분류(IDEO, Lean, Pragmatic)를 비교 분석하고 SVPG 4대 리스크 모델의 우월성을 논증.
- [프로토타입의 4가지 본질적 목적과 현대적 활용법](C-2025-09-12_the_purpose_of_prototypes.md) — 학습(Learn), 소통(Communicate), 스펙(Spec), 동기화(Align)의 4대 프로토타입 목적 정의.
- [전방 배치 엔지니어(Forward Deployed Engineers, FDE)의 디스커버리 혁신](C-2025-09-17_forward_deployed_engineers.md) — 엔지니어가 고객 현장 최전선에 서서 기술적 타당성과 고객 가치를 실시간으로 발견하는 모델.
- [상용 제품(Commercial)과 사내 도구(Internal)의 디스커버리 역학 차이](C-2026-04-09_commercial_vs_internal_products.md) — 사내 도구는 강제 채택(Mandated Adoption)의 함정에 빠지기 쉬우므로 사용성보다 채택 동학을 정밀 발견해야 한다.
- [배우기 위한 빌드(Build to Learn)와 돈을 벌기 위한 빌드(Build to Earn)](C-2026-04-16_build_to_learn_vs_build_to_earn.md) — 디스커버리의 프로토타입 코드(Learn)와 딜리버리의 프로덕션 코드(Earn)를 절대 섞지 않는 대원칙.
- [AI 시대 Build to Learn 실행과 엔지니어링 실무 FAQ](C-2026-04-27_build_to_learn_faq.md) — Build to Learn을 실천할 때 조직이 겪는 딜레마(버리는 코드의 아까움, 엔지니어의 반발, 보안/규제) 해설.

# 가로축 — 전체를 관통하는 핵심 줄기

한 카드만 단편적으로 읽었을 때 놓치기 쉬운 거시적 연결고리.

1. **[리스크 모델의 진화와 R&R 확립]**
   [C-2007-09-24_product_discovery](C-2007-09-24_product_discovery.md) E2 → [C-2017-12-04_the_four_big_risks](C-2017-12-04_the_four_big_risks.md) E1~E4 → [C-2023-07-10_product_risk_taxonomy](C-2023-07-10_product_risk_taxonomy.md) E3
   → 초기 3대 리스크(가치/사용성/실현가능성)에서 사업성(Viability)이 추가되어 4대 리스크로 완성되고, PM-디자이너-엔지니어 간 명확한 오너십이 확립되는 계보.

2. **[프로토타이핑과 '버리는 코드' 철학]**
   [C-2011-02-20_product_discovery_with_live_data_prototypes](C-2011-02-20_product_discovery_with_live_data_prototypes.md) E4 → [C-2021-08-25_discovery_vs_documentation](C-2021-08-25_discovery_vs_documentation.md) E1 → [C-2025-09-12_the_purpose_of_prototypes](C-2025-09-12_the_purpose_of_prototypes.md) E1~E4 → [C-2026-04-16_build_to_learn_vs_build_to_earn](C-2026-04-16_build_to_learn_vs_build_to_earn.md) E1~E3
   → 문서 작성을 멈추고 프로토타입으로 스펙을 대체하며, '학습을 위해 버리는 코드(Build to Learn)'와 '수익을 창출하는 프로덕션(Build to Earn)'을 엄격히 분리하는 엔지니어링 패러다임.

3. **[크로스펑셔널 팀과 엔지니어링 참여]**
   [C-2015-10-22_discovery_vs_delivery](C-2015-10-22_discovery_vs_delivery.md) E3 → [C-2018-09-28_product_discovery_at_apple](C-2018-09-28_product_discovery_at_apple.md) E3 → [C-2019-08-09_coaching_collaboration](C-2019-08-09_coaching_collaboration.md) E1~E4 → [C-2020-10-30_discovery_delivery](C-2020-10-30_discovery_delivery.md) E1~E3 → [C-2025-09-17_forward_deployed_engineers](C-2025-09-17_forward_deployed_engineers.md) E1
   → 엔지니어를 단순 코딩 하청으로 격리하는 안티패턴을 타파하고, 애플의 데모 문화부터 현장 FDE까지 엔지니어가 디스커버리의 공동 주역으로 도약하는 조직적 흐름.

4. **[문제 공간과 솔루션 공간의 나선형 통합]**
   [C-2008-05-12_market_discovery_vs_product_discovery](C-2008-05-12_market_discovery_vs_product_discovery.md) E1 → [C-2018-05-31_skateboards_vs_cars_revisited](C-2018-05-31_skateboards_vs_cars_revisited.md) E2 → [C-2020-09-04_discovery_problem_vs_solution](C-2020-09-04_discovery_problem_vs_solution.md) E1 → [C-2020-09-10_discovery_judgement](C-2020-09-10_discovery_judgement.md) E1
   → 문제를 다 정의한 후 솔루션을 만드는 것이 아니라, 거친 솔루션을 직접 만져보며 고객과 팀이 진짜 문제를 재정의해 나가는 나선형 탐색과 제품 판단력.

# 어디로 갈지 (목적별 라우팅 테이블)

| 개발/설계 시 필요한 질문 | 바로 가야 할 카드 |
|---|---|
| 디스커버리에서 확인해야 할 4대 핵심 리스크와 담당자는 누구인가? | [C-2017-12-04_the_four_big_risks](C-2017-12-04_the_four_big_risks.md) |
| 기능 명세서(PRD) 대신 프로토타입으로 개발 스펙을 대체하고 싶다면? | [C-2021-08-25_discovery_vs_documentation](C-2021-08-25_discovery_vs_documentation.md) |
| 프로토타입 코드가 프로덕션으로 흘러들어가는 기술 부채를 막으려면? | [C-2026-04-16_build_to_learn_vs_build_to_earn](C-2026-04-16_build_to_learn_vs_build_to_earn.md) |
| 엔지니어와 디자이너가 진정으로 협업하는 일일 리듬을 구축하려면? | [C-2019-08-09_coaching_collaboration](C-2019-08-09_coaching_collaboration.md) / [C-2021-02-13_prototype_of_the_day](C-2021-02-13_prototype_of_the_day.md) |
| A/B 테스트 최적화에만 갇혀 로컬 맥시멈에 빠졌을 때 탈출하려면? | [C-2009-09-08_product_discovery_vs_product_optimization](C-2009-09-08_product_discovery_vs_product_optimization.md) |
| MVP를 어설픈 1.0 제품으로 출시했다가 브랜드가 망가지는 것을 피하려면? | [C-2018-05-31_skateboards_vs_cars_revisited](C-2018-05-31_skateboards_vs_cars_revisited.md) |
| 규제 산업(금융/의료)에서 법무팀의 사후 딴지를 사전에 차단하려면? | [C-2018-01-29_product_discovery_in_regulated_environments](C-2018-01-29_product_discovery_in_regulated_environments.md) |
| 엔터프라이즈 B2B 고객의 현장에서 엔지니어가 직접 디스커버리를 수행하려면? | [C-2025-09-17_forward_deployed_engineers](C-2025-09-17_forward_deployed_engineers.md) |
| 사내 임직원용 내부 도구를 만들 때 직원들의 저항을 없애려면? | [C-2026-04-09_commercial_vs_internal_products](C-2026-04-09_commercial_vs_internal_products.md) |
| AI 코딩 도구를 활용해 검증 루프를 극적으로 단축하는 실행 FAQ가 필요하다면? | [C-2026-04-27_build_to_learn_faq](C-2026-04-27_build_to_learn_faq.md) |
