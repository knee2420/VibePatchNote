---
type: card
title: "디스커버리와 딜리버리의 듀얼 트랙 구조와 목적 분리"
description: "디스커버리는 학습을 위한 것이고 딜리버리는 상용 배포를 위한 것이며, 두 트랙은 동시 병렬로 순환해야 한다."
resource: "../../../../../../망고독 관련 자료/프로젝트_매니지먼트/What-s-in-my-head/4.🗄️(Archive) 보관/(Library) 망고네 도서관/(Articles) TECH Blog/svpg(인스파이어드)/Product Discovery/2015-10-22 Discovery vs. Delivery.md"
timestamp: 2026-09-24
---

# summary
제품 팀의 작업은 발견(Discovery)과 배포(Delivery)라는 두 개의 트랙으로 나뉜다. **디스커버리의 목적은 가치 있는 백로그 아이템을 빠르게 검증하는 것이며, 딜리버리의 목적은 프로덕션 품질의 견고한 소프트웨어를 안정적으로 배포하는 것**이다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | Dual-Track Agile 구조 | 발견 트랙과 배포 트랙이 1~2스프린트 시차를 두고 병렬 실행되는 상호작용 모델 | `# Discovery vs. Delivery` |
| E2 | 비교 | Discovery vs Delivery 성격 대비 | 학습 속도와 버릴 수 있는 코드(Discovery) vs 가용성, 보안, 확장성(Delivery) | `# Discovery vs. Delivery` |
| E3 | 규칙 | 동일 팀의 두 트랙 동시 수행 | 별도 팀으로 쪼개지 않고 단일 크로스펑셔널 팀이 두 트랙을 모두 소유 | `# Discovery vs. Delivery` |
| E4 | 안티패턴 | 딜리버리 올인(Delivery-Only Trap) | 무엇을 만들지 고민하지 않고 스프린트 백로그 티켓 쳐내기에만 매몰되는 공장화 | `# Discovery vs. Delivery` |

# 밖으로
- [E3] 단일 팀 원칙은 5년 뒤 `[C-2020-10-30_discovery_delivery.md](C-2020-10-30_discovery_delivery.md)`에서 팀 분리 안티패턴으로 더욱 강하게 비판된다.
- [E2] 성격 대비는 `[C-2026-04-16_build_to_learn_vs_build_to_earn.md](C-2026-04-16_build_to_learn_vs_build_to_earn.md)`의 핵심 철학적 기초다.

# 원문
[아카이브 원본](../../../../../../%EB%A7%9D%EA%B3%A0%EB%8F%85%20%EA%B4%80%EB%A0%A8%20%EC%9E%90%EB%A3%8C/%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8_%EB%A7%A4%EB%8B%88%EC%A7%80%EB%A8%BC%ED%8A%B8/What-s-in-my-head/4.%F0%9F%97%84%EF%B8%8F%28Archive%29%20%EB%B3%B4%EA%B4%80/%28Library%29%20%EB%A7%9D%EA%B3%A0%EB%84%A4%20%EB%8F%84%EC%84%9C%EA%B4%80/%28Articles%29%20TECH%20Blog/svpg%28%EC%9D%B8%EC%8A%A4%ED%8C%8C%EC%9D%B4%EC%96%B4%EB%93%9C%29/Product%20Discovery/2015-10-22%20Discovery%20vs.%20Delivery.md)
