"""outline 도메인의 아티팩트 아카이빙 및 채택본(HEAD) 조회 어댑터."""
from __future__ import annotations

import logging
from typing import Any

from agent_runtime import RunCost
from agent_telemetry import SpanPhase, SpanType, current_scope, traceable

from app.core.storage import ARTIFACT_PREFIX, new_id

from ..models import (
    OUTLINE_ELEMENTS_FILE,
    OUTLINE_KIND,
    OUTLINE_MARKDOWN_FILE,
    OUTLINE_TREE_FILE,
    OutlineArtifactFiles,
    OutlineExecutionResult,
    OutlineTreeContent,
)
from ..ports import OutlineArchivePort, OutlineArtifactRepository

logger = logging.getLogger(__name__)


class DocumentOutlineArchiveAdapter(OutlineArchivePort):
    """`OutlineArchivePort` 계약의 아티팩트 저장소 구현체."""

    def __init__(self, artifacts: OutlineArtifactRepository) -> None:
        self._artifacts = artifacts

    @traceable(
        name="CacheAndHeadInspection",
        span_type=SpanType.TOOL,
        phase=SpanPhase.PRE_LLM,
        display_label="채택본(HEAD) 및 캐시 유효성 검사",
        description="기존 분석 아티팩트 존재 여부와 강제 재분석(forceRefresh) 여부를 판정합니다.",
    )
    def load_adopted(self, meta: Any) -> dict[str, Any] | None:
        """현재 채택본을 그대로 읽어 검증 후 반환한다."""
        doc_id = getattr(meta, "doc_id", None) or str(meta)
        adopted = self._artifacts.load_head(doc_id, OUTLINE_KIND)
        scope = current_scope()
        if adopted is None:
            if scope:
                scope.set_label(
                    summary_pill="캐시 미스 (재분석 필요)",
                    data_in=f"doc_id: {doc_id}",
                    data_out="Cache Miss (None)",
                )
            return None
        response = self._response_from_artifact(meta, adopted)
        if not self._is_usable_response(response):
            logger.warning("[OutlineArchive] 내용 없는 채택본 무시: %s", doc_id)
            if scope:
                scope.set_label(
                    summary_pill="내용 없는 채택본 (재분석 필요)",
                    data_in=f"doc_id: {doc_id}",
                    data_out="Unusable Cache",
                )
            return None
        if scope:
            outlines_cnt = len(response.get("outlines") or [])
            scope.set_label(
                summary_pill=f"채택본(HEAD) 재사용 ({outlines_cnt}개 노드)",
                data_in=f"doc_id: {doc_id}",
                data_out=f"Adopted HEAD ({outlines_cnt} outlines)",
            )
        return response

    @traceable(
        name="OutlineArtifactCommit",
        span_type=SpanType.TOOL,
        phase=SpanPhase.POST_LLM,
        display_label="산출물 버전 관리 커밋(아카이빙)",
        description="60-data 불변 저장소에 산출물을 영구 커밋하고 최신 채택본(HEAD)을 갱신합니다.",
    )
    def archive(
        self,
        meta: Any,
        document: Any,
        *,
        run_id: str,
        cost: RunCost,
        default_model: str = "",
    ) -> Any:
        """아웃라인 추출 산출물을 버전 관리 아티팩트로 커밋한다."""
        doc_id = getattr(meta, "doc_id", None) or str(meta)
        original_name = getattr(meta, "original_name", "") or getattr(meta, "title", "document")

        telemetry = getattr(document, "telemetry", None) or {}
        engine = telemetry.get("provenance") or {}

        from ..models import ArtifactProvenance

        provenance = ArtifactProvenance(
            artifact_id=new_id(ARTIFACT_PREFIX),
            kind=OUTLINE_KIND,
            doc_id=doc_id,
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
                "totalPages": getattr(document, "total_pages", 1),
                "totalOutlines": len(getattr(document, "outlines", [])),
                "totalElements": len(getattr(document, "flat_elements", [])),
            },
        )
        artifact_files = OutlineArtifactFiles(
            tree=OutlineTreeContent(
                document_title=original_name,
                total_pages=getattr(document, "total_pages", 1),
                outlines=getattr(document, "outlines", []),
            ),
            elements=getattr(document, "flat_elements", []),
            markdown=getattr(document, "markdown_outline", "") or "",
        )
        committed = self._artifacts.commit(doc_id, OUTLINE_KIND, artifact_files.to_commit_dict(), provenance)
        scope = current_scope()
        if scope:
            scope.set_label(
                summary_pill=f"아티팩트 {provenance.artifact_id[:12]} 커밋 완료",
                data_in=f"OutlineDocument (pages: {document.total_pages})",
                data_out=f"artifact: {provenance.artifact_id}",
            )
        return committed

    def _response_from_artifact(
        self, meta: Any, artifact: dict[str, Any]
    ) -> dict[str, Any]:
        doc_id = getattr(meta, "doc_id", None) or str(meta)
        original_name = getattr(meta, "original_name", "") or getattr(meta, "title", "document")

        tree = artifact.get(OUTLINE_TREE_FILE) or {}
        provenance = artifact.get("provenance") or {}
        summary = provenance.get("summary") or {}
        result = OutlineExecutionResult(
            status="completed",
            doc_id=doc_id,
            document_title=tree.get("document_title") or tree.get("documentTitle") or original_name,
            total_pages=summary.get("totalPages") or summary.get("total_pages") or tree.get("totalPages") or tree.get("total_pages", 1),
            total_outlines=summary.get("totalOutlines") or summary.get("total_outlines") or len(tree.get("outlines") or []),
            total_elements=summary.get("totalElements") or summary.get("total_elements") or len(artifact.get(OUTLINE_ELEMENTS_FILE) or []),
            outlines=tree.get("outlines") or [],
            elements=artifact.get(OUTLINE_ELEMENTS_FILE) or [],
            markdown_outline=artifact.get(OUTLINE_MARKDOWN_FILE) or "",
            manifest=artifact.get("manifest") or provenance,
            artifact_id=provenance.get("artifactId") or provenance.get("artifact_id"),
            trace_id=provenance.get("traceId") or provenance.get("trace_id"),
            agent_run_id=provenance.get("runId") or provenance.get("agentRunId") or provenance.get("agent_run_id"),
        )
        return result.to_dict()

    @staticmethod
    def _is_usable_response(response: dict[str, Any]) -> bool:
        """저장된 채택본이 실제로 쓸 만한지 판정한다."""
        outlines = response.get("outlines") or []
        elements = response.get("elements") or []
        markdown = (response.get("markdownOutline") or "").strip()
        return bool(outlines or elements or markdown)
