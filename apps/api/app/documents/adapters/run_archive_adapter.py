"""`RunArchivePort` 의 구현. 실행 기록 보관소에 연쇄 삭제를 위임한다.

documents 는 실행 기록이 어디에 어떤 모양으로 있는지 모른다. 아는 것은
"이 문서에서 비롯된 기록을 지워 달라"는 요청 하나뿐이다.
"""
from __future__ import annotations

from app.core.observation import RunObservationStore


class RunObservationArchiveAdapter:
    def __init__(self, observations: RunObservationStore) -> None:
        self._observations = observations

    def delete_for_document(self, doc_id: str) -> int:
        return self._observations.delete_for_document(doc_id)
