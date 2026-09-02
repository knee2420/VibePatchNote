---
type: index
title: "01_core (Core LLM Backend)"
description: "Dify 백엔드의 최상위 코어 로직(모델 추상화, 워크플로우 엔진, 도구 등) 허브"
resource: "../../../../99.archive/dify/api/core"
timestamp: "2026-09-02"
---

# 이 섹션은

Dify의 백엔드 로직 중 프론트엔드/API와 독립적으로 동작하는 **순수 LLM 엔진 및 워크플로우 런타임** 계층이다. 
FastAPI 등 웹 프레임워크와 완전히 분리(Decoupling)되어 객체 지향적으로 구성된 모듈들로 이루어져 있다.
우리가 구축할 백엔드 하네스(엔진) 설계 시 가장 중요한 참고점이 된다.

# 카드

| 카드 | 핵심 가치 (값나가는 것) | elements |
|---|---|---|
| [C-model_manager](C-model_manager.md) | 모든 LLM 벤더를 단일 인터페이스로 묶는 추상화 모델 | 4 |
| [C-provider_manager](C-provider_manager.md) | 테넌트 레벨의 공급자 설정 및 할당 로직 | 4 |

# 이 섹션 밖

- [선행 조건: Dify 앱 설정(app/)에서 이 코어 로직을 주입받아 사용]
- [하위 연결: `workflow/` 및 `model_runtime/` 폴더로의 상세 진입점]
