# Documents Use Cases

documents 도메인의 일반 유스케이스를 정의한다. **LLM 이 개입하지 않는 일반 경로**는 Agent Runtime 을 쓰지 않는다.

## 일반 경로 — Agent Runtime 을 쓰지 않는다

| 유스케이스 | 하는 일 |
| --- | --- |
| `register_document` | 원본을 패키지로 받아들이고 `doc_id` 를 발급 |
| `get_document_file` | 원본 경로 해석 (`docId` 정본, `filename` 은 과도기) |
| `delete_document` | 아티팩트 → 캐시 → 스캐폴드 → 트레이스 → 원본 순으로 연쇄 삭제 |
| `list_artifacts` | 산출물 이력과 현재 채택본(HEAD) 조회 |

결과가 결정적이면 `cache/` 를 써도 된다.

## Agent 경로 — `documents/agents/`

LLM 이 개입하는 아웃라인 추출(`extract_outline`) 및 스캐폴드 생성(`generate_scaffold`)은 `documents/agents/` 에 배치되어 있습니다.
(실험/과도기적 세그먼트 스캔 `scan_document_segments`는 `documents/experimental/` 에 격리)

상세 내용은 [`../agents/README.md`](../agents/README.md) 를 참조하십시오.

## 규칙

- 유스케이스는 **포트만** 안다. 저장 경로·파일명 규격은 `adapters/` 가 갖는다
- `app.core.config` 를 import 하지 않는다 (import-linter 계약으로 강제)

정본: [`.agents/rules/60-data/rule.md`](../../../../../.agents/rules/60-data/rule.md)
