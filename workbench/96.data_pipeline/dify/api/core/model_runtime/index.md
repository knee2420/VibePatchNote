---
type: index
title: "03_model_runtime (LLM Vendor Plugins)"
description: "각 벤더(OpenAI, Anthropic 등)별 구체적인 API 호출 로직과 설정값을 담고 있는 런타임 플러그인 계층"
resource: "../../../../../99.archive/dify/api/core/model_runtime"
timestamp: "2026-09-02"
---

# 이 섹션은

단일 추상화 객체(`ModelInstance`)에서 실제로 각 벤더의 REST API로 요청을 쏘는 부분이다. 토큰 계산, 에러 규격화(RateLimit, Auth Error 등) 및 벤더별 모델 프로바이더 세부 구현체가 모여 있다.

# 카드

- (스코프 제한: 이 계층의 방대한 플러그인 코드는 현재 추출에서 제외되었으며, 상위 래퍼인 `[C-model_manager](../C-model_manager.md)`를 참조 바람)

# 이 섹션 밖

- [상위 연결: `../index.md` 코어 허브]
