---
description: "백엔드(apps/api) 레이어·포트/어댑터·패키지 경계 컨벤션"
---

# ⚙️ Backend Principles (apps/api)

이 문서는 백엔드(`apps/api`) 개발 시 지켜야 할 아키텍처와 철학을 정의합니다.
**정본은 [`00-core/rule.md`](../../../00-core/rule.md) 이며, 충돌하면 그쪽을 따릅니다.** 이 문서는 그 §3.3~3.5 의 상세본입니다.

---

## 1. 레이어 준수 — 프론트의 FSD 에 대응하는 백엔드 수직 계층

* **원칙:** 모든 코드는 역할에 따라 엄격한 수직 계층을 따르며, **순서가 곧 의존 방향**입니다.

```text
bootstrap → <도메인> → core → packages/scaffold-engine
──────────────────────────────────────────────▶  import 가능 방향은 오른쪽뿐
```

| 레이어 | 담는 것 | 프론트 대응 |
| --- | --- | --- |
| `bootstrap/` | 객체 그래프 조립(DI 컨테이너). **여기서만** 구현체와 저장 등급 루트를 고른다 | `app/providers` |
| `<도메인>/` | HTTP · 유스케이스 · 계약 · 구현 (`documents`, `scaffolds`, `workspaces`, `llm_settings`) | `features` / `entities` |
| `core/` | 도메인 무관 인프라 — 설정, 로깅, LLM 하네스·관측, Agent Runtime, 저장 게이트 | `shared` |

* **규칙:**
  - 하위 레이어는 상위 레이어를 참조하지 않습니다. **`core` 가 도메인을 import 하면 위반입니다.**
  - **도메인끼리는 어떤 경우에도 직접 참조하지 않습니다.** 예외는 없습니다.
  - 각 도메인은 반드시 `__init__.py`(Public API)를 통해서만 외부에 노출합니다.

* **도메인 간 협력은 포트 역전으로만 합니다.**

```text
documents ──X── 직접 참조 금지 ──X──▶ scaffolds
documents ───▶ ScaffoldArchivePort (자기 ports.py) ◀─── container 가 구현체 주입
```

  과거에는 `documents → scaffolds` 단방향 참조를 허용했고, 근거는
  "저장 경로 `storage/documents/{slug}/scaffolds/{id}/` 가 종속을 표현한다" 였습니다.
  **그 경로가 사라지면서 근거도 사라졌습니다.** 스캐폴드는 이제
  `data/knowledge/scaffolds/{scaffold_id}` 에 자기 식별자로 놓이고 `doc_id` 로만
  문서를 역참조하는 **별개의 애그리거트**입니다.

  documents 가 스캐폴드를 지워야 할 때(문서 삭제 연쇄)는 자기 `ports.py` 에
  `ScaffoldArchivePort` 를 정의하고, `bootstrap/container.py` 가
  `ScaffoldArchiveService` 를 주입합니다. documents 는 그 안을 알지 못합니다.

  `workspaces` 는 어느 도메인도 참조하지 않습니다. 세션은 포인터(`docId`, `scaffoldId`)만
  보관하고 본문을 갖지 않으며, 조합은 프론트가 합니다.

* **강제 수단:** `pnpm lint` 가 `compileall` + `ruff` + `lint-imports` 를 실행합니다.
  현재 계약 6건:

| 계약 | 막는 것 |
| --- | --- |
| Core must not import domains | `app.core` → 모든 도메인 |
| Agent Runtime is domain agnostic | `core.agent_runtime` → 도메인·`core.config`·`scaffold_engine` |
| Storage paths are known only to adapters and bootstrap | use_cases·service·agents → `app.core.config` |
| Documents must not depend on other domains | `documents` → `scaffolds`·`workspaces` |
| Scaffolds must not depend on other domains | `scaffolds` → `documents`·`workspaces` |
| Workspaces must not depend on document domains | `workspaces` → `documents`·`scaffolds` |

---

## 2. 포트와 어댑터 (Ports & Adapters)

