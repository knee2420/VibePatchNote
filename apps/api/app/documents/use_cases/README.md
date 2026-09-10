# Documents Use Cases

유스케이스는 두 갈래로 나뉜다. **LLM 이 개입하는가**가 그 경계다.

## 일반 경로 — Agent Runtime 을 쓰지 않는다

| 유스케이스 | 하는 일 |
| --- | --- |
| `register_document` | 원본을 패키지로 받아들이고 `doc_id` 를 발급 |
| `get_document_file` | 원본 경로 해석 (`docId` 정본, `filename` 은 과도기) |
| `delete_document` | 아티팩트 → 캐시 → 스캐폴드 → 트레이스 → 원본 순으로 연쇄 삭제 |
| `list_artifacts` | 산출물 이력과 현재 채택본(HEAD) 조회 |

결과가 결정적이면 `cache/` 를 써도 된다.

## Agent 경로 — Agent Runtime 을 통과한다

| 유스케이스 | 하는 일 |
| --- | --- |
| `extract_outline` | 계층 아웃라인 + 엘리먼트 |
| `scan_document_segments` | 표/목록/섹션 바운딩 박스 |
| `generate_scaffold` | Tiptap 스캐폴딩 |

산출물은 `data/knowledge/.../artifacts/` 에 **provenance 와 함께 불변으로** 커밋하고
HEAD 포인터만 옮긴다. 실패 폴백은 커밋하지 않는다 — 다음 요청이 그것을 정상 결과로
오인한다.

## 규칙

- 유스케이스는 **포트만** 안다. 저장 경로·파일명 규격은 `adapters/` 가 갖는다
- `app.core.config` 를 import 하지 않는다 (import-linter 계약으로 강제)
- 재개 가능한 유스케이스는 `service.py` 에서 `register_use_case()` 로 등록한다.
  등록하지 않으면 끊긴 실행을 이어갈 수 없다

정본: [`.agents/rules/60-data/rule.md`](../../../../../.agents/rules/60-data/rule.md)
