# [TEST-SPEC] 픽스처

- **문서 ID**: `TEST-SPEC-FIXTURES`
- **상태**: `Active`
- **최종 개정**: 2026-09-14
- **템플릿**: [`templates/conftest.workspace.py`](../../templates/conftest.workspace.py)

---

## 1. 공용 픽스처는 셋뿐이다

| 픽스처 | 스코프 | 주는 것 | 쓰는 등급 |
| --- | --- | --- | :---: |
| `storage` | function | 격리된 `StorageRoots` | L2 |
| `container` | function | 외부가 끊긴 `Container` | L2 · L3 |
| `api_client` | **session** | **lifespan 이 실행된** `TestClient` | L3 |

여기에 **저장소 격리**(`_isolated_storage`, autouse)가 항상 깔린다.

> 2026-09-14 기준 공용 픽스처는 사실상 `observability_runs` 하나였고,
> `StorageRoots(tmp_path)` 조립을 4개 파일이 각자 하고 있었다.

---

## 2. `storage` — 등급 루트

```python
@pytest.fixture
def storage(tmp_path: Path):
    from app.core.storage import StorageRoots

    roots = StorageRoots(tmp_path)
    roots.ensure()
    return roots
```

**어댑터에 주입할 루트를 준다.** 이 픽스처가 강제하는 계약은
"어댑터가 경로를 스스로 만들지 않는다"이다.

```python
def test_...(storage) -> None:
    repository = LocalAgentRunRepository(storage.runs)     # ✓ 주입
```

---

## 3. `container` — 외부가 끊긴 객체 그래프

```python
@pytest.fixture
def container(tmp_path, monkeypatch):
    container = Container()
    # 차단은 external-boundaries.md 의 고정 목록에서만 고른다
    yield container
    container.reset_override()
```

**즉흥적으로 다른 지점을 막지 않는다.** 차단 지점이 파일마다 달라지면
"무엇이 진짜 실행되는가"를 아무도 모르게 된다.
→ [`02.external-boundaries.md`](./02.external-boundaries.md)

---

## 4. `api_client` — 부팅된 앱

```python
@pytest.fixture(scope="session")
def api_client():
    from fastapi.testclient import TestClient
    import main

    with TestClient(main.app) as client:      # with 가 lifespan 을 돌린다
        yield client
```

| 규칙 | 이유 |
| --- | --- |
| **`with` 필수** | 없으면 lifespan 이 안 돌아 프로덕션에 없는 상태를 검증한다 |
| **session 스코프** | `import main` 이 1.59초. 세션당 한 번만 문다 |
| **전역 `TestClient` 금지** | 위 둘을 동시에 깨뜨린다 |

→ [`examples/90.antipattern-global-client.md`](../../examples/90.antipattern-global-client.md)

---

## 5. 저장소 격리 (autouse)

등급 루트 네 개를 임시 디렉터리로 돌린다. **`app.core.config` 임포트보다 먼저** 일어나야 한다.

```python
_TEST_STORAGE_ROOT = Path(__file__).resolve().parents[1] / ".pytest_tmp" / f"storage-{os.getpid()}"
for _key, _grade in (("VIBE_CONFIG_DIR", "config"), ("VIBE_DATA_DIR", "data"),
                     ("VIBE_CACHE_DIR", "cache"), ("VIBE_STATE_DIR", "state")):
    os.environ[_key] = str(_TEST_STORAGE_ROOT / _grade)

import pytest                             # noqa: E402
from app.core.config import settings      # noqa: E402
```

**디렉터리를 미리 만들지 않는다.** 비어 있어야 부팅이 "새 설치"로 보고 현재 버전을 찍는다.
미리 만들면 "버전 없는 비어있지 않은 저장소"가 되어 부팅이 거부된다.

→ [`examples/92.antipattern-real-data.md`](../../examples/92.antipattern-real-data.md)

---

## 6. 문서 인덱스

| 문서 | 내용 |
| --- | --- |
| [`01.doubles-policy.md`](./01.doubles-policy.md) | 언제 대역, 언제 실물 |
| [`02.external-boundaries.md`](./02.external-boundaries.md) | **외부 차단 지점 고정표** |
| [`03.observability-fixtures.md`](./03.observability-fixtures.md) | 실제 산출물 픽스처 · 갱신 절차 |

---

## 7. 금지 목록

| 금지 | 이유 |
| --- | --- |
| 전역 `TestClient(app)` | lifespan 미실행 |
| 실제 `settings.storage` 사용 | 개발 데이터 오염 · 순서 의존 |
| 전역 `settings` 속성 변조 | 프로세스 전역 상태를 테스트가 바꾼다 |
| `StorageRoots` 직접 조립 | `storage` 픽스처를 쓴다 |
| 파일마다 다른 차단 지점 | 무엇이 실제로 도는지 알 수 없게 된다 |
| 3층 이상의 conftest | 픽스처 출처 추적 비용이 테스트 읽는 비용을 넘는다 |