* **원칙:** 유스케이스(`service.py`)는 **계약(Protocol)에만 의존**하고 구현을 모릅니다. 구현체 선택은 조립 시점에 결정됩니다.
* **왜:** 저장 방식(로컬 파일 → SQLite)이나 LLM 벤더(agy CLI → 로컬 서빙)를 바꿀 때, 고쳐야 할 파일이 어댑터 하나로 한정됩니다.

```python
# ports.py — 이 도메인이 외부에 요구하는 것
# 저장소를 셋으로 나눈 이유는 수명주기가 셋이기 때문이다 (60-data 참조).
class DocumentSourceRepository(Protocol):      # 원본      → data/
    def save(self, filename: str, content: bytes) -> DocumentMeta: ...
    def resolve_file(self, doc_id: str) -> Path: ...

class DocumentArtifactRepository(Protocol):    # LLM 산출물 → data/
    def commit(self, doc_id, kind, files, provenance, *, set_head=True) -> ArtifactProvenance: ...
    def load_head(self, doc_id, kind) -> dict[str, Any] | None: ...

class DocumentCacheRepository(Protocol):       # 결정적 파생 → cache/
    def context_dir(self, doc_id: str) -> Path: ...

# use_cases/extract_outline.py — 계약만 받는다. 구체 클래스를 타입으로 받지 않는다
class ExtractOutlineUseCase:
    def __init__(self, source: DocumentSourceRepository,
                 artifacts: DocumentArtifactRepository,
                 cache: DocumentCacheRepository, ...) -> None: ...

# bootstrap/container.py — 여기서만 구현체와 '어느 등급 루트에 두는가' 를 고른다
document_source_repository = providers.Singleton(
    LocalDocumentSourceRepository,
    root_dir=providers.Object(_storage.knowledge_of("documents")),
)
document_cache_repository = providers.Singleton(
    LocalDocumentCacheRepository,
    root_dir=providers.Object(_storage.cache_of("documents")),
)
```

* **수명주기가 다르면 포트도 나눕니다.** 셋을 한 포트로 합치면 "이건 지워도 되는가"가
  다시 흐려지고, 어댑터 하나가 `data/` 와 `cache/` 를 동시에 만지게 됩니다.

* **금지:**
  - 모듈 전역 싱글턴 (`xxx_service = XxxService()`). 조립 지점이 흩어지면 교체가 불가능해집니다.
  - `service.py` 가 구체 클래스를 타입 힌트로 받는 것. 그 순간 어댑터 교체가 막힙니다.
  - `ports.py` 안의 구현 세부(파일 경로, JSON, SQLAlchemy). 계약만 둡니다.

* **헥사고날 ≠ 별도 서버.** 포트/어댑터는 **인프로세스**에서 이득을 전부 냅니다.
  프로세스 분리는 결합도가 아니라 **배포·자원 단위가 실제로 달라질 때**만 정당합니다 (예: GPU 모델 상주).
  그때도 분리되는 것은 어댑터 뒤의 외부 서버이고, 포트는 인프로세스에 남습니다.

---

## 3. LLM 은 세 층으로 나뉜다

"LLM 이 도메인 종속인가 별도인가"의 답은 **셋 다 다르다** 입니다. 섞지 마십시오.

| 층 | 도메인 종속? | 있어야 할 곳 | 프론트 대응 |
| --- | --- | --- | --- |
| **실행 제어** — Run 상태, 재시도, 승인 대기, 재개 | ❌ 무관 | `core/agent_runtime/` | `shared/api/agentRunClient` |
| **실행 수단** — 모델 선택, 호출, 타임아웃, 폴백 | ❌ 무관 | `core/llm/` (계약 정본은 `scaffold_engine.harness`) | `shared/api/httpClient` |
| **관측** — trace, span, 원장 | ❌ 무관 | `core/llm/tracer.py`(트레이스), `telemetry.py`(원장) | — |
| **물어볼 내용** — 프롬프트, 응답 스키마, 파싱 규칙 | ✅ **100% 종속** | 그것을 실행하는 쪽 | `entities/*/api/*Api.ts` |
| **업무 정의** — 어떤 분석을 왜 하는가 | ✅ **100% 종속** | `<도메인>/agents/` | `entities/*/model/use*.ts` |

