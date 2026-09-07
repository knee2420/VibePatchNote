"""Step 2: 아웃라인 기반 세부 엘리먼트 추출 및 매핑 단계 (LLM).

Co-location 원칙:
앞선 단계에서 축적된 [실측 기하 + 아웃라인 트리]를 컨텍스트로 주입받아,
각 섹션 내부의 구체적인 부품(표, 폼 필드, 목록, 단락)을 정밀 추출하고 아웃라인 노드에 연결합니다.
"""
import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.antigravity import AntigravityAgent, antigravity_agent
from app.documents.pipeline.context import DocumentPipelineContext, ElementItem, OutlineNode
from app.documents.pipeline.steps.base import PipelineStep

logger = logging.getLogger(__name__)


# --- 1. Step 전용 입출력 스키마 ---

class RawElementOutput(BaseModel):
    id: str = Field(..., description="elem-1, elem-2 등")
    outline_id: str = Field(..., description="소속 아웃라인 노드 ID (out-1 등)")
    type: str = Field(
        ..., description="table | form_field | list | paragraph | media"
    )
    label: str = Field(..., description="표시 라벨 (예: 지출 내역 표, 참석자 인적사항)")
    page: int = Field(1, description="페이지 번호 (1-based)")
    box_2d: List[int] = Field(
        ..., description="[ymin, xmin, ymax, xmax] 0~1000 상대 좌표"
    )
    content_summary: Optional[str] = Field(None, description="핵심 내용 요약")
    structured_data: Optional[Dict[str, Any]] = Field(
        default=None, description="표 컬럼/데이터, Key-Value 등 구조화 메타"
    )


class ElementsStepOutput(BaseModel):
    elements: List[RawElementOutput]


# --- 2. Step 구현 ---

