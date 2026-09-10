---
name: develop_50_back_generator
description: "사용자가 순수 백엔드(FastAPI) 비즈니스 로직, 라우터, 스키마, 저장소 개발을 요청할 때 발동합니다. 라우터·유스케이스·포트/어댑터의 관심사 분리와 데이터 수명주기 등급을 강제합니다."
---

# Pure Backend Development Checklist & Generator

이 스킬은 사용자가 백엔드(`apps/api`)의 **LLM 이 개입하지 않는** 기능 구현을 지시할 때 발동합니다.
LLM 을 호출한다면 이 스킬이 아니라 [`develop_50_back_llm_generator`](../develop_50_back_llm_generator/SKILL.md) 입니다.

> ⛔ **선행 조건:** 이 체크리스트는 요약 점검표입니다. 충돌 시 아래 정본이 우선합니다.
> 1. [`.agents/rules/00-core/rule.md`](../../rules/00-core/rule.md) — 헌법 (§3.2 백엔드 배치)
> 2. [`.agents/rules/50-develop/convention/back/rule.md`](../../rules/50-develop/convention/back/rule.md) — 상세본
> 3. [`.agents/rules/60-data/rule.md`](../../rules/60-data/rule.md) — 데이터 수명주기 등급
>
> 정본 참조 구현: `apps/api/app/documents/` 의 `router.py` / `service.py` / `ports.py` /
> `use_cases/register_document.py` / `adapters/local_document_source_repository.py`

## 📋 [Pure Backend Development Checklist]

### 1. 관심사 분리 (Separation of Concerns)

- [ ] **Router 책임 제한:** `router.py` 가 HTTP 입출력만 담당하고, 비즈니스 로직·파일 접근·
      DB 쿼리를 직접 하지 않는가? **함수 본문 안의 import 가 없는가?**
- [ ] **Service 는 얇은가:** `service.py` 가 식별자 정규화와 유스케이스 위임만 하는가?
      조건 분기가 쌓이기 시작했다면 `use_cases/` 로 내려야 할 로직이 올라온 것입니다.
- [ ] **Use Case 단위:** 유스케이스 하나당 파일 하나로 `use_cases/` 에 두었는가?

### 2. 스키마 및 데이터 검증 (Schemas)

- [ ] **Pydantic 모델 적용:** 요청/응답이 `schemas.py` 에 엄격히 정의·검증되는가?
- [ ] **전송 ↔ 영속 분리:** HTTP 스키마(`schemas.py`)와 영속 모델(`models.py`)을 분리했는가?
      저장 형태와 전송 형태를 한 모델로 겸하면 둘 중 하나가 반드시 오염됩니다.
- [ ] **식별자를 추측하지 않는가:** 요청에 식별자가 없으면 **거절**하는가?
      (서버가 "아마 이 문서겠지" 하고 고르지 않는다)

### 3. 포트와 어댑터 (Ports & Adapters)

- [ ] **계약에만 의존:** 유스케이스가 구체 클래스가 아닌 `ports.py` 의 `Protocol` 을 받는가?
- [ ] **어댑터가 레이아웃 소유:** 파일명 규격·디렉터리 구조는 `adapters/` 안에만 있는가?
- [ ] **수명주기가 다르면 포트도 분리:** 원본(`data/`)·산출물(`data/`)·결정적 파생(`cache/`)을
      한 포트로 합치지 않았는가?
- [ ] **컨테이너에서만 조립:** 구현체 선택과 **저장 등급 루트 주입**이
      `bootstrap/container.py` 에만 있는가? 모듈 전역 싱글턴을 만들지 않았는가?

### 4. 데이터 수명주기 등급 (필수)

> 판정 두 줄 — ① 같은 입력으로 다시 돌려 바이트가 같으면 `cache/`, 아니면 `data/`.
> ② 프로세스가 죽었을 때 잃으면 안 되면 `data/`, 아니면 `state/`.

- [ ] **등급을 정했는가:** 새로 저장하는 것이 `config/` `data/` `cache/` `state/` 중 어디인지
      명시적으로 판정했는가?
- [ ] **경로를 직접 만들지 않았는가:** `core/storage` 의 등급 루트를 **주입받아** 썼는가?
      `settings` 에서 경로를 꺼내 쓰면 `import-linter` 계약이 막습니다.