* **규칙 한 줄: 프롬프트 문자열이 `core/` 안에 있으면 위반입니다.**
* **프롬프트 소유자 판별:** 그것을 실행하는 파이프라인과 같은 곳에 둡니다.
  - 엔진 파이프라인이 실행 → `packages/scaffold-engine/.../prompts/`
  - 도메인 서비스가 실행 → `app/<도메인>/prompts.py`
* 벤더를 추가할 때는 `BaseLlmHarness` 를 구현한 어댑터를 `core/llm/adapters/` 에 넣고 `LlmManager` 에 등록합니다. **그 외 어떤 파일도 고치지 않습니다.**

---

## 4. `core` 판별 기준

* **원칙:** `core/` 는 **도메인 고유 명사를 몰라야** 합니다.

| 검사 | 결과 |
| --- | --- |
| `core/` 안에 `outline_tree.json`, `segments`, `scaffold_id` 같은 문자열이 있다 | ❌ 그 코드는 도메인 것입니다. `<도메인>/adapters/` 로 내리십시오 |
| `core/` 안에 프롬프트 문자열이 있다 | ❌ 즉시 위반 |
| `core/` 가 `app.documents` 를 import 한다 | ❌ P1 위반 |
| 도메인 이름을 전부 지워도 코드가 성립한다 | ✅ `core` 에 남을 자격이 있습니다 |

* **`core` 가 소유하는 것:** *어떻게* 저장하는지 · *어떻게* 모델과 대화하는지.
* **도메인이 소유하는 것:** *무엇을* 저장하는지 · *무엇을* 물어보는지.

---

## 5. 디렉터리 상세

### 5.1 `app/<도메인>/` — 세그먼트 고정

임의의 파일명(`storage.py`, `utils.py`, `helpers.py`)을 도메인 최상위에 만들지 마십시오.

```text
app/<도메인>/
├── __init__.py   # Public API (필수). 외부는 이 파일이 노출한 것만 쓴다
├── router.py     # HTTP 입출력만. 로직 금지. service 로 위임한다
├── schemas.py    # Pydantic 요청/응답. router.py 안에 인라인 선언 금지
├── models.py     # (해당하면) 프레임워크 독립 도메인 모델 (영속 형태)
├── errors.py     # (해당하면) 실패 → UI 계약 번역
├── service.py    # 유스케이스로 넘기는 얇은 경계
├── ports.py      # 이 도메인이 외부에 요구하는 계약 (Protocol)
├── use_cases/    # 유스케이스 하나당 파일 하나
├── agents/       # (해당하면) LLM 이 개입하는 업무 정의
├── adapters/     # ports.py 계약의 구현체
└── prompts.py    # (해당하면) 이 도메인만의 프롬프트
```

- **`router.py`**: 요청을 받아 `service.py` 로 넘기고 응답을 반환합니다. DB 조회·파일 접근·추출 로직을 직접 수행하지 않습니다.
  **함수 본문 안의 import 를 금지합니다.** 그것은 순환 참조를 감추는 행위이며, 순환이 생겼다는 것은 경계가 틀렸다는 신호입니다.
- **`schemas.py`**: Pydantic 으로 HTTP 요청/응답의 유효성을 정의합니다. `models.py`(영속 모델)와 분리합니다.
- **`service.py`**: **얇은 경계**입니다. 하는 일은 세 가지뿐 — 식별자 정규화, 유스케이스 위임,
  재개 가능한 유스케이스를 Agent Runtime 에 등록. 여기에 조건 분기가 쌓이기 시작하면
  그것은 `use_cases/` 로 내려가야 할 로직이 올라온 것입니다.
