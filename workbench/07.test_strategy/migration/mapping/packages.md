# 매핑 — `packages/*` 귀속

- **상태**: 이행 중에만 유효 (T3 완료 시 `Superseded`)
- **기준 시점**: 2026-09-14
- **규칙 정본**: [`spec/03.layout.md`](../../spec/03.layout.md) §2

---

## 1. 현재 상태

| 패키지 | 테스트 | `pyproject` pytest 설정 | `package.json` | 자동 실행 |
| --- | ---: | :---: | :---: | :---: |
| `scaffold-engine` | 11 | ✗ | ✗ | ✗ |
| `agent-core` | 3 | ✗ | ✗ | ✗ |
| `agent-telemetry` | **0** | ✗ | ✗ | — |
| `document-viewer` (TS) | — | — | ✓ | (lint/typecheck만) |
| `tiptap-scaffold` (TS) | — | — | ✓ | (lint/typecheck만) |
| `config` | — | — | ✗ | — |

**Python 패키지 3개 전부 테스트 실행 경로가 없다.**

---

## 2. 기존 테스트 (이동 없음, 실행 경로만 신설)

### `packages/scaffold-engine/tests/` — 11개

| 파일 | 테스트 | 검증 대상 |
| --- | ---: | --- |
| `test_wireframe_vision.py` | ~5 | 비전 렌더링 · 슬롯 오버레이 |
| `test_pipeline_telemetry.py` | ~4 | 파이프라인 스팬 방출 |
| `test_coordinates.py` | ~1 | 좌표 변환 |
| `test_context_builder.py` | ~1 | 문서 컨텍스트 조립 |

### `packages/agent-core/tests/` — 3개

| 파일 | 테스트 | 검증 대상 |
| --- | ---: | --- |
| `test_harness_factory.py` | 3 | 하네스 팩토리 등록·생성 |

---

## 3. 이관 대상 (T3)

### → `packages/agent-core/tests/`

| 출처 | 테스트 | 검증 대상 | 임포트 변경 |
| --- | ---: | --- | --- |
| `test_llm_fallback.py` | 4 | `FallbackLlmHarness` | `app.core.llm` → `llm_driver` |
| `test_provider_state.py` | 5 | `ProviderStateStore` | `app.core.llm` → `llm_driver` |
| `test_google_structured_output.py` | 3 | `GoogleGenAiHarness` 요청 조립 | 이미 `llm_driver` |
| `test_cli_availability.py` | 3 | `CliQuotaAvailability` | `app.core.llm` → `llm_driver` |
| **합계** | **15** | | |

> `test_provider_state.py` 는 `StorageRoots` 를 쓸 수 있다. 패키지로 옮기면
> **`tmp_path` 를 직접 써야 한다** — 패키지는 앱의 저장 게이트를 모른다.
> 이것이 소유권이 맞는지 판별하는 좋은 시험이다.

### → `packages/scaffold-engine/tests/`

| 출처 | 테스트 | 검증 대상 |
| --- | ---: | --- |
| `test_scaffold_multipage.py` | 1 | `ScaffoldPipeline` 다중 페이지 처리 |
| `test_scaffold_observability.py` 일부 | ~3 | 파이프라인 스팬 · 사용량 기록 |
| `test_outline_observability.py` 일부 | ~1 | `OutlinePipeline` 스팬 |
| **합계** | **~5** | |

### → `packages/agent-telemetry/tests/` (디렉터리 신설)

| 출처 | 테스트 | 검증 대상 |
| --- | ---: | --- |
| `test_observability_contract.py` 일부 | ~6 | 상태 어휘, 사용량 변환, 소스 구조화 |
| **합계** | **~6** | |

---

## 4. 이관 후 예상

| 패키지 | Before | After |
| --- | ---: | ---: |
| `scaffold-engine` | 11 | ~16 |
| `agent-core` | 3 | ~18 |
| `agent-telemetry` | 0 | ~6 |
| **합계** | **14** | **~40** |

---

## 5. 남기는 것 — 앱이 소유

혼동하기 쉬운 것들. **"고장 나면 누가 고치는가"** 로 판정한다.

| 테스트 | 소유 | 이유 |
| --- | :---: | --- |
| `EngineOutlineExtractAdapter` 가 스팬을 남기는가 | 앱 | 어댑터가 검증 대상 |
| `EngineWireframeExtractAdapter` 가 `RunCost` 를 만드는가 | 앱 | 변환은 어댑터의 일 |
| `RunObservationStore` 가 계측을 저장하는가 | 앱 | 호스트 저장 게이트 |
| `OutlineTelemetryAdapter` 가 store 를 호출하는가 | 앱 | 어댑터 배선 |
| `LlmManager` 가 정책대로 하네스를 고르는가 | 앱 | 호스트 DI 조립 |

---

## 6. 신설 파일 목록 (T0 · T3)

```text
packages/scaffold-engine/package.json          신설 (T0)
packages/agent-core/package.json               신설 (T0)
packages/agent-telemetry/package.json          신설 (T0)
packages/scaffold-engine/pyproject.toml        [tool.pytest.ini_options] 추가 (T0)
packages/agent-core/pyproject.toml             [tool.pytest.ini_options] 추가 (T0)
packages/agent-telemetry/pyproject.toml        [tool.pytest.ini_options] 추가 (T0)
packages/agent-telemetry/tests/                디렉터리 신설 (T3)
```

---

## 7. 검증 — 소유권의 진짜 시험

이관한 테스트가 **앱 없이 돌아야** 한다.

```bash
cd packages/agent-core
../../apps/api/venv/Scripts/python.exe -m pytest -q
```

`app.*` 를 임포트하는 테스트가 남아 있으면 실패한다. 그것이 정상이다 —
**패키지는 호스트 비의존 정본**이므로, 앱이 있어야 검증되는 테스트는 패키지의 것이 아니다.

```bash
# 계약도 확인한다
cd apps/api && venv/Scripts/lint-imports.exe
#    "Agent Core is domain agnostic" 이 app.* 임포트를 잡는다
```
