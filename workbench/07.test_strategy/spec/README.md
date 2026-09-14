# ◆ spec — 테스트 관리 정본

> **이 폴더 안은 전부 "지금 유효한 규칙"이다.** 시점 기록은 `../audit/`, 전이 계획은 `../migration/` 에 있다.

---

## 문서 인덱스

| 문서 | 답하는 질문 | 상태 |
| --- | --- | :---: |
| [`01.principles.md`](./01.principles.md) | 왜 이렇게 관리하는가 | `Active` |
| [`02.tiers/`](./02.tiers/README.md) | **이 테스트는 몇 등급인가** | `Active` |
| [`03.layout.md`](./03.layout.md) | 어느 파일에 쓰는가 | `Active` |
| [`04.execution/`](./04.execution/README.md) | 언제 어떻게 도는가 | `Active` |
| [`05.fixtures/`](./05.fixtures/README.md) | 무엇으로 준비하는가 | `Active` |

---

## 문서 헤더 규약

`spec/` 의 모든 문서는 아래 헤더로 시작한다. **`근거 감사` 가 정본과 기록을 잇는 고리다** —
규칙이 왜 그렇게 정해졌는지 물으면 그 시점의 측정으로 되돌아갈 수 있다.

```markdown
- **문서 ID**: `TEST-SPEC-<이름>`
- **상태**: `Active` | `Draft` | `Superseded`
- **최초 작성**: YYYY-MM-DD
- **최종 개정**: YYYY-MM-DD
- **근거 감사**: `audit/YYYY-MM-DD/...`
```

| 상태 | 뜻 |
| --- | --- |
| `Draft` | 합의 전. 구현을 이 문서에 맞추지 않는다 |
| `Active` | **현행 규칙.** 구현이 어긋나면 구현을 고친다 |
| `Superseded` | 대체됨. 본문 상단에 후속 문서 링크를 남기고 삭제하지 않는다 |

---

## 개정 절차

1. `spec/` 문서를 먼저 고친다 (`최종 개정` 갱신).
2. 근거가 측정이라면 `audit/YYYY-MM-DD/` 에 카드를 남기고 `근거 감사` 를 갱신한다.
3. 강제 수단(`pyproject.toml`, `turbo.json`)을 맞춘다.
4. 코드 변경이 따르면 `03.patch_note/` 에 패치 카드를 남긴다.

> **구현이 먼저 바뀌고 문서가 따라가는 순서를 허용하지 않는다.** 그 순서를 한 번 허용하면
> 문서는 "현재 규칙"이 아니라 "과거 어느 시점의 관찰"이 된다.

---

## 이 규칙들이 강제되는 곳

| 규칙 | 강제 수단 | 현재 상태 |
| --- | --- | --- |
| 등급별 기본 실행 | `pyproject.toml` → `addopts = "-m 'not wiring'"` | **T0 에서 신설** |
| 마커 오타 차단 | `--strict-markers` | **T0 에서 신설** |
| 워크스페이스별 실행 | `turbo.json` → `test` 태스크 | **T0 에서 신설** |
| 정적 규칙 | `import-linter` 계약 11건 | ✅ 적용 중 |
| 계약 목록 최신성 | `tests/test_architecture_contracts.py` | ✅ 적용 중 |
| 저장소 격리 | `tests/conftest.py` | ✅ 적용 중 |

미적용 항목의 이행은 [`../migration/README.md`](../migration/README.md) 를 따른다.
