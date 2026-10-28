# 매핑 — `apps/api/tests` 현재 → 목표

- **상태**: 이행 중에만 유효 (T4 완료 시 `Superseded`)
- **기준 시점**: 2026-09-14 (26개 파일 / 131개 테스트)
- **규칙 정본**: [`spec/03.layout.md`](../../spec/03.layout.md)

> 등급은 **마커**로 표시한다. 파일명에 등급을 넣지 않는다.
> `wiring` 표시가 없는 것은 전부 기본 실행(L1+L2)에 포함된다.

---

## 범례

| 기호 | 뜻 |
| :---: | --- |
| ✅ | 그대로 유지 (이름·위치 변경 없음) |
| ✂️ | 분할 |
| ➡️ | 이동 (T3 — packages 귀속) |
| 🗑️ | 삭제 (T1 — 계약이 대체) |
| 🔀 | 이름 변경 |

---

## 전체 매핑

| # | 현재 파일 | 테스트 | 조치 | 목표 | 등급 | 단계 |
| :---: | --- | ---: | :---: | --- | :---: | :---: |
| 1 | `test_adapters.py` | 5 | ✂️🗑️ | `test_document_source_repository.py` (1)<br>`test_workspace_repository.py` (2)<br>~~AST 검사 2건~~ → 계약 | L2<br>L2<br>L0 | T1·T4 |
| 2 | `test_agy_status_snapshot.py` | 2 | ✅ | 유지 (`external` 마커 검토) | L2 | T2 |
| 3 | `test_agy_statusline_settings.py` | 2 | ✅ | 유지 | L2 | — |
| 4 | `test_architecture_contracts.py` | 4 | ✅ | 유지 (메타 검사) | L0 검사 | — |
| 5 | `test_atomic_json.py` | 1 | ✅ | 유지 | L2 | — |
| 6 | `test_bootstrap.py` | 7 | ✂️🔀 | `test_wiring_documents.py`<br>`test_wiring_outline.py`<br>`test_wiring_container.py` | L3 `wiring` | T2·T4 |
| 7 | `test_cli_availability.py` | 3 | ➡️ | `packages/agent-core/tests/` | L2 | T3 |
| 8 | `test_daily_logging.py` | 4 | ✅ | 유지 | L2 | — |
| 9 | `test_google_project_usage.py` | 3 | ✅ | 유지 (앱 유스케이스) | L2 | — |
| 10 | `test_google_structured_output.py` | 3 | ➡️ | `packages/agent-core/tests/` | L2 | T3 |
| 11 | **`test_inspector.py`** | **18** | ✂️ | `test_inspector_service.py` (~7)<br>`test_source_archive.py` (~5)<br>`test_inspector_api.py` (~6) | L2<br>L2<br>L3 `wiring` | T2·T4 |
| 12 | `test_llm_fallback.py` | 4 | ➡️ | `packages/agent-core/tests/` | L2 | T3 |
| 13 | `test_llm_runtime_policy.py` | 6 | ✅ | 유지 (`wiring` 마커) | L3 | T2 |
| 14 | `test_llm_settings_service.py` | 2 | ✅ | 유지 | L2 | — |
| 15 | **`test_observability_contract.py`** | **16** | ✂️➡️🗑️ | `packages/agent-telemetry/tests/` (~6, 어휘·사용량)<br>`test_ledger_migration.py` (~2)<br>`test_generated_types.py` (~2)<br>`test_inspector_api.py` (~1)<br>~~문서 존재 검사~~ (~2) | L1<br>L2<br>L1<br>L3<br>🗑️ | T1·T3·T4 |
| 16 | `test_outline_observability.py` | 2 | ✂️ | `test_outline_telemetry_adapter.py` (1)<br>`packages/scaffold-engine/tests/` (1) | L2<br>L2 | T3·T4 |
| 17 | `test_payload_externalization.py` | 7 | ✂️ | `test_payload_store.py` (6)<br>`test_inspector_api.py` (1) | L2<br>L3 `wiring` | T2·T4 |
| 18 | `test_provenance.py` | 5 | ✅ | 유지 | L2 | — |
| 19 | `test_provider_state.py` | 5 | ➡️ | `packages/agent-core/tests/` | L2 | T3 |
| 20 | `test_run_observation_store.py` | 3 | ✅ | 유지 | L2 | — |
| 21 | **`test_run_recovery.py`** | **11** | ✂️ | `test_agent_run_repository.py` (~3)<br>`test_runtime_resume.py` (~5)<br>`test_ledger.py` (~3) | L2 | T4 |
| 22 | `test_runtime_service.py` | 1 | 🔀 | `test_wiring_runtime.py` | L3 `wiring` | T2 |
| 23 | `test_scaffold_archive_catalog.py` | 3 | ✅ | 유지 | L2 | — |
| 24 | `test_scaffold_multipage.py` | 1 | ➡️ | `packages/scaffold-engine/tests/` | L2 | T3 |
| 25 | `test_scaffold_observability.py` | 6 | ✂️ | `test_wireframe_telemetry_adapter.py` (~2)<br>`packages/scaffold-engine/tests/` (~3)<br>`test_inspector_api.py` (~1) | L2<br>L2<br>L3 | T3·T4 |
| 26 | `test_storage_lifecycle.py` | 6 | ✅ | 유지 | L2 | — |

