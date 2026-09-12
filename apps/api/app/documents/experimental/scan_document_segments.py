"""
⚠️ [EXPERIMENTAL / PENDING SPEC]
세그먼트 스캔(Segment Scan) 유스케이스 및 프롬프트 통합 모듈.

메인 아웃라인 파이프라인과 분리된 실험/과도기적 세그먼트 스캔 기능입니다.
PDF 문서 상의 시각적 컬러 마스크 오버레이 및 수동 조절(HITL) 검증 목적으로 보존됩니다.
LLM 이 만들어 낸 결과이므로 캐시가 아니라 아티팩트로 커밋합니다.
스캔은 실패해도 최소 구조를 돌려주지만, 그 폴백은 커밋하지 않습니다.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from agent_runtime import AgentRunInput, AgentRuntime, current_run_id

from app.core.storage import ARTIFACT_PREFIX, new_id

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


def build_segment_scan_prompt(file_path: Path) -> str:
    """문서의 표/목록/섹션 영역과 정규화 Bounding Box 를 추출하도록 지시합니다."""
    return (
        f"당신은 고정밀 문서 구조 분석 엔진입니다.\n"
        f"다음 문서 파일의 내용을 정밀 분석하세요: {file_path.resolve()}\n\n"
        f"목표:\n"
        f"1. 문서의 페이지별로 표(table), 개조식 목록(list), 섹션/제목(section), 핵심 본문(paragraph) 영역을 분할하세요.\n"
        f"2. 각 영역의 페이지 번호(page, 1부터 시작), 블록 타입(type), 블록 제목/라벨(label), 핵심 요약(content_summary)을 추출하세요.\n"
        f"3. 각 영역의 상대 위치 Bounding Box(box_2d)를 [ymin, xmin, ymax, xmax] 형식의 0~1000 사이 정수 비율로 추정하세요.\n"
        f"   (예: 상단 5%~25%, 좌측 8%~92%면 [50, 80, 250, 920])\n\n"
        f"반드시 다음 JSON 형식으로만 응답하고, 마크다운 코드블록이나 불필요한 서술은 일체 제외하세요:\n"
        f'{{\n'
        f'  "document_title": "{file_path.name}",\n'
        f'  "total_pages": 1,\n'
        f'  "segments": [\n'
        f'    {{\n'
        f'      "id": "seg-1",\n'
        f'      "page": 1,\n'
        f'      "type": "table",\n'
        f'      "label": "회의비 사용 내역 표",\n'
        f'      "box_2d": [150, 80, 750, 920],\n'
        f'      "content_summary": "일시, 장소, 참석자, 안건, 회의내용, 지출금액 등이 포함된 사용 내역 표"\n'
        f'    }}\n'
        f'  ]\n'
        f'}}\n'
    )


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

        run_id = current_run_id()
        if run_id:
            raw = await self._scanner.scan(prompt)
        else:
            agent_run, raw = await self._runtime.execute(
                AGENT_NAME,
                lambda: self._scanner.scan(prompt),
                doc_id=doc_id,
                run_input=AgentRunInput(
                    use_case=self.name, doc_id=doc_id, payload={"docId": doc_id}
                ),
            )
            run_id = agent_run.run_id

        segments: list[Any] | None = None
        doc_title = meta.original_name
        if isinstance(raw, dict):
            segments = (
                raw.get("segments")
                or raw.get("blocks")
                or raw.get("__engine_payload__")
            )
            doc_title = raw.get("document_title") or meta.original_name
        elif isinstance(raw, list):
            segments = raw

        if not isinstance(segments, list) or not segments:
            self._runtime.mark_failed(
                run_id,
                error_code="SEGMENT_SCAN_EMPTY",
                detail="세그먼트를 하나도 추출하지 못했습니다.",
            )
            return self._fallback(meta, run_id)

        response = {
            "status": "completed",
            "docId": doc_id,
            "document_title": doc_title,
            "total_segments": len(segments),
            "segments": segments,
            "agentRunId": run_id,
        }
        self._commit(doc_id, segments, run_id)
        return response

    def load_adopted(self, doc_id: str) -> dict[str, Any] | None:
        """현재 채택본을 그대로 읽는다. LLM 을 호출하지 않는 일반 경로다."""
        meta = self._source.get(doc_id)
        if meta is None:
            raise FileNotFoundError(f"Document not found: {doc_id}")
        adopted = self._artifacts.load_head(doc_id, KIND)
        if adopted is None:
            return {
                "status": "completed",
                "docId": doc_id,
                "document_title": meta.original_name,
                "total_segments": 0,
                "segments": [],
            }
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