- **`use_cases/`**: 유스케이스 하나당 파일 하나. 포트만 알고 저장 경로를 모릅니다.
  LLM 개입 여부로 **일반 경로 / Agent 경로**가 갈립니다.
- **`agents/`**: "무엇을 분석하는가"만 정의합니다. 실행 상태·공급자 선택·자격증명은
  `core/agent_runtime` 과 `core/llm` 의 몫입니다.
- **`ports.py` / `adapters/`**: §2 참조.

### 5.2 `app/core/` — 도메인 무관 인프라

| 하위 | 역할 |
| --- | --- |
| `config.py` | 외부 URL·CORS·모델명·타임아웃·보존기간의 **SSOT**. **저장 경로는 두지 않습니다** |
| `storage/` | 등급 루트(`paths.py`)·식별자 발급(`ids.py`)·원자적 I/O(`atomic_json.py`).<br>**등급과 층까지만 알고 도메인 이름은 모릅니다** |
| `agent_runtime/` | Run 이벤트·폴드·정책·승인·재개. 도메인을 모릅니다 |
| `llm/` | LLM 실행 수단 + 관측 (§3). **프롬프트 0줄** |
| `logging_config.py` | 다중 타깃 로깅 초기화 (`state/log/`) |

* ⚠️ **`config.py` 가 구체 경로를 공개하면 어댑터 우회가 일어납니다.** 실제로 그렇게 되어
  `core/llm/telemetry.py` 가 문서 저장 트리에 직접 기록했습니다
  ([V-12](../../../00-core/examples/violation-catalog.md)). 경로는 주입받으십시오.

### 5.3 `app/bootstrap/` — 조립

* 애플리케이션의 **유일한** 객체 조립 장소입니다.
* 도메인 서비스와 어댑터의 실제 구현체는 여기서만 선택합니다.
* `main.py` 는 컨테이너를 만들고 라우터를 등록할 뿐, 객체를 직접 만들지 않습니다.
* ⚠️ 라우터가 `bootstrap` 을 import 하는 것은 **역방향 참조**입니다. DI 와이어링 방식이 이를 강제하는 경우 주석으로 이유를 남기고, 대안이 생기면 제거하십시오.

---

## 6. 에러 핸들링 및 로깅

* **원칙:** 사용자와 디버깅을 위해 명확한 HTTP 상태 코드와 상세 메시지를 반환합니다.
* **적용 가이드:**
  - FastAPI 의 `HTTPException` 을 사용하고, 외부 연동(CLI·API)은 예외를 감싸 로컬 서버가 죽지 않게 방어합니다.
  - 실패를 성공으로 위장하지 마십시오. 폴백 결과를 정상 응답으로 돌려주는 경우, 응답 스키마에 실패가 드러나야 합니다.
  - **산출물의 존재 여부를 파일 유무나 문자열 매칭으로 추론하지 마십시오.**
    LLM 산출물은 채택본 포인터(`artifacts/{kind}/HEAD.json`)와 출처(`provenance.json`)가 SSOT 입니다.
    (스캐폴드 아카이브는 자기 `manifest.json` 을 유지합니다.)
  - **실패 결과를 아티팩트로 커밋하지 마십시오.** 폴백 문서를 채택본으로 두면 다음 요청이
    그것을 정상 결과로 오인합니다. 실패는 Run 이력에 남기고 아티팩트는 만들지 않습니다.

---

## 7. 모노레포 공용 패키지 (`packages/*`) 경계

* **원칙:** 패키지는 레이어가 아니라 **파이프라인 단계**로 나뉩니다 (`extract → classify → assemble → score`).
  **앱의 §1 레이어 규칙을 패키지에 적용하지 마십시오.** 대신 3원칙을 지킵니다.

| # | 원칙 | 내용 |
| --- | --- | --- |
| **K1** | **역방향 절대 금지** | `packages/*` 는 `apps/*` 를 import 하지 않는다. 의존은 `apps → packages` 한쪽뿐 |
| **K2** | **계약 SSOT** | 공유 계약(`LlmHarness`, `BaseLlmHarness`)의 **정본은 패키지**다. 앱은 재정의하지 않고 그대로 import 한다 |
| **K3** | **불변식 명시** | 각 패키지는 자기 파이프라인의 깨지면 안 되는 규칙을 `README.md` 또는 진입 모듈 docstring 에 적는다 |

