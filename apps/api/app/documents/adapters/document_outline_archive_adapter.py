"""문서 도메인의 아웃라인 아티팩트 아카이빙 및 채택본 조회 어댑터."""
from __future__ import annotations

import logging
from typing import Any

from agent_runtime import RunCost

from app.core.storage import ARTIFACT_PREFIX, new_id

from ..models import (
    OUTLINE_ELEMENTS_FILE,
    OUTLINE_MARKDOWN_FILE,
    OUTLINE_TREE_FILE,
    ArtifactProvenance,
    DocumentMeta,
    OutlineArtifactFiles,
    OutlineExecutionResult,
    OutlineTreeContent,
)
from ..ports import DocumentArtifactRepository

logger = logging.getLogger(__name__)

KIND = "outline"


class DocumentOutlineArchiveAdapter:
    """`OutlineArchivePort` 계약의 아티팩트 저장소 구현체."""

    def __init__(self, artifacts: DocumentArtifactRepository) -> None:
        self._artifacts = artifacts

    def load_adopted(self, meta: DocumentMeta) -> dict[str, Any] | None:
        """현재 채택본을 그대로 읽어 검증 후 반환한다."""
        adopted = self._artifacts.load_head(meta.doc_id, KIND)
        if adopted is None:
            return None
        response = self._response_from_artifact(meta, adopted)
        if not self._is_usable_response(response):
            logger.warning("[OutlineArchive] 내용 없는 채택본 무시: %s", meta.doc_id)
            return None
        return response

    def archive(
        self,
        meta: DocumentMeta,
        document: Any,
        *,
        run_id: str,
        cost: RunCost,
        default_model: str = "",
    ) -> ArtifactProvenance:
        """아웃라인 추출 산출물을 버전 관리 아티팩트로 커밋한다."""
        telemetry = getattr(document, "telemetry", None) or {}
        engine = telemetry.get("provenance") or {}

        provenance = ArtifactProvenance(
            artifact_id=new_id(ARTIFACT_PREFIX),
            kind=KIND,
            doc_id=meta.doc_id,
            status="SUCCESS",
            run_id=run_id,
            trace_id=run_id,
            model=engine.get("model") or telemetry.get("model") or default_model,
            effort=engine.get("effort"),
            prompt_hash=engine.get("prompt_hash"),
            schema_hash=engine.get("schema_hash"),
            engine_version=engine.get("engine_version"),
            cost=cost,
            summary={
                "totalPages": document.total_pages,
                "totalOutlines": len(document.outlines),
                "totalElements": len(document.flat_elements),
            },
        )
        artifact_files = OutlineArtifactFiles(
            tree=OutlineTreeContent(
                document_title=meta.original_name,
                total_pages=document.total_pages,
                outlines=document.outlines,
            ),
            elements=document.flat_elements,
            markdown=document.markdown_outline or "",
        )
        return self._artifacts.commit(meta.doc_id, KIND, artifact_files.to_commit_dict(), provenance)

    def _response_from_artifact(
        self, meta: DocumentMeta, artifact: dict[str, Any]
    ) -> dict[str, Any]:
        tree = artifact.get(OUTLINE_TREE_FILE) or {}
        provenance = artifact.get("provenance") or {}
        summary = provenance.get("summary") or {}
        result = OutlineExecutionResult(
            status="completed",
            doc_id=meta.doc_id,
            document_title=meta.original_name,
            total_pages=summary.get("totalPages") or tree.get("totalPages", 1),
            total_outlines=summary.get("totalOutlines") or len(tree.get("outlines") or []),
            total_elements=summary.get("totalElements") or len(artifact.get(OUTLINE_ELEMENTS_FILE) or []),
            outlines=tree.get("outlines") or [],
            elements=artifact.get(OUTLINE_ELEMENTS_FILE) or [],
            markdown_outline=artifact.get(OUTLINE_MARKDOWN_FILE) or "",
            manifest=artifact.get("manifest") or {},
            artifact_id=provenance.get("artifactId"),
            trace_id=provenance.get("traceId"),
            agent_run_id=provenance.get("runId"),
        )
        return result.to_dict()

    @staticmethod
    def _is_usable_response(response: dict[str, Any]) -> bool:
        """저장된 채택본이 실제로 쓸 만한지 판정한다."""
        outlines = response.get("outlines") or []
        elements = response.get("elements") or []
        markdown = (response.get("markdownOutline") or "").strip()
        return bool(outlines or elements or markdown)