class EnrichElementsStep(PipelineStep):
    """
    2단계: 축적된 아웃라인 뼈대와 실측 기하 데이터를 바탕으로,
    각 아웃라인의 자식 엘리먼트(표/폼/목록)를 정밀하게 추출하고 트리에 바인딩합니다.
    """

    def __init__(
        self,
        agent: Optional[AntigravityAgent] = None,
        model: Optional[str] = None,
    ) -> None:
        self.agent = agent or (
            AntigravityAgent(model=model) if model else antigravity_agent
        )

    @property
    def name(self) -> str:
        return "enrich_elements"

    async def execute(self, ctx: DocumentPipelineContext) -> None:
        if not ctx.outlines:
            ctx.log(f"[{self.name}] 아웃라인 정보가 없어 엘리먼트 추출을 건너뜁니다.")
            return

        ctx.log(f"[{self.name}] 아웃라인 기반 엘리먼트 정밀 추출 시작 (모델: {self.agent.model})")

        # 1. 이전 단계에서 누적된 컨텍스트 요약
        outline_summary = self._build_outline_summary(ctx.outlines)
        geometry_summary = self._build_geometry_summary(ctx)

        prompt = self._build_prompt(ctx.file_path.name, outline_summary, geometry_summary)

        # 2. agy-cli 비동기 실행
        raw_json = await asyncio.to_thread(self.agent.run_json, prompt)
        if not raw_json:
            ctx.log(f"[{self.name}] LLM 응답 추출 실패 - 기본 엘리먼트 생성 건너뜀")
            return

        # 3. 파싱 및 아웃라인 노드 바인딩
        try:
            parsed = ElementsStepOutput.model_validate(raw_json)
            self._bind_elements_to_context(ctx, parsed.elements)
            ctx.log(f"[{self.name}] 엘리먼트 매핑 완료: 총 {len(ctx.flat_elements)}건")
        except Exception as exc:
            logger.warning("엘리먼트 스키마 검증 실패 (%s) - 관대 파싱 시도", exc)
            self._lenient_parse_and_bind(ctx, raw_json)

    def _build_outline_summary(self, nodes: List[OutlineNode]) -> str:
        lines: List[str] = []
        for n in nodes:
            lines.append(f"- ID: {n.id} | 제목: '{n.title}' | 페이지: {n.page} | 목적: {n.purpose}")
            for child in n.children:
                lines.append(f"  └ ID: {child.id} | 제목: '{child.title}' | 페이지: {child.page}")
        return "\n".join(lines)

    def _build_geometry_summary(self, ctx: DocumentPipelineContext) -> str:
        lines: List[str] = []
        if ctx.geometry_pages:
            for page in ctx.geometry_pages:
                p_num = getattr(page, "page_number", 1)
                lines.append(f"--- [페이지 {p_num}] ---")
                # 테이블 실측치가 있으면 기하 위치 표기
                tables = getattr(page, "tables", [])
                for t in tables:
                    lines.append(f"[실측 표 테이블] norm_bbox={t.norm_bbox}, col={t.col_count}, row={t.row_count}")
                # 텍스트 블록
                text_blocks = getattr(page, "text_blocks", [])
                for b in text_blocks[:30]:
                    text = b.get("text", "").replace("\n", " ").strip()
                    if text:
                        lines.append(f"[텍스트] bbox={b.get('bbox')} text='{text}'")
        return "\n".join(lines[:60])

    def _build_prompt(self, filename: str, outline_summary: str, geometry_summary: str) -> str:
        return (
            f"당신은 고정밀 문서 컴포넌트 분석 엔진입니다.\n"
            f"문서 '{filename}'의 기하 데이터와 앞서 정립된 [아웃라인 목차]를 바탕으로,\n"
            f"각 아웃라인에 소속된 세부 컴포넌트(Element)들을 정밀 추출하고 outline_id로 연결하세요.\n\n"
            f"[기존 추출된 아웃라인 목록]\n"
            f"{outline_summary}\n\n"
            f"[실측 기하 데이터]\n"
            f"{geometry_summary}\n\n"
            f"지침:\n"
            f"1. 추출할 엘리먼트 타입:\n"
            f"   - 'table': 표/데이터 테이블\n"
            f"   - 'form_field': 인적사항, 일시/장소, 서명란 등 Key-Value 입력칸\n"
            f"   - 'list': 개조식 글머리 기호 목록\n"
            f"   - 'paragraph': 서술형 핵심 문단\n"
            f"   - 'media': 영수증/증빙/도장 첨부 영역\n"
            f"2. 각 엘리먼트가 어떤 아웃라인에 속하는지 반드시 정확한 'outline_id'(예: out-1)를 지정하세요.\n"
            f"3. box_2d는 [ymin, xmin, ymax, xmax] 0~1000 상대 좌표로 지정하세요.\n\n"
            f"반드시 다음 JSON 형식으로만 응답하세요:\n"
            f"{{\n"
            f'  "elements": [\n'
            f'    {{\n'
            f'      "id": "elem-1",\n'
            f'      "outline_id": "out-1",\n'
            f'      "type": "table",\n'
            f'      "label": "회의 기본정보 및 지출 내역 표",\n'
            f'      "page": 1,\n'
            f'      "box_2d": [121, 122, 520, 878],\n'
            f'      "content_summary": "일시, 장소, 참석자, 안건, 지출금액(₩40,000)",\n'
            f'      "structured_data": {{"category": "meeting_expense", "total_amount": 40000}}\n'
            f'    }}\n'
            f'  ]\n'
            f"}}\n"
        )

    def _bind_elements_to_context(
        self, ctx: DocumentPipelineContext, raw_elements: List[RawElementOutput]
    ) -> None:
        # 아웃라인 ID 룩업 맵 생성
        node_map: Dict[str, OutlineNode] = {}

        def register(nodes: List[OutlineNode]) -> None:
            for n in nodes:
                node_map[n.id] = n
                register(n.children)

        register(ctx.outlines)

        converted_elements: List[ElementItem] = []
        for raw in raw_elements:
            elem = ElementItem(
                id=raw.id,
                outline_id=raw.outline_id,
                type=raw.type,
                label=raw.label,
                page=raw.page,
                box_2d=raw.box_2d,
                content_summary=raw.content_summary,
                structured_data=raw.structured_data,
            )
            converted_elements.append(elem)

            # 아웃라인 노드에 자식으로 매핑
            if raw.outline_id in node_map:
                node_map[raw.outline_id].elements.append(elem)
            elif ctx.outlines:
                # 룩업 실패 시 첫 번째 아웃라인에 폴백 매핑
                ctx.outlines[0].elements.append(elem)

        ctx.flat_elements = converted_elements

    def _lenient_parse_and_bind(
        self, ctx: DocumentPipelineContext, raw_json: Dict[str, Any]
    ) -> None:
        elems_data = raw_json.get("elements") or []
        raw_list: List[RawElementOutput] = []
        for idx, item in enumerate(elems_data):
            if isinstance(item, dict):
                raw_list.append(
                    RawElementOutput(
                        id=item.get("id") or f"elem-{idx+1}",
                        outline_id=item.get("outline_id")
                        or (ctx.outlines[0].id if ctx.outlines else "out-1"),
                        type=item.get("type") or "section",
                        label=item.get("label") or f"항목 {idx+1}",
                        page=item.get("page", 1),
                        box_2d=item.get("box_2d") or [100, 100, 300, 300],
                        content_summary=item.get("content_summary"),
                        structured_data=item.get("structured_data"),
                    )
                )
        self._bind_elements_to_context(ctx, raw_list)