---

## 요약

| 조치 | 파일 수 | 테스트 수 |
| --- | ---: | ---: |
| ✅ 유지 | 11 | 36 |
| ✂️ 분할 | 7 | 65 |
| ➡️ packages 이동 | 5 | 16 |
| 🗑️ 삭제 (계약이 대체) | — | ~4 |

### 이행 후 예상 구성

| 워크스페이스 | 테스트 수 | 기본 실행 |
| --- | ---: | ---: |
| `apps/api` L1+L2 | ~75 | ✅ |
| `apps/api` L3 `wiring` | ~15 | `test:all` |
| `packages/*` | ~35 | ✅ |
| **합계** | ~125 | |

> 총합이 131 → ~125 로 줄어드는 것은 **L0 이관(삭제) 4건 + 중복 제거**다.
> **사고 기록이 있는 테스트는 하나도 줄지 않는다.**

---

## 분할 상세 — 큰 파일 3개

### `test_inspector.py` (18)

| 목표 파일 | 테스트 | 대상 |
| --- | --- | --- |
| `test_inspector_service.py` | 목록 요약, 상태 어휘 변환, 비계측 run 포함, 워크플로우 카탈로그, 스냅샷 형태 | `app/inspector/service.py` |
| `test_source_archive.py` | 모듈 해석, 심볼 추출, 경로 탈출 거부, 조회 속도 | `app/inspector/adapters/local_source_archive.py` |
| `test_inspector_api.py` | 매트릭스 엔드포인트, run 상세 엔드포인트, 페이로드 엔드포인트 | 라우터 (`wiring`) |

### `test_observability_contract.py` (16)

| 목표 | 테스트 |
| --- | --- |
| `packages/agent-telemetry/tests/` | 상태 어휘 소문자, `fallback` 은 상태가 아님, 사용량 왕복, 합계 파생, 구조화된 소스, 선언 지점 기록 |
| `test_ledger_migration.py` | 원장 스키마 통일, 멱등성 |
| `test_generated_types.py` | TS 타입 동기화, 생성 파일 표시 |
| `test_inspector_api.py` | 비용 null (엔드포인트) |
| 🗑️ 삭제 | 규칙 문서 존재 검사 2건 |

### `test_run_recovery.py` (11)

| 목표 | 테스트 |
| --- | --- |
| `test_agent_run_repository.py` | 이력 폴드, 스냅샷 복원, 미완료 목록 |
| `test_runtime_resume.py` | 고아 정리, 대기 보존, 재개 등록, 승인→재개, 거절 |
| `test_ledger.py` | 원장 덧붙이기, 비용 기록 도달 |

> **주의**: `test_run_recovery.py` 는 `AgentRuntime`(패키지)과 `RuntimeService`(앱)를
> 함께 검증한다. 순수 런타임 부분은 T3 에서 `packages/agent-core` 로 갈지 재판정한다.
> 현재 표는 앱 잔류를 전제로 한다.

---

## 이 표를 갱신하는 법

T4 는 **건드릴 때마다 조금씩** 진행한다. 한 모듈을 정리했으면 해당 행에 완료 표시를 남긴다.

```markdown
| 11 | ~~`test_inspector.py`~~ | 18 | ✅완료 2026-09-20 | ... |
```

전부 완료되면 문서 상단을 `Superseded` 로 바꾸고 보존한다 — **왜 그렇게 배치됐는지의 근거**로.
