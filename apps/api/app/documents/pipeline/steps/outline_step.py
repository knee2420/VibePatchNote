"""Step 1: 문서 대주제/목차(아웃라인) 계층 추출 단계 (LLM).

Co-location 원칙:
프롬프트 템플릿, 출력 스키마, agy-cli 호출 로직이 이 파일 한 곳에 응집됩니다.
"""
import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.core.antigravity import AntigravityAgent, antigravity_agent
from app.documents.pipeline.context import DocumentPipelineContext, OutlineNode
from app.documents.pipeline.steps.base import PipelineStep

logger = logging.getLogger(__name__)


# --- 1. Step 전용 입출력 스키마 ---

class RawOutlineItem(BaseModel):
    id: str = Field(..., description="out-1, out-2 등")
    level: int = Field(1, description="1: 대제목/장, 2: 소제목/절, 3: 세부항목")
    title: str = Field(..., description="섹션 제목")
    page: int = Field(1, description="페이지 번호 (1-based)")
    box_2d: Optional[List[int]] = Field(
        None, description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    purpose: Optional[str] = Field(None, description="해당 섹션의 비즈니스/도메인 목적")
    children: List["RawOutlineItem"] = Field(default_factory=list)


RawOutlineItem.model_rebuild()


class OutlineStepOutput(BaseModel):
    document_title: str
    total_pages: int
    outlines: List[RawOutlineItem]


# --- 2. Step 구현 ---

class ExtractOutlineStep(PipelineStep):
    """
    1단계: PyMuPDF 실측 텍스트와 폰트 크기/위치를 기반으로
    문서의 큰 뼈대(Outline Tree: 목차, 장/절, 핵심 안건)를 먼저 추출합니다.
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
        return "extract_outline"

    async def execute(self, ctx: DocumentPipelineContext) -> None:
        ctx.log(f"[{self.name}] 아웃라인(목차) 계층 분석 시작 (모델: {self.agent.model})")

        # 실측된 텍스트 블록 요약본 구성
        text_context = self._build_geometry_summary(ctx)

        prompt = self._build_prompt(ctx.file_path.name, text_context)

        # agy-cli 비동기 실행
        raw_json = await asyncio.to_thread(self.agent.run_json, prompt)
        if not raw_json:
            ctx.log(f"[{self.name}] LLM 응답 추출 실패 - 기본 폴백 아웃라인 생성")
            self._apply_fallback_outline(ctx)
            return

        try:
            parsed = OutlineStepOutput.model_validate(raw_json)
            # RawOutlineItem -> OutlineNode 변환
            ctx.outlines = self._convert_to_nodes(parsed.outlines)
            ctx.markdown_outline = self._generate_markdown_outline(ctx.outlines)
            ctx.log(f"[{self.name}] 아웃라인 추출 성공: 루트 항목 {len(ctx.outlines)}건")
        except Exception as exc:
            logger.warning("아웃라인 스키마 검증 실패 (%s) - 관대 파싱 시도", exc)
            self._lenient_parse(ctx, raw_json)

    def _build_geometry_summary(self, ctx: DocumentPipelineContext) -> str:
        """PyMuPDF 실측치로부터 각 페이지의 주요 텍스트 블록/폰트 정보를 간결하게 압축합니다."""
        lines: List[str] = []

        if ctx.geometry_pages:
            for page in ctx.geometry_pages:
                p_num = getattr(page, "page_number", 1)
                lines.append(f"--- [페이지 {p_num}] ---")
                text_blocks = getattr(page, "text_blocks", [])
                for b in text_blocks[:25]:  # 상위 25개 주요 블록
                    text = b.get("text", "").replace("\n", " ").strip()
                    if text:
                        bbox = b.get("bbox", [])
                        font_size = b.get("size", "")
                        lines.append(f"- (폰트:{font_size}, 위치:{bbox}) {text}")
        elif "raw_text" in ctx.metadata:
            lines.append(ctx.metadata["raw_text"][:3000])

        return "\n".join(lines)

    def _build_prompt(self, filename: str, text_context: str) -> str:
        return (
            f"당신은 고정밀 문서 구조화 전문가입니다.\n"
            f"문서 '{filename}'의 목차 및 아웃라인(Outline) 뼈대를 계층적으로 추출하세요.\n\n"
            f"지침:\n"
            f"1. 세부 본문이나 표 내부 셀까지 다 뽑지 말고, **문서의 대주제(Level 1), 소주제/안건(Level 2)** 중심의 목차 뼈대를 구성하세요.\n"
            f"2. 각 항목의 페이지 번호(page, 1부터 시작)와 해당 구역의 상대 좌표 box_2d [ymin, xmin, ymax, xmax] (0~1000)를 추정하세요.\n"
            f"3. 각 섹션의 목적(purpose, 예: '기본 정보 및 회의비 지출 내역', '안건 논의 및 테스트 결과', '증빙자료 보관')을 한 줄로 기술하세요.\n\n"
            f"[문서 실측 텍스트 정보]\n"
            f"{text_context}\n\n"
            f"반드시 다음 JSON 규격으로만 응답하세요:\n"
            f"{{\n"
            f'  "document_title": "{filename}",\n'
            f'  "total_pages": 1,\n'
            f'  "outlines": [\n'
            f'    {{\n'
            f'      "id": "out-1",\n'
            f'      "level": 1,\n'
            f'      "title": "회의 기본정보 및 지출 내역",\n'
            f'      "page": 1,\n'
            f'      "box_2d": [80, 100, 520, 900],\n'
            f'      "purpose": "회의 일시, 장소 및 지출된 경비 내역 기록",\n'
            f'      "children": []\n'
            f'    }}\n'
            f'  ]\n'
            f"}}\n"
        )

    def _convert_to_nodes(self, raw_items: List[RawOutlineItem]) -> List[OutlineNode]:
        nodes: List[OutlineNode] = []
        for item in raw_items:
            node = OutlineNode(
                id=item.id,
                level=item.level,
                title=item.title,
                page=item.page,
                box_2d=item.box_2d,
                purpose=item.purpose,
                elements=[],
                children=self._convert_to_nodes(item.children),
            )
            nodes.append(node)
        return nodes

    def _generate_markdown_outline(self, nodes: List[OutlineNode], depth: int = 0) -> str:
        md_lines: List[str] = []
        for n in nodes:
            indent = "  " * depth
            p_info = f" (p.{n.page})" if n.page else ""
            purpose_info = f" - {n.purpose}" if n.purpose else ""
            md_lines.append(f"{indent}- **{n.title}**{p_info}{purpose_info}")
            if n.children:
                md_lines.append(self._generate_markdown_outline(n.children, depth + 1))
        return "\n".join(md_lines)

    def _apply_fallback_outline(self, ctx: DocumentPipelineContext) -> None:
        """분석 실패 시 기본 루트 아웃라인 노드 부여."""
        fallback_node = OutlineNode(
            id="out-root",
            level=1,
            title=ctx.filename,
            page=1,
            box_2d=[50, 50, 950, 950],
            purpose="문서 전체",
            elements=[],
            children=[],
        )
        ctx.outlines = [fallback_node]
        ctx.markdown_outline = f"- **{ctx.filename}** (p.1)"

    def _lenient_parse(self, ctx: DocumentPipelineContext, raw_json: Dict[str, Any]) -> None:
        outlines_data = raw_json.get("outlines") or []
        nodes: List[OutlineNode] = []
        for idx, item in enumerate(outlines_data):
            if isinstance(item, dict):
                nodes.append(
                    OutlineNode(
                        id=item.get("id") or f"out-{idx+1}",
                        level=item.get("level", 1),
                        title=item.get("title") or "제목 없음",
                        page=item.get("page", 1),
                        box_2d=item.get("box_2d"),
                        purpose=item.get("purpose"),
                        elements=[],
                        children=[],
                    )
                )
        if nodes:
            ctx.outlines = nodes
            ctx.markdown_outline = self._generate_markdown_outline(nodes)
            ctx.log(f"[{self.name}] 관대 파싱 완료: {len(nodes)}건")
        else:
            self._apply_fallback_outline(ctx)