* **K3 정본 예시** — `scaffold_engine/core/pipeline.py`:
  > *"좌표는 A(측정)에서만 만들어진다. B(판정)의 출력 스키마에는 좌표 필드가 없고, C(조립)는 A 의 실측치만 사용한다."*

* **승격 기준** — 아래를 **모두** 만족할 때만 `packages/` 로 뺍니다.
  - 호스트(FastAPI 요청 컨텍스트, 앱 설정, 캔버스 런타임)에 의존하지 않는다
  - 다른 앱/툴에서 그대로 재사용할 수 있다
  - 자체 진입점(라이브러리 API 또는 CLI)을 가진다

* **임포트 규칙:** 항상 Public API 로만 참조합니다.
  `from scaffold_engine import OutlinePipeline` ✅ / `from scaffold_engine.outline.pipeline import ...` ❌

* **현재 패키지:** `scaffold-engine`(Python, AI 문서 분석 엔진) · `@vibe/document-viewer` · `@vibe/tiptap-scaffold` · `@vibe/config`

---

## 8. 스탠드얼론 유지

* **원칙:** 외부 Dify 클라이언트 의존을 배제하고 시스템을 스탠드얼론으로 유지합니다. Dify 의 4-phase 실행 모델은 **사상만 참고**합니다.
* **현재 정본:** 분석 파이프라인 오케스트레이션은 `packages/scaffold-engine/scaffold_engine/core/pipeline.py` 가
  담당합니다 (A 측정 → B 판정 → C 조립 → D 채점). **실행 제어**(Run 상태·재시도·승인·재개)는
  `app/core/agent_runtime/` 이 담당합니다. 둘은 층이 다릅니다 — 엔진은 "무엇을 어떻게 분석하는가",
  런타임은 "그 실행이 어디까지 갔고 어떻게 이어가는가".
* ✅ **해소됨:** 과거의 `app/core/workflow/` DAG 구현은 제거되었습니다. 다시 만들지 마십시오.

---

## 9. 완료 게이트

헌법 §6 과 동일하되, 백엔드를 건드렸다면 추가로:

- 앱이 실제로 임포트되는지 확인합니다 (`python -c "import main"`)
- 변경한 엔드포인트를 **실제로 호출**해 확인합니다. 빌드 통과는 동작 확인이 아닙니다
- 저장 레이아웃을 바꿨다면 `pnpm -F @vibe/api migrate:status` 로 버전을 확인하고
  `migrations/` 에 단계를 추가했는지 점검합니다. 버전이 어긋나면 서버는 부팅을 거부합니다
- 데이터 등급이 걸린 변경이면 `tests/test_storage_lifecycle.py` · `test_provenance.py` ·
  `test_run_recovery.py` 가 여전히 통과하는지 확인합니다

---

## 10. 데이터 관리

저장 위치·수명주기·아티팩트·마이그레이션의 정본은 [`60-data/rule.md`](../../../60-data/rule.md) 입니다.
이 문서에서 반복하지 않되, 백엔드 코드를 쓸 때 반드시 걸리는 세 가지만 옮깁니다.

1. **판정 두 줄** — 같은 입력으로 다시 돌려 바이트가 같으면 `cache/`, 아니면 `data/`.
   프로세스가 죽었을 때 잃으면 안 되면 `data/`, 아니면 `state/`.
2. **LLM 산출물은 캐시가 아니다.** 재현되지 않고 비용이 든다. `data/` 에 provenance 와 함께 커밋한다.
3. **식별자는 대리키다.** 파일명·제목을 경로 키로 쓰지 않는다. `core/storage/ids.py` 의
   `new_id()` 로 발급하고 `safe_segment()` 로 검증한다.
