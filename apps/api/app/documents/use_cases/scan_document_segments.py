"""세그먼트 스캔 유스케이스 (Agent 경로).

LLM 이 만들어 낸 결과이므로 캐시가 아니라 아티팩트로 커밋한다. 스캔은 실패해도
최소 구조를 돌려주지만, **그 폴백은 커밋하지 않는다** — 폴백을 채택본으로 두면
다음 요청이 그것을 정상 결과로 오인한다.
"""
from __future__ import annotations

import logging
from typing import Any

from app.core.agent_runtime import AgentRunInput, AgentRuntime
from app.core.storage import ARTIFACT_PREFIX, new_id

from ..experimental import build_segment_scan_prompt
from ..models import ArtifactProvenance, DocumentMeta
from ..ports import (
    DocumentArtifactRepository,
    DocumentSourceRepository,
    SegmentScanPort,
)

logger = logging.getLogger(__name__)

KIND = "segments"
SEGMENTS_FILE = "segments.json"
AGENT_NAME = "documents.segment-scan"


class ScanDocumentSegmentsUseCase:
    """문서의 논리 영역(표/목록/섹션) 바운딩 박스를 추출한다."""

    name = "documents.scan_segments"

    def __init__(
        self,
        source: DocumentSourceRepository,
        artifacts: DocumentArtifactRepository,
        scanner: SegmentScanPort,
        agent_runtime: AgentRuntime,
    ) -> None:
        self._source = source
        self._artifacts = artifacts
        self._scanner = scanner
        self._runtime = agent_runtime

    async def execute(self, doc_id: str) -> dict[str, Any]:
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")

        file_path = self._source.resolve_file(doc_id)
        prompt = build_segment_scan_prompt(file_path)

        agent_run, raw = await self._runtime.execute(
            AGENT_NAME,
            lambda: self._scanner.scan(prompt),
            doc_id=doc_id,
            run_input=AgentRunInput(
                use_case=self.name, doc_id=doc_id, payload={"docId": doc_id}
            ),
        )

        segments = (raw or {}).get("segments")
        if not isinstance(segments, list) or not segments:
            self._runtime.mark_failed(
                agent_run.run_id,
                error_code="SEGMENT_SCAN_EMPTY",
                detail="세그먼트를 하나도 추출하지 못했습니다.",
            )
            return self._fallback(meta, agent_run.run_id)

        response = {
            "status": "completed",
            "docId": doc_id,
            "document_title": (raw or {}).get("document_title") or meta.original_name,
            "total_segments": len(segments),
            "segments": segments,
            "agentRunId": agent_run.run_id,
        }
        self._commit(doc_id, segments, agent_run.run_id)
        return response

    def load_adopted(self, doc_id: str) -> dict[str, Any] | None:
        """현재 채택본을 그대로 읽는다. LLM 을 호출하지 않는 일반 경로다."""
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        adopted = self._artifacts.load_head(doc_id, KIND)
        if adopted is None:
            return None
        segments = adopted.get(SEGMENTS_FILE) or []
        return {
            "status": "completed",
            "docId": doc_id,
            "document_title": meta.original_name,
            "total_segments": len(segments),
            "segments": segments,
        }

    def save_edited(self, doc_id: str, segments: list[Any]) -> dict[str, Any]:
        """사용자가 손으로 고친 세그먼트를 새 아티팩트로 커밋한다.

        사람이 고친 값은 파생물이 아니라 **저작물**이다. 세션 노드에 사본으로 남기면
        재분석 때 조용히 사라진다. 그래서 아티팩트로 쌓고 HEAD 를 옮긴다.
        provenance 의 status 가 실행 결과와 사람의 손질을 구분한다.
        """
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")

        self._artifacts.commit(
            doc_id,
            KIND,
            {SEGMENTS_FILE: segments},
            ArtifactProvenance(
                artifact_id=new_id(ARTIFACT_PREFIX),
                kind=KIND,
                doc_id=doc_id,
                status="USER_EDITED",
                summary={"totalSegments": len(segments)},
            ),
        )
        return {
            "status": "completed",
            "docId": doc_id,
            "document_title": meta.original_name,
            "total_segments": len(segments),
            "segments": segments,
        }

    # --- 내부 -----------------------------------------------------------

    def _commit(self, doc_id: str, segments: list[Any], run_id: str) -> None:
        self._artifacts.commit(
            doc_id,
            KIND,
            {SEGMENTS_FILE: segments},
            ArtifactProvenance(
                artifact_id=new_id(ARTIFACT_PREFIX),
                kind=KIND,
                doc_id=doc_id,
                run_id=run_id,
                summary={"totalSegments": len(segments)},
            ),
        )

    @staticmethod
    def _fallback(meta: DocumentMeta, run_id: str) -> dict[str, Any]:
        """분석이 불가능할 때 돌려줄 최소 구조 (화면이 비지 않게 한다). 커밋하지 않는다."""
        logger.info("[ScanSegments] 폴백 구조 생성: %s", meta.doc_id)
        segments = [
            {
                "id": "seg-fb-1",
                "page": 1,
                "type": "section",
                "label": "문서 헤더 및 기본 개요",
                "box_2d": [50, 80, 180, 920],
                "content_summary": f"{meta.original_name} 상단 섹션",
            },
            {
                "id": "seg-fb-2",
                "page": 1,
                "type": "table",
                "label": "핵심 내용 및 데이터 표",
                "box_2d": [200, 80, 780, 920],
                "content_summary": "주요 항목 및 상세 본문 영역",
            },
        ]
        return {
            "status": "completed",
            "docId": meta.doc_id,
            "document_title": meta.original_name,
            "total_segments": len(segments),
            "segments": segments,
            "agentRunId": run_id,
        }
