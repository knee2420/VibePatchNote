"""[06.staging/step1_outline] Step 1: 문서 대주제/목차(아웃라인) 계층 추출 단계.

운영 코드: apps/api/app/documents/pipeline/steps/outline_step.py 덤프본
목표: 문서의 계층 트리(Level 1, Level 2)와 항목별 목적(purpose)을 빠짐없이 고정밀로 추출.
"""
import asyncio
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# apps/api 및 packages/scaffold-engine 경로 바인딩
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))
sys.path.insert(0, str(REPO_ROOT / "packages" / "scaffold-engine"))

from app.core.antigravity import AntigravityAgent, antigravity_agent
from app.documents.pipeline.context import DocumentPipelineContext
from app.documents.pipeline.steps.base import PipelineStep
from scaffold_engine.outline import OutlineNode
from scaffold_engine.outline.prompt import build_outline_prompt

logger = logging.getLogger(__name__)


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


class ExtractOutlineStep(PipelineStep):
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
        import tempfile
        import subprocess
        import sys
        import fitz
        from pathlib import Path

        ctx.log(f"[{self.name}] 아웃라인(목차) 계층 분석 시작 (모델: {self.agent.model})")
        text_context = self._build_geometry_summary(ctx)
        prompt = self._build_prompt(ctx.file_path, text_context)

        raw_json = await asyncio.to_thread(self.agent.run_json, prompt)
        if not raw_json:
            ctx.log(f"[{self.name}] LLM 응답 추출 실패 - 기본 폴백 아웃라인 생성")
            self._apply_fallback_outline(ctx)
            return

        try:
            parsed = OutlineStepOutput.model_validate(raw_json)
            ctx.outlines = self._convert_to_nodes(parsed.outlines)
            ctx.markdown_outline = self._generate_markdown_outline(ctx.outlines)
            ctx.log(f"[{self.name}] 아웃라인 추출 성공: 루트 항목 {len(ctx.outlines)}건")
        except Exception as exc:
            logger.warning("아웃라인 스키마 검증 실패 (%s) - 관대 파싱 시도", exc)
            self._lenient_parse(ctx, raw_json)

    def _build_geometry_summary(self, ctx: DocumentPipelineContext) -> str:
        lines: List[str] = []
        if ctx.geometry_pages:
            for page in ctx.geometry_pages:
                p_num = getattr(page, "page_number", 1)
                lines.append(f"==================== [페이지 {p_num}] ====================")

                # 1. 기하 실측 표(Table) 구조 메타
                tables = getattr(page, "tables", [])
                if tables:
                    lines.append("[1. 실측된 표(Table) 구조 메타]")
                    for t_idx, t in enumerate(tables, 1):
                        norm_box = getattr(t, "norm_bbox", [])
                        cols = getattr(t, "col_count", 0)
                        rows = getattr(t, "row_count", 0)
                        lines.append(f"- 표 {t_idx}: 상대좌표={norm_box}, 규격: {cols}열 x {rows}행")
                    lines.append("")

                # 2. 주요 타이포그래피 블록 (폰트 크기 및 위치)
                text_blocks = getattr(page, "text_blocks", [])
                if text_blocks:
                    lines.append("[2. 주요 타이포그래피 블록 (폰트 크기 및 위치)]")
                    for b in text_blocks[:150]:
                        text = b.get("text", "").replace("\n", " ").strip()
                        if text:
                            norm_box = b.get("norm_bbox") or b.get("bbox", [])
                            font_size = b.get("size", "")
                            lines.append(f"- (폰트:{font_size}, 위치:{norm_box}) {text}")
                    lines.append("")

                # 3. 페이지 원문 텍스트 전문 (Raw Text Flow)
                raw_text = getattr(page, "raw_text", "")
                if raw_text and raw_text.strip():
                    lines.append("[3. 페이지 원문 텍스트 전문 (연속 텍스트 흐름)]")
                    lines.append(raw_text.strip())
                    lines.append("")
        elif "raw_text" in ctx.metadata:
            lines.append(ctx.metadata["raw_text"][:15000])
        return "\n".join(lines)

    def _build_prompt(self, file_path: Path, text_context: str) -> str:
        """[Step 1 튜닝 대상 프롬프트: 순수 항목명 분해 및 범용 계층 트리 추출]"""
        resolved_path = str(file_path.resolve())
        filename = file_path.name
        return f"""당신은 고정밀 비즈니스 문서 구조화 전문가입니다.

[분석 대상 원본 문서]
- 파일명: {filename}
- 원본 파일 경로: {resolved_path}

[중요 지침: 3중 멀티모달 컨텍스트 활용]
1. [시각적 비전 (PDF 직접 열람)]: 반드시 위 원본 파일 경로('{resolved_path}')의 문서를 직접 열람(view/inspect)하여, 전반적인 시각 레이아웃(여백, 밑줄, 박스 테두리, 심미적 위계)을 확인하세요.
2. [실측 표(Table) 구조 메타 & 타이포그래피]: 아래 제공된 각 페이지별 실측 표 규격(행x열, 위치)과 큰 폰트 크기 블록을 바탕으로 상위 대주제와 부모 표 구획의 경계를 파악하세요.
3. [원문 텍스트 전문 (Raw Text Flow)]: 좌표 숫자 노이즈 없이 연속된 문장 흐름이 보존된 깨끗한 원문 텍스트를 읽고, 항목명과 세부 라벨의 정확한 명칭을 오타나 누락 없이 파악하세요.

[인간의 인지적 문서 구조화 원칙 (Cognitive Outline Extraction Principles)]
당신은 사람이 문서를 처음 보았을 때 시각적 구조(Visual Gestalt)와 위계를 인지하는 방식 그대로 목차 트리를 구성해야 합니다.

1. [시각적 군집화 및 여백 인지 (Visual Gestalt & Proximity)]
   - 물리적으로 인접하거나 같은 테두리(Border), 배경색, 분할선 안에 묶인 텍스트 군집은 하나의 논리적 구획(Section)으로 인식하세요.
   - 문서 상단이나 하단에 명시적 타이틀 글자가 없더라도, 로고/발행처/문서번호/일자 등이 모여 있는 머리말 영역은 시각적 '문서 메타 헤더(Header Meta)' 구역으로, 서명/도장/제출처 등이 모여 있는 영역은 '제출 및 서명란' 구역으로 인지하여 상위 그룹으로 묶으세요.

2. [타이포그래피 및 위계 인지 (Typographic Hierarchy)]
   - 가장 크고 굵은 폰트(Title), 중앙 정렬, 밑줄이 그어진 최상위 텍스트는 Level 1 대주제로 분류하세요.
   - 번호 체계(1, 1.1, (1), ① 등)나 중간 크기 볼드체는 번호 깊이에 맞게 Level 2, Level 3으로 엄격히 계층화하세요.

3. [표(Table) 및 서식(Form)의 부모-자식 분해 (Full Granularity)]
   - 표 서식의 병합된 셀(Header Cell)이나 구획 라벨(예: 인적사항, 지출내역)은 상위 부모 목차로 삼으세요.
   - 표 내부의 세부 입력란(Form Field), 자식 라벨, 분할 셀들은 결코 요약하거나 생략하지 말고, 상위 구획 아래의 자식 목차로 끝까지 전수 분해하세요.

4. [원문 라벨 보존 및 데이터(Value) 분리 원칙]
   - 목차 제목(title)에는 문서에 인쇄된 **순수 라벨(항목명, 컬럼명)**만 기재하세요. (나쁜 예: '일시: 2026.09.07' ❌ -> 좋은 예: '일시' ⭕)
   - 문서에 표기된 단어를 임의의 유사어로 치환하지 말고 원문 그대로 표기하세요. (예: 문서에 '성명'이라 적혀 있으면 '이름'이 아니라 '성명' ⭕)

5. [다중 페이지 완전성 (Completeness)]
   - 여러 페이지에 걸친 문서의 경우, 첫 페이지만 분석하고 멈추지 말고 모든 페이지의 시각 구획을 누락 없이 끝까지 분석하세요.

[보편적 구조화 패턴 (Abstract Structural Patterns)]
- 그리드/테이블 서식: Level 1 [표 제목] -> Level 2 [주요 행 구획/항목 라벨] -> Level 3 [세부 입력란]
- 메타/명세서 서식: Level 1 [문서명] -> Level 2 [상단 메타 헤더], [발행/수신 정보], [상세 명세 테이블], [합계/결제], [하단 고객안내]
- 신청서/공문 서식: Level 1 [신청서 제목] -> Level 2 [기본 정보], [신청자 인적사항], [사업/과제 개요], [예산 명세], [제출문 및 서명]

[문서 실측 텍스트 정보]
{text_context}

반드시 아래 JSON 스키마 규격으로만 응답하세요:
{{
  "_reasoning": "문서는 3페이지짜리 공문서이며, 상단 신청서 표와 하단 예산 표로 구성됨. 신청서 표는 과제정보, 팀장 인적사항 구획으로 계층화하고, 그 안의 팀명, 지원유형 등의 폼 필드를 하위 목차로 세분화함.",
  "document_title": "{filename}",
  "total_pages": <실제 분석한 총 페이지 수>,
  "outlines": [
    {{
      "id": "out-1",
      "level": 1,
      "title": "<Level 1 대주제/헤더 라벨>",
      "page": 1,
      "box_2d": [70, 80, 200, 920],
      "purpose": "<섹션의 목적 및 요약>",
      "children": [
        {{
          "id": "out-1-1",
          "level": 2,
          "title": "<Level 2 하위 항목 라벨>",
          "page": 1,
          "box_2d": [110, 90, 160, 400],
          "purpose": "<항목 목적>",
          "children": []
        }}
      ]
    }}
  ]
}}
"""


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
        def parse_node(item_dict: Dict[str, Any], default_id: str) -> OutlineNode:
            raw_box = item_dict.get("box_2d")
            safe_box = None
            if isinstance(raw_box, list):
                try:
                    safe_box = [int(float(x)) for x in raw_box]
                except (ValueError, TypeError):
                    pass
            
            children = []
            for i, child_dict in enumerate(item_dict.get("children") or []):
                if isinstance(child_dict, dict):
                    children.append(parse_node(child_dict, f"{default_id}-{i+1}"))
            
            return OutlineNode(
                id=item_dict.get("id") or default_id,
                level=item_dict.get("level", 1),
                title=item_dict.get("title") or "제목 없음",
                page=item_dict.get("page", 1),
                box_2d=safe_box,
                purpose=item_dict.get("purpose"),
                elements=[],
                children=children,
            )

        outlines_data = raw_json.get("outlines") or []
        nodes: List[OutlineNode] = []
        for idx, item in enumerate(outlines_data):
            if isinstance(item, dict):
                nodes.append(parse_node(item, f"out-{idx+1}"))
                
        if nodes:
            ctx.outlines = nodes
            ctx.markdown_outline = self._generate_markdown_outline(nodes)
            ctx.log(f"[{self.name}] 관대 파싱 완료: {len(nodes)}건")
        else:
            self._apply_fallback_outline(ctx)
