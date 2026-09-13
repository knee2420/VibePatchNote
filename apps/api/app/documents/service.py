"""documents 도메인의 진입점 서비스.

비즈니스 로직은 `use_cases/` 및 `experimental/` 이 갖는다. 이 계층이 하는 일은:
1. 요청이 준 식별자(`docId` 또는 레거시 `filename`)를 `doc_id` 로 정규화한다.
2. 알맞은 유스케이스로 위임한다.
3. 세그먼트 스캔 비동기 실행을 Agent Runtime 에 연계한다.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from agent_runtime import AgentRunInput, AgentRuntime

from .experimental import ScanDocumentSegmentsUseCase
from .models import DocumentMeta
from .use_cases import (
    DeleteDocumentUseCase,
    GetDocumentFileUseCase,
    ListDocumentArtifactsUseCase,
    RegisterDocumentUseCase,
)

logger = logging.getLogger(__name__)


class DocumentService:
    """라우터와 문서 유스케이스 사이의 경계 서비스."""

    def __init__(
        self,
        register: RegisterDocumentUseCase,
        get_file: GetDocumentFileUseCase,
        delete: DeleteDocumentUseCase,
        artifacts: ListDocumentArtifactsUseCase,
        scan_segments: ScanDocumentSegmentsUseCase,
        agent_runtime: AgentRuntime,
    ) -> None:
        self._register = register
        self._get_file = get_file
        self._delete = delete
        self._artifacts = artifacts
        self._scan_segments = scan_segments
        self._runtime = agent_runtime

        # 세그먼트 스캔 재개 핸들러 등록
        self._runtime.register_use_case(
            self._scan_segments.name,
            lambda payload: self._scan_segments.execute(payload["docId"]),
        )

    # --- 원본 문서 관리 ---------------------------------------------------

    def register_upload(self, filename: str, content: bytes) -> DocumentMeta:
        return self._register.execute(filename, content)

    def get_file_by_id(self, doc_id: str) -> tuple[Path, DocumentMeta]:
        return self._get_file.by_id(doc_id)

    def get_file_by_name(self, filename: str) -> tuple[Path, DocumentMeta]:
        return self._get_file.by_name(filename)

    def resolve_doc_id(self, doc_id: str | None, filename: str | None) -> str:
        return self._get_file.resolve_id(doc_id, filename)

    def delete_document(self, doc_id: str) -> dict[str, Any]:
        return self._delete.execute(doc_id)

    def list_documents(self) -> list[dict[str, Any]]:
        return self._artifacts.list_documents()

    def list_artifacts(self, doc_id: str) -> dict[str, Any]:
        return self._artifacts.execute(doc_id)

    # --- 세그먼트 스캔 -----------------------------------------------------

    def load_adopted_segments(self, doc_id: str) -> dict[str, Any] | None:
        return self._scan_segments.load_adopted(doc_id)

    def save_edited_segments(self, doc_id: str, segments: list[Any]) -> dict[str, Any]:
        return self._scan_segments.save_edited(doc_id, segments)

    async def scan_document_segments(self, doc_id: str) -> dict[str, Any]:
        return await self._scan_segments.execute(doc_id)

    async def start_document_scan(self, doc_id: str) -> dict[str, Any]:
        run = await self._runtime.submit(
            self._scan_segments.name,
            lambda: self._scan_segments.execute(doc_id),
            doc_id=doc_id,
            run_input=AgentRunInput(
                use_case=self._scan_segments.name,
                doc_id=doc_id,
                payload={"docId": doc_id},
            ),
        )
        return {"runId": run.run_id, "status": run.status}
