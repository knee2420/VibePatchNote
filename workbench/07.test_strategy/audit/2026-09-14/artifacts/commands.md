# 재현 명령과 원시 출력 (2026-09-14)

> 감사 카드의 모든 수치는 아래 명령의 출력이다. 재감사 시 같은 명령을 쓴다.

---

## 1. 규모

```bash
# 테스트 파일 줄 수
find apps/api/tests -name "*.py" | xargs wc -l | sort -rn

# 파일별 테스트 수
grep -c "^def test_\|^async def test_" apps/api/tests/*.py | sort -t: -k2 -rn

# 앱 코드 줄 수 (대조군)
find apps/api/app -name "*.py" | xargs wc -l | tail -1
```

```text
3977 total (tests)
9099 total (app)
131  tests collected
```

---

## 2. 실행 시간

```bash
cd apps/api
venv/Scripts/python.exe -m pytest tests -q -p no:cacheprovider --durations=25
```

```text
131 passed, 1 warning in 10.10s

slowest 25 durations
0.40s call  tests/test_observability_contract.py::test_generated_types_match_contracts
0.34s call  tests/test_scaffold_multipage.py::test_scaffold_pipeline_processes_all_pages
0.33s call  tests/test_atomic_json.py::test_concurrent_writes_leave_valid_json
0.26s call  tests/test_runtime_service.py::test_runtime_router_endpoints
0.24s call  tests/test_run_recovery.py::test_approval_resumes_the_run_it_was_blocking
...  (이하 0.2초 미만, 분포 평평)
```

### 수집 시간

```bash
venv/Scripts/python.exe -m pytest tests --collect-only -q
```

```text
131 tests collected in 1.37s
```

### 앱 임포트 비용

```bash
venv/Scripts/python.exe -X importtime -c "import main" 2>&1 | tail -1
```

```text
import time:  49783 | 1590080 | main      ← 1.59초
```

---

## 3. packages 테스트

```bash
cd packages
../apps/api/venv/Scripts/python.exe -m pytest scaffold-engine/tests agent-core/tests -q
```

```text
14 passed in 0.61s
```

> 이 명령은 **손으로 경로를 지정해야** 돈다. 자동 실행 경로가 없다.

---

## 4. 게이트 구성 확인

```bash
cat turbo.json                    # tasks: build / typecheck / lint / dev
cat package.json                  # scripts: dev / build / lint / typecheck
grep -rn "tool.pytest" -r .       # (결과 없음)
ls -a .github                     # (없음)
```

---

## 5. 구조적 발견 확인용

```bash
# 전역 TestClient
grep -rn "^client = TestClient" apps/api/tests

# 앱 전체를 import 하는 모듈
grep -ln "from main import\|import main" apps/api/tests/*.py

# 아키텍처 규칙 이중 구현
grep -n "def test_packages_do_not_import_app_modules\|def test_only_bootstrap_may_import" \
  apps/api/tests/test_adapters.py

# 픽스처 중복
grep -rn "StorageRoots(" apps/api/tests/*.py

# 외부 차단 지점
grep -rn "monkeypatch.setattr" apps/api/tests/*.py
```

```text
client = TestClient(app)  → 4개 모듈
import main               → 6개 모듈
StorageRoots(tmp_path)    → 4개 모듈
monkeypatch.setattr       → 13곳, 지점이 파일마다 다름
```

---

## 6. 감사 시점의 import-linter 상태

```bash
cd apps/api && venv/Scripts/lint-imports.exe
```

```text
Contracts: 11 kept, 0 broken.
```
