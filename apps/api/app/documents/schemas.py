"""documents 도메인의 요청/응답 스키마.

식별자는 `docId` 다. `filename` 은 아직 `docId` 로 옮기지 않은 클라이언트를 위한
과도기 통로이며, 새 코드는 쓰지 않는다. 둘 다 비어 있으면 요청을 거절한다 —
어느 문서를 말하는지 서버가 추측하지 않는다.
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, model_validator
from scaffold_engine import ElementItem, OutlineNode

# --- 공통 --------------------------------------------------------------------


class DocumentTarget(BaseModel):
    """어느 문서에 대한 요청인지 가리키는 공통 필드."""

    doc_id: Optional[str] = Field(default=None, alias="docId", description="문서 식별자")
    filename: Optional[str] = Field(
        default=None, description="(과도기) 파일명. docId 가 없을 때만 사용한다."
    )

    model_config = {"populate_by_name": True}

    @model_validator(mode="after")
    def _require_one(self) -> "DocumentTarget":
        if not self.doc_id and not self.filename:
            raise ValueError("docId 또는 filename 중 하나는 있어야 합니다.")
        return self


class AnalysisError(BaseModel):
    code: str
    message: str
    retryable: bool = False
    requires_action: Optional[str] = Field(None, alias="requiresAction")


# --- 업로드 ------------------------------------------------------------------


class UploadResponse(BaseModel):
    status: str = Field(..., description="처리 상태 (processing/completed)")
    doc_id: str = Field(..., alias="docId", description="문서 식별자")
    message: str
    title: str = Field(..., description="사용자가 올린 그대로의 파일명")
    file_url: str = Field(..., description="프런트엔드가 렌더링할 파일 URL")

    model_config = {"populate_by_name": True}


class DocumentSummary(BaseModel):
    doc_id: str = Field(alias="docId")
    title: str
    mime: str = ""
    size: int = 0
    uploaded_at: str = Field(alias="uploadedAt")
    outline_artifact_id: Optional[str] = Field(default=None, alias="outlineArtifactId")

    model_config = {"populate_by_name": True}


class DocumentArtifactsResponse(BaseModel):
    doc_id: str = Field(alias="docId")
    title: str
    artifacts: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


# --- 세그먼트 스캔 ------------------------------------------------------------


class SegmentItem(BaseModel):
    """스캔 결과의 평면 세그먼트 1건 (프런트 캔버스 오버레이가 그대로 소비)."""

    id: str = Field(..., description="세그먼트 식별자")
    page: int = Field(1, description="문서 페이지 번호 (1-based)")
    type: str = Field(..., description="블록 타입: section, table, list, paragraph")
    label: str = Field(..., description="블록 표시 라벨/제목")
    box_2d: List[int] = Field(
        ..., description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    content_summary: Optional[str] = Field(None, description="블록 내용 요약")


class ScanDocumentRequest(DocumentTarget):
    pass


class ScanDocumentResponse(BaseModel):
    status: str = Field("completed", description="처리 상태 (completed/failed)")
    doc_id: str = Field(..., alias="docId")
    document_title: str = Field(..., description="문서 제목")
    total_segments: int = Field(..., description="감지된 세그먼트 수")
    segments: List[SegmentItem] = Field(default_factory=list, description="세그먼트 목록")
    agent_run_id: Optional[str] = Field(default=None, alias="agentRunId")

    model_config = {"populate_by_name": True}


class SegmentsUpdate(BaseModel):
    """사용자가 편집한 세그먼트 저장 요청."""

    segments: List[SegmentItem] = Field(default_factory=list)


# --- 스캐폴드 ----------------------------------------------------------------


class ScaffoldDocumentRequest(DocumentTarget):
    pass


class ScaffoldDocumentResponse(BaseModel):
    status: str = Field("completed", description="처리 상태")
    doc_id: str = Field(..., alias="docId")
    meta: Dict[str, Any] = Field(..., description="서식 메타데이터")
    html_content: str = Field(..., alias="htmlContent", description="Tiptap 에디터용 HTML")
    markdown_content: str = Field(..., alias="markdownContent", description="에이전트/MCP 용 마크다운")
    slots: List[Dict[str, Any]] = Field(default_factory=list, description="슬롯 매핑 정보")
    archive: Optional[Dict[str, Any]] = Field(default=None, description="영속화된 아카이브 및 비전 에셋 메타")
    agent_run_id: Optional[str] = Field(default=None, alias="agentRunId")

    model_config = {"populate_by_name": True}


# --- 아웃라인 ----------------------------------------------------------------


class ExtractOutlineRequest(DocumentTarget):
    force_refresh: bool = Field(
        False, description="채택본을 무시하고 새 아티팩트를 만들지 여부"
    )


class ExtractOutlineResponse(BaseModel):
    status: str = Field("completed", description="처리 상태 (completed/failed)")
    doc_id: str = Field(..., alias="docId")
    document_title: str = Field(..., description="문서 제목")
    total_pages: int = Field(1, description="총 페이지 수")
    total_outlines: int = Field(0, description="추출된 아웃라인 수")
    total_elements: int = Field(0, description="추출된 엘리먼트 수")
    outlines: List[OutlineNode] = Field(default_factory=list, description="계층형 아웃라인 트리")
    elements: List[ElementItem] = Field(default_factory=list, description="뷰어 하이라이트용 평면 엘리먼트")
    markdown_outline: str = Field("", description="가독성 마크다운 목차")
    manifest: Optional[Dict[str, Any]] = Field(None, description="산출물 provenance")
    artifact_id: Optional[str] = Field(None, alias="artifactId", description="채택된 아티팩트 식별자")
    trace_id: Optional[str] = Field(None, alias="traceId", description="관측 trace 식별자")
    agent_run_id: Optional[str] = Field(None, alias="agentRunId", description="Agent 실행 식별자")
    error: Optional[AnalysisError] = Field(None, description="실패 시 사용자에게 안전하게 노출할 실행 정보")

    model_config = {"populate_by_name": True}


# --- 실행 상태 ---------------------------------------------------------------


class RunAccepted(BaseModel):
    run_id: str = Field(alias="runId")
    status: str

    model_config = {"populate_by_name": True}


class RunCostView(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    thinking_tokens: int = 0
    cache_read_tokens: int = 0
    total_tokens: int = 0


class RunResponse(BaseModel):
    """실행 상태. 아키텍처 계약의 6상태를 그대로 노출한다.

    `waiting_for_configuration` / `waiting_for_approval` 은 실패가 아니라 보류다.
    프런트가 이 둘을 실패로 그리면 사용자는 재시도만 반복하게 된다.
    """

    run_id: str = Field(alias="runId")
    status: str
    doc_id: Optional[str] = Field(default=None, alias="docId")
    attempt: int = 1
    agreement_id: Optional[str] = Field(default=None, alias="agreementId")
    trace_id: Optional[str] = Field(default=None, alias="traceId")
    cost: RunCostView = Field(default_factory=RunCostView)
    result: Optional[Dict[str, Any]] = None
    error_code: Optional[str] = Field(default=None, alias="errorCode")

    model_config = {"populate_by_name": True}


class AgreementView(BaseModel):
    agreement_id: str = Field(alias="agreementId")
    kind: str
    status: str
    reason: str = ""
    run_id: Optional[str] = Field(default=None, alias="runId")
    doc_id: Optional[str] = Field(default=None, alias="docId")
    requested_at: Optional[str] = Field(default=None, alias="requestedAt")

    model_config = {"populate_by_name": True}


class AgreementDecision(BaseModel):
    approved: bool = Field(..., description="사용자가 동의했는지 여부")
