---
type: card
title: "라이브 데이터 프로토타입(Live-Data Prototype)을 활용한 실증 검증"
description: "정적 와이어프레임으로는 알 수 없는 실제 트래픽과 사용자 행동 데이터를 수집하기 위한 최소 코드 스파이크."
resource: "../../../../../../망고독 관련 자료/프로젝트_매니지먼트/What-s-in-my-head/4.🗄️(Archive) 보관/(Library) 망고네 도서관/(Articles) TECH Blog/svpg(인스파이어드)/Product Discovery/2011-02-20 Product Discovery With Live-Data Prototypes.md"
timestamp: 2026-09-24
---

# summary
사용자가 실제로 자신의 데이터를 사용하고 트랜잭션을 일으키는지 확인하려면 정적 프로토타입만으로는 부족하다. **라이브 데이터 프로토타입은 상용 배포가 아니라 오직 '실제 행동 데이터 수집'만을 위해 제한된 트래픽에 띄우는 초경량 실험 코드**다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 도구 | Live-Data Prototype 정의 | 프로덕션 품질이 아닌 학습 목적의 1회성 실데이터 연결 프로토타입 | `# Product Discovery With Live-Data Prototypes` |
| E2 | 규칙 | 배포 스코프의 제한 | 전체 사용자 대상 릴리즈가 아닌 1~5%의 특정 타겟군 대상 샌드박스 노출 | `# Product Discovery With Live-Data Prototypes` |
| E3 | 안티패턴 | 프로토타입의 프로덕션 코드 전용 | 학습용으로 날림 작성된 프로토타입 코드를 리팩토링 없이 상용 제품에 밀어 넣는 행위 | `# Product Discovery With Live-Data Prototypes` |
| E4 | 아키텍처 | 버릴 수 있는 코드(Throwaway Code) 아키텍처 | 가설 검증 후 미련 없이 폐기할 수 있도록 기존 코어 아키텍처와 느슨하게 결합 | `# Product Discovery With Live-Data Prototypes` |

# 밖으로
- [E1] 라이브 데이터 프로토타입은 15년 뒤 `[C-2026-04-16_build_to_learn_vs_build_to_earn.md](C-2026-04-16_build_to_learn_vs_build_to_earn.md)`의 'Build to Learn' 개념으로 완성된다.

# 원문
[아카이브 원본](../../../../../../%EB%A7%9D%EA%B3%A0%EB%8F%85%20%EA%B4%80%EB%A0%A8%20%EC%9E%90%EB%A3%8C/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8_%EB%A7%A4%EB%8B%88%EC%A7%80%EB%A8%BC%ED%8A%B8/What-s-in-my-head/4.%F0%9F%97%84%EF%B8%8F%28Archive%29%20%EB%B3%B4%EA%B4%80/%28Library%29%20%EB%A7%9D%EA%B3%A0%EB%84%A4%20%EB%8F%84%EC%84%9C%EA%B4%80/%28Articles%29%20TECH%20Blog/svpg%28%EC%9D%B8%EC%8A%A4%ED%8C%8C%EC%9D%B4%EC%96%B4%EB%93%9C%29/Product%20Discovery/2011-02-20%20Product%20Discovery%20With%20Live-Data%20Prototypes.md)
