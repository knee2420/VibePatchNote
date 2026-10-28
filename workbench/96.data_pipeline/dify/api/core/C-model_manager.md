---
type: card
title: "Model Manager (모델 호출 추상화)"
description: "각 벤더(OpenAI, Anthropic 등)의 구체적인 모델 호출 로직을 ModelRuntime 인터페이스로 추상화하고 할당량(Quota)을 관리하는 코어 매니저"
resource: "../../../../99.archive/dify/api/core/model_manager.py"
timestamp: "2026-09-02"
---

# summary
**프론트엔드나 비즈니스 로직이 특정 LLM 벤더에 종속되지 않도록 단일 인터페이스(ModelInstance)로 추상화**한다. 라운드 로빈(Round-robin) 방식의 로드 밸런싱과 시스템 할당량(Quota) 관리 로직이 결합되어 안정적인 호출을 보장한다.

# elements
| id | kind | label | 무엇이 들어있나 | anchor |
|---|---|---|---|---|
| E1 | 아키텍처 | ModelInstance 객체 | 단일 모델 인스턴스화 및 벤더 공통 자격 증명(Credentials) 병합 로직 | `## class ModelInstance:` |
| E2 | 인터페이스 | invoke_llm | `PromptMessage` 시퀀스를 받아 스트리밍(Generator) 또는 완성된 결과를 반환하는 핵심 호출부 | `## def invoke_llm` |
| E3 | 규칙 | Round-robin 로드 밸런싱 | 단일 벤더 API 제한(Rate limit) 극복을 위해 여러 키를 순환하며 호출하는 예외 처리 | `## def _round_robin_invoke` |
| E4 | 아키텍처 | QuotaManagedModelInstance | 시스템 호스팅 모델의 경우 호출 전후로 할당량(Quota)을 예약하고 차감(Commit/Release)하는 래퍼 클래스 | `## class QuotaManagedModelInstance` |

# 밖으로
- [E4] 할당량 관리는 `[C-provider_manager](C-provider_manager.md)`의 테넌트별 공급자 설정(ProviderConfiguration) 상태에 의존한다 — 먼저 참조 필요.
- ⚠️ [벤더별 실제 API 호출 로직은 이 파일이 아닌 `model_providers/` 하위의 개별 플러그인에 분리되어 있음]

# 원문
[model_manager.py 원본](../../../../99.archive/dify/api/core/model_manager.py)