- [ ] **식별자가 대리키인가:** 파일명·제목을 경로 키로 쓰지 않고 `new_id()` 로 발급했는가?
      경로 세그먼트를 `safe_segment()` 로 검증했는가? (치환하지 않고 **거부**한다)
- [ ] **원자적으로 썼는가:** JSON 은 `write_json()`(임시 파일 → 교체)으로 기록했는가?
      쓰다가 죽으면 반쯤 쓰인 파일이 남고, 그것을 "파일 없음"과 구분하지 못하면
      사용자 데이터가 조용히 초기화됩니다.
- [ ] **삭제를 연쇄시켰는가:** 새 파생물을 만들었다면 문서 삭제 유스케이스가 그것도 지우는가?

### 5. 설정의 단일 출처 (`app/core/config.py`)

- [ ] **호스트 하드코딩 금지:** 응답의 외부 URL에 `http://127.0.0.1:8000` 을 직접 쓰지 않고
      `settings.public_base_url` 을 경유했는가?
- [ ] **CORS 화이트리스트:** `allow_origins=["*"]` 대신 `settings.cors_origins` 를 썼는가?
- [ ] **경로는 config 가 아니다:** 저장 경로를 `settings` 에 새로 추가하지 않았는가?
      (등급 루트는 `core/storage/paths.py` 소유)
- [ ] **입력 경로 검증:** 사용자 입력 파일명을 그대로 경로에 합치지 않았는가?

### 6. 에러 핸들링 (Error Handling)

- [ ] **명시적 예외 처리:** 외부 연동 실패를 감싸 서버가 죽지 않게 했는가?
- [ ] **번역은 라우터에서:** 유스케이스는 도메인 오류를 던지고, `HTTPException` 변환은
      `router.py` 에서만 하는가?
- [ ] **실패를 위장하지 않는가:** 빈 결과나 폴백을 정상 응답으로 돌려주지 않는가?

### 7. 도메인 세그먼트 검증

```text
app/<도메인>/  __init__.py  router.py  schemas.py  models.py  errors.py
               service.py  ports.py  use_cases/  agents/  adapters/  prompts.py
```

- [ ] **세그먼트 고정:** 위 이름 밖의 모호한 최상위 파일(`storage.py`, `utils.py`,
      `helpers.py`)을 만들지 않았는가?
- [ ] **Public API:** 새 도메인이면 `__init__.py` 를 함께 만들었는가?
- [ ] **도메인 간 직접 참조 금지:** 다른 도메인이 필요하면 **자기 `ports.py`** 에 계약을
      정의하고 컨테이너가 주입하게 했는가? (직접 import 는 `import-linter` 가 막습니다)

### 8. 무결성 검증 (완료 게이트)

- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm --filter @vibe/api test` 를
      **실제로 실행**해 통과를 확인했는가?
- [ ] 앱 임포트 확인(`python -c "import main"`)을 했는가?
- [ ] **엔드포인트 실호출:** 변경/추가한 엔드포인트를 실제로 호출해 응답과 상태 코드를
      확인했는가? (스키마만 맞춘 것은 검증이 아닙니다)
- [ ] 저장 레이아웃을 바꿨다면 `pnpm -F @vibe/api migrate:status` 로 확인하고
      `migrations/` 단계와 `STORAGE_VERSION` 을 함께 올렸는가?

---

## 🤖 에이전트 행동 지침 (Agent Prompt)

이 스킬이 활성화되면, 에이전트는 코드 작성을 마친 후 다음과 같이 대답해야 합니다.

> "지시하신 순수 백엔드 구현을 완료했습니다. `develop_50_back_generator` 체크리스트 점검 결과:
> 1. 관심사 분리 (통과/위반 사유)
> 2. 스키마 검증 (통과/위반 사유)
> 3. 포트와 어댑터 (통과/위반 사유)
> 4. 데이터 수명주기 등급 (어느 등급에 두었는지 + 근거)
> 5. 설정 단일 출처 (통과/위반 사유)
> 6. 에러 핸들링 (통과/위반 사유)
> 7. 도메인 세그먼트 (통과/위반 사유)
> 8. 무결성 검증 (실행한 명령과 결과)"
