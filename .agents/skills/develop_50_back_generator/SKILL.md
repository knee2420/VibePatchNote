---
name: develop_50_back_generator
description: "사용자가 순수 백엔드(FastAPI) 비즈니스 로직, 라우터, 스키마 개발을 요청할 때 발동합니다. 라우터와 서비스의 철저한 관심사 분리 및 Pydantic 기반 스키마 검증을 강제합니다."
---

# Pure Backend Development Checklist & Generator

이 스킬은 사용자가 백엔드(`apps/api`)의 일반적인 서버 인프라, 비즈니스 로직, 도메인 패키지(`apps/api/app/[도메인명]/`) 등 **순수 백엔드(Non-LLM) 기능** 구현을 지시할 때 발동합니다.
에이전트는 코드 작성을 전후하여 반드시 아래의 **체크리스트**를 스스로 점검하고 결과를 사용자에게 보고해야 합니다.

> ⛔ **선행 조건:** 이 체크리스트는 [`.agents/rules/00-core/rule.md`](../../rules/00-core/rule.md)의 요약 점검표입니다. 충돌 시 `00-core`가 우선합니다.
> 정본 참조 구현: `apps/api/app/workspaces/` 의 `router.py` / `schemas.py` / `service.py`

## 📋 [Pure Backend Development Checklist]

### 1. 관심사 분리 (Separation of Concerns)
- [ ] **Router 책임 제한:** 각 도메인의 `router.py`에 직접 무거운 비즈니스 로직이나 DB 쿼리를 작성하지 않고, 오직 HTTP 요청/응답 제어만 담당하고 있는가?
- [ ] **Service 위임:** 실제 핵심 비즈니스 로직은 도메인 내부의 `service.py` 함수로 위임하여 호출하고 있는가?

### 2. 스키마 및 데이터 검증 (Schemas)
- [ ] **Pydantic 모델 적용:** 요청(Request)과 응답(Response) 데이터 구조가 해당 도메인의 `schemas.py`에 Pydantic 모델로 엄격하게 정의되고 검증되는가?
- [ ] **ORM 분리:** (DB 사용 시) DB 엔티티 모델과 API 통신용 스키마 모델을 명확히 분리했는가?

### 3. LLM 로직과의 격리 (Isolation from LLM)
- [ ] **경계 준수:** 프롬프트 템플릿, AI 에이전트 생성, 워크플로우 제어 로직 등은 이 스킬의 범위를 벗어나므로(`core/workflow` 등), 순수 백엔드 로직에 섞여 들어가지 않도록 분리했는가?

### 4. 에러 핸들링 (Error Handling)
- [ ] **명시적 예외 처리:** 서버 다운 방지를 위해 적절한 `try-except` 블록을 사용하고, `HTTPException`을 통해 클라이언트에게 명확한 상태 코드와 메시지를 반환하고 있는가?

### 5. 도메인 주도 패키지 경로 검증
- [ ] **경로 확인:** 코드가 특정 기능 단위의 도메인 폴더(예: `apps/api/app/[도메인명]/`) 하위에 올바르게 배치되었으며, 그 안에서 `router.py`, `service.py`, `schemas.py`로 분할되었는가?
- [ ] **스텁도 3분할:** 아직 구현이 비어 있는 도메인이라도 `schemas.py` / `service.py` 골격을 갖췄는가? (router 안에 Pydantic 모델을 인라인 선언하지 않았는가?)

### 6. 설정·경로의 단일 출처 (`app/core/config.py`)
- [ ] **상대 경로 금지:** 파일 경로를 `"uploads"` 같은 상대 경로 문자열로 쓰지 않고, `settings.upload_dir` / `settings.db_file` 등 `app/core/config.py`의 값을 사용했는가? (상대 경로는 실행 위치에 따라 다른 곳을 가리킵니다)
- [ ] **호스트 하드코딩 금지:** 응답에 외부 URL을 담을 때 `http://127.0.0.1:8000`을 직접 쓰지 않고 `settings.public_base_url`을 경유했는가?
- [ ] **CORS 화이트리스트:** `allow_origins=["*"]`를 쓰지 않고 `settings.cors_origins`를 사용했는가?
- [ ] **입력 경로 검증:** 사용자 입력 파일명을 그대로 `os.path.join` 하지 않고, 경로 구분자를 제거해 업로드 디렉터리 밖으로 벗어나지 못하게 막았는가?

### 7. 무결성 검증 (완료 게이트)
- [ ] **임포트 확인:** `apps/api`에서 앱이 정상 임포트되는가?
- [ ] **엔드포인트 실호출:** 변경/추가한 엔드포인트를 실제로 호출해 응답과 상태 코드를 확인했는가? (스키마만 맞춘 것은 검증이 아닙니다)

---

## 🤖 에이전트 행동 지침 (Agent Prompt)
이 스킬이 활성화되면, 에이전트는 코드 작성을 마친 후 다음과 같이 대답해야 합니다.

> "지시하신 순수 백엔드 구현을 완료했습니다. `develop_50_back_generator` 체크리스트 점검 결과:
> 1. 관심사 분리 (통과/위반 사유)
> 2. 스키마 검증 (통과/위반 사유)
> 3. LLM 로직 격리 (통과/위반 사유)
> 4. 에러 핸들링 (통과/위반 사유)
> 5. 도메인 주도 패키지 경로 (통과/위반 사유)
> 6. 설정·경로 단일 출처 (통과/위반 사유)
> 7. 무결성 검증 (통과/위반 사유)"
