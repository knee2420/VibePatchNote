"""documents 도메인의 유스케이스.

두 갈래로 나뉜다.

- **일반 경로** — LLM 이 개입하지 않는다. Agent Runtime 을 쓰지 않고, 결과가
  결정적이면 `cache/` 를 써도 된다.
  `register_document` `get_document_file` `delete_document` `list_artifacts`

- **Agent 경로** — LLM 이 개입한다. Agent Runtime 을 통과하고, 산출물은
  `data/` 에 provenance 와 함께 아티팩트로 커밋한다.
  `extract_outline` `scan_document_segments` `generate_scaffold`
"""
from .delete_document import DeleteDocumentUseCase
from .extract_outline import ExtractOutlineUseCase
from .generate_scaffold import GenerateScaffoldUseCase
from .get_document_file import GetDocumentFileUseCase
from .list_artifacts import ListDocumentArtifactsUseCase
from .register_document import RegisterDocumentUseCase
from .scan_document_segments import ScanDocumentSegmentsUseCase

__all__ = [
    "RegisterDocumentUseCase",
    "GetDocumentFileUseCase",
    "DeleteDocumentUseCase",
    "ListDocumentArtifactsUseCase",
    "ExtractOutlineUseCase",
    "ScanDocumentSegmentsUseCase",
    "GenerateScaffoldUseCase",
]
