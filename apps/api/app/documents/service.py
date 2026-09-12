"""documents 도메인의 얇은 진입점.

비즈니스 로직은 `use_cases/` 및 `agents/` 가 갖는다. 이 계층이 하는 일은 세 가지뿐이다.

1. 요청이 준 식별자(`docId` 또는 레거시 `filename`)를 `doc_id` 로 정규화한다.
2. 알맞은 유스케이스나 에이전트로 넘긴다.
3. 재개 가능한 유스케이스/에이전트를 Agent Runtime 에 등록한다.

여기에 조건 분기나 저장 경로가 다시 쌓이기 시작하면, 그것은 아래로 내려가야
할 로직이 올라온 것이다.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from app.core.agent_runtime import AgentRunInput, AgentRuntime, ApprovalService

from .agents import (
    ExtractOutlineUseCase,
    GenerateScaffoldUseCase,
)
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
    """라우터와 유스케이스/에이전트 사이의 얇은 경계."""

    def __init__(
        self,
        register: RegisterDocumentUseCase,
        get_file: GetDocumentFileUseCase,
        delete: DeleteDocumentUseCase,
        artifacts: ListDocumentArtifactsUseCase,
        extract_outline: ExtractOutlineUseCase,
        scan_segments: ScanDocumentSegmentsUseCase,
        generate_scaffold: GenerateScaffoldUseCase,
        agent_runtime: AgentRuntime,
        approvals: ApprovalService,
    ) -> None:
        self._register = register
        self._get_file = get_file
        self._delete = delete
        self._artifacts = artifacts
        self._extract_outline = extract_outline
        self._scan_segments = scan_segments
        self._generate_scaffold = generate_scaffold
        self._runtime = agent_runtime
        self._approvals = approvals

        # 재개는 "이름 + 입력 스냅샷"으로만 가능하다. 여기서 등록하지 않으면
        # 끊긴 실행을 다시 이어갈 수 없다.
        self._runtime.register_use_case(
            self._extract_outline.name,
            lambda payload: self._extract_outline.execute(
                payload["docId"], force_refresh=payload.get("forceRefresh", True)
            ),
        )
        self._runtime.register_use_case(
            self._scan_segments.name,
            lambda payload: self._scan_segments.execute(payload["docId"]),
        )
        self._runtime.register_use_case(
            self._generate_scaffold.name,
            lambda payload: self._generate_scaffold.execute(payload["docId"]),
        )

    # --- 일반 경로 -------------------------------------------------------

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

    def load_adopted_outline(self, doc_id: str) -> dict[str, Any] | None:
        return self._extract_outline.load_adopted(doc_id)

    def load_adopted_segments(self, doc_id: str) -> dict[str, Any] | None:
        return self._scan_segments.load_adopted(doc_id)

    def save_edited_segments(self, doc_id: str, segments: list[Any]) -> dict[str, Any]:
        return self._scan_segments.save_edited(doc_id, segments)

    # --- Agent 경로 ------------------------------------------------------

    async def scan_document_segments(self, doc_id: str) -> dict[str, Any]:
        return await self._scan_segments.execute(doc_id)

    async def extract_document_outline(
        self, doc_id: str, force_refresh: bool = False
    ) -> dict[str, Any]:
        return await self._extract_outline.execute(doc_id, force_refresh=force_refresh)

    async def start_document_outline(
        self, doc_id: str, force_refresh: bool = False
    ) -> dict[str, Any]:
        """긴 AI 분석을 HTTP 연결과 분리해 Agent Runtime 에서 실행한다."""
        run = await self._runtime.submit(
            self._extract_outline.name,
            lambda: self._extract_outline.execute(doc_id, force_refresh=force_refresh),
            doc_id=doc_id,
            run_input=AgentRunInput(
                use_case=self._extract_outline.name,
                doc_id=doc_id,
                payload={"docId": doc_id, "forceRefresh": force_refresh},
            ),
        )
        return {"runId": run.run_id, "status": run.status}

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

    async def start_scaffold(self, doc_id: str) -> dict[str, Any]:
        run = await self._runtime.submit(
            self._generate_scaffold.name,
            lambda: self._generate_scaffold.execute(doc_id),
            doc_id=doc_id,
            run_input=AgentRunInput(
                use_case=self._generate_scaffold.name,
                doc_id=doc_id,
                payload={"docId": doc_id},
            ),
        )
        return {"runId": run.run_id, "status": run.status}

    async def extract_scaffold(self, doc_id: str) -> dict[str, Any]:
        return await self._generate_scaffold.execute(doc_id)

    # --- 실행 상태 -------------------------------------------------------

    def get_run(self, run_id: str) -> dict[str, Any] | None:
        run = self._runtime.get(run_id)
        if run is None:
            return None
        return {
            "runId": run.run_id,
            "status": run.status,
            "docId": run.doc_id,
            "attempt": run.attempt,
            "agreementId": run.agreement_id,
            "traceId": run.trace_id,
            "cost": run.cost.model_dump(),
            "result": run.result,
            "errorCode": run.error_code,
            "execution": run.metadata.get("execution"),
        }

    async def resume_run(self, run_id: str) -> dict[str, Any] | None:
        run = await self._runtime.resume(run_id)
        if run is None:
            return None
        return {"runId": run.run_id, "status": run.status, "attempt": run.attempt}

    def list_pending_agreements(self) -> list[dict[str, Any]]:
        return [
            agreement.model_dump(mode="json")
            for agreement in self._approvals.list_pending()
        ]

    def decide_agreement(self, agreement_id: str, approved: bool) -> dict[str, Any] | None:
        agreement = self._approvals.decide(agreement_id, approved)
        return agreement.model_dump(mode="json") if agreement else None
