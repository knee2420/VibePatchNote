---
name: develop_50_back_generator
description: "사용자가 순수 백엔드(FastAPI) 비즈니스 로직, 라우터, 스키마 개발을 요청할 때 발동합니다. 라우터와 서비스의 철저한 관심사 분리 및 Pydantic 기반 스키마 검증을 강제합니다."
---

# Pure Backend Development Checklist & Generator

이 스킬은 사용자가 백엔드(`apps/api`)의 일반적인 서버 인프라, 비즈니스 로직, 라우터(`routes`), 스키마(`schemas`) 등 **순수 백엔드(Non-LLM) 기능** 구현을 지시할 때 발동합니다.
에이전트는 코드 작성을 전후하여 반드시 아래의 **체크리스트**를 스스로 점검하고 결과를 사용자에게 보고해야 합니다.

## 📋 [Pure Backend Development Checklist]

### 1. 관심사 분리 (Separation of Concerns)
- [ ] **Router 책임 제한:** `routes` 레이어에 직접 무거운 비즈니스 로직이나 DB 쿼리를 작성하지 않고, 오직 HTTP 요청/응답 제어만 담당하고 있는가?
- [ ] **Service 위임:** 실제 핵심 비즈니스 로직은 `services` 레이어 함수로 위임하여 호출하고 있는가?

### 2. 스키마 및 데이터 검증 (Schemas)
- [ ] **Pydantic 모델 적용:** 요청(Request)과 응답(Response) 데이터 구조가 `schemas` 레이어의 Pydantic 모델로 엄격하게 정의되고 검증되는가?
- [ ] **ORM 분리:** (DB 사용 시) DB 엔티티 모델과 API 통신용 스키마 모델을 명확히 분리했는가?

### 3. LLM 로직과의 격리 (Isolation from LLM)
- [ ] **경계 준수:** 프롬프트 템플릿, AI 에이전트 생성, 워크플로우 제어 로직 등은 이 스킬의 범위를 벗어나므로(`core/workflow` 등), 순수 백엔드 로직에 섞여 들어가지 않도록 분리했는가?

### 4. 에러 핸들링 (Error Handling)
- [ ] **명시적 예외 처리:** 서버 다운 방지를 위해 적절한 `try-except` 블록을 사용하고, `HTTPException`을 통해 클라이언트에게 명확한 상태 코드와 메시지를 반환하고 있는가?

### 5. 모노레포 위치 검증
- [ ] **경로 확인:** 코드가 반드시 `apps/api/app/` 하위(`routes`, `services`, `schemas` 등)에 올바르게 배치되었는가?

---

## 🤖 에이전트 행동 지침 (Agent Prompt)
이 스킬이 활성화되면, 에이전트는 코드 작성을 마친 후 다음과 같이 대답해야 합니다.

> "지시하신 순수 백엔드 구현을 완료했습니다. `develop_50_back_generator` 체크리스트 점검 결과:
> 1. 관심사 분리 (통과/위반 사유)
> 2. 스키마 검증 (통과/위반 사유)
> 3. LLM 로직 격리 (통과/위반 사유)
> 4. 에러 핸들링 (통과/위반 사유)
> 5. 모노레포 경로 (통과/위반 사유)"
