from __future__ import annotations

from ..errors import SegmentNotFoundError
from ..models import SegmentArtifact
from ..ports import SegmentDocumentSource, SegmentRepository


class GetAdoptedSegmentsUseCase:
    def __init__(self, source: SegmentDocumentSource, repository: SegmentRepository) -> None:
        self._source = source
        self._repository = repository

    def execute(self, doc_id: str) -> tuple[str, SegmentArtifact | None]:
        """문서 제목과 채택본을 돌려준다.

        **아직 추출하지 않은 것은 오류가 아니다.** 그래서 `None` 은 "빈 상태"를 뜻하고,
        문서 자체가 없을 때만 `SegmentNotFoundError` 를 올린다. 제목을 함께 돌려주는
        이유는, 채택본이 없어도 호출자가 응답을 채울 수 있어야 하기 때문이다.
        """
        title = self._source.get_title(doc_id)
        if title is None:
            raise SegmentNotFoundError(f"Document not found: {doc_id}")
        return title, self._repository.load_head(doc_id)
