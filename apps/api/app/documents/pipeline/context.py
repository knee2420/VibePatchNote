"""문서 추출 파이프라인의 컨텍스트 및 공통 도메인 모델 (SSOT).

PipelineContext 기반 상태 누적 패턴:
모든 단계(Step)는 이 컨텍스트를 인자로 받아 자신이 분석한 결과를 누적합니다.
"""
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ElementItem(BaseModel):
    """아웃라인 섹션 내부에 속한 세부 컴포넌트 단위."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="엘리먼트 고유 식별자 (예: elem-1)")
    outline_id: Optional[str] = Field(None, description="소속 아웃라인 노드 ID")
    type: str = Field(
        ..., description="컴포넌트 타입: table | form_field | list | paragraph | media"
    )
    label: str = Field(..., description="표시 라벨 / 이름")
    page: int = Field(1, description="페이지 번호 (1-based)")
    box_2d: List[int] = Field(
        ..., description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    content_summary: Optional[str] = Field(None, description="내용 요약")
    structured_data: Optional[Dict[str, Any]] = Field(
        default=None, description="표 데이터(columns, rows), Key-Value 쌍 등 구조화 메타"
    )


class OutlineNode(BaseModel):
    """문서의 계층적 목차 및 섹션 뼈대."""

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(..., description="아웃라인 노드 식별자 (예: out-1)")
    level: int = Field(1, description="계층 깊이: 1 (대주제/장), 2 (절/소주제), 3 (세부항목)")
    title: str = Field(..., description="섹션 제목")
    page: int = Field(1, description="페이지 번호 (1-based)")
    box_2d: Optional[List[int]] = Field(
        None, description="[ymin, xmin, ymax, xmax] 0~1000 전체 섹션 추정 영역"
    )
    purpose: Optional[str] = Field(
        None, description="해당 섹션의 도메인 목적 (예: 회의비 지출 내역 증빙, 신청서 인적사항)"
    )
    elements: List[ElementItem] = Field(
        default_factory=list, description="이 섹션에 소속된 세부 엘리먼트 목록"
    )
    children: List["OutlineNode"] = Field(
        default_factory=list, description="하위 아웃라인 노드 목록"
    )


OutlineNode.model_rebuild()


class DocumentPipelineContext(BaseModel):
    """
    파이프라인 전체를 관통하는 상태 누적 컨텍스트 (State Accumulation).
    
    각 단계(Step)는 이전 단계의 결과가 누적된 이 객체를 참조하고 자신의 결과를 채워 넣습니다.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    file_path: Path = Field(..., description="처리 대상 파일의 절대 경로")
    filename: str = Field(..., description="파일명")
    page_number: Optional[int] = Field(None, description="특정 분석 페이지 (None이면 전체)")

    # Step 0: 실측 기하 (PyMuPDF - PageLayoutInfo 목록)
    geometry_pages: List[Any] = Field(
        default_factory=list, description="PyMuPDF 실측 페이지 기하 메타 목록"
    )

    # Step 1: 아웃라인 추출 결과
    outlines: List[OutlineNode] = Field(
        default_factory=list, description="계층적 아웃라인 트리"
    )

    # Step 2: 추출된 전체 엘리먼트 (평면 목록)
    flat_elements: List[ElementItem] = Field(
        default_factory=list, description="전체 엘리먼트 평면 목록 (뷰어 하이라이트용)"
    )

    # 파생 산출물
    markdown_outline: str = Field(default="", description="마크다운 목차 텍스트")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="도메인 메타데이터")
    logs: List[str] = Field(default_factory=list, description="단계별 실행 로그")
    status: str = Field("initialized", description="진행 상태 (processing, completed, failed)")

    def log(self, message: str) -> None:
        self.logs.append(message)
