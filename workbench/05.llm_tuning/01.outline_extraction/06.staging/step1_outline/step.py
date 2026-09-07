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
                lines.append(f"--- [페이지 {p_num}] ---")
                text_blocks = getattr(page, "text_blocks", [])
                # 페이지 당 최대 300개의 블록까지 허용하여 누락 방지 (기존 35개 제한 해제)
                for b in text_blocks[:300]:
                    text = b.get("text", "").replace("\n", " ").strip()
                    if text:
                        bbox = b.get("bbox", [])
                        font_size = b.get("size", "")
                        lines.append(f"- (폰트:{font_size}, 위치:{bbox}) {text}")
        elif "raw_text" in ctx.metadata:
            lines.append(ctx.metadata["raw_text"][:10000])
        return "\n".join(lines)

    def _build_prompt(self, file_path: Path, text_context: str) -> str:
        """[Step 1 튜닝 대상 프롬프트: 순수 항목명 분해 및 범용 계층 트리 추출]"""
        resolved_path = str(file_path.resolve())
        filename = file_path.name
        return f"""당신은 고정밀 비즈니스 문서 구조화 전문가입니다.

[분석 대상 원본 문서]
- 파일명: {filename}
- 원본 파일 경로: {resolved_path}

[중요 지침]
반드시 위 원본 파일 경로('{resolved_path}')의 문서를 도구를 통해 직접 열람(view/inspect)하여, 실제 시각적 레이아웃(헤더/표/구획의 배치, 폰트 위계, 밑줄 여부 등)을 확인한 뒤 아래 텍스트 정보와 대조하여 목차(Outline Tree)와 세부 항목들을 계층적으로 빠짐없이 추출하세요.

[고급 추출 및 밀도 조절 가이드 (Best Practices)]
1. [Schema Anchoring] 아래 제공된 JSON 스키마 규격을 엄격히 준수하세요. 누락된 정보는 지어내지 마세요.
2. [Chain of Thought] JSON 최상단 `_reasoning` 필드에 문서의 전체 시각적 구조(어떤 표와 섹션이 있는지)를 먼저 분석하고, 목차(Outline)로 뽑아야 할 그룹과 하위 필드들을 분류하는 논리를 작성하세요.
3. [원문 라벨 보존 원칙 (Literal Labeling)]
   - 문서에 인쇄된 실제 라벨 텍스트를 임의로 유사어로 바꾸지 마세요. (나쁜 예: 문서에 '성명'이라고 표기되어 있는데 '이름'으로 변경 ❌ -> 반드시 '성명' 원문 표기 ⭕)
4. [목차 자격 요건 및 표 하위 셀 전수 분해 (Full Granularity)]
   - 공문서/신청서 양식의 경우 입력란(Form Field) 하나하나가 독립된 항목(목차) 자격을 갖습니다.
   - 상위 그룹핑: '팀명', '지원유형', '과제명'은 독립 그룹인 '기본 과제 정보' 아래에 Level 3 자식으로 묶으세요.
   - 복합 표(Table) 내부의 하위 병합 셀(예: '팀장' -> '소속' 내부의 '대학', '학과(부)', '학년', '학번')도 생략하거나 요약하지 말고 Level 4 자식 목차로 끝까지 전수 분해하세요.
   - 하단 '제출문 및 서명' 구역은 '제출문', '제출일', '제출자', '수신처' 등의 세부 구획을 자식으로 포함하세요.
5. [영수증/인보이스 특화]
   - 상단의 브랜드 로고, 발행일자, 인보이스 번호 구역은 반드시 'Header Meta'를 상위 Level 2 목차로 구성하세요.
6. [순수 항목명 유지 규칙]
   - 섹션 제목(title)에는 실제 데이터 값(Value)을 섞지 말고, 순수한 라벨(항목명, 컬럼명, 그룹명)만 기재하세요. (나쁜 예: '일시 (2024.11.08)' ❌ / 좋은 예: '일시' ⭕, 나쁜 예: '팀명: 딥드론' ❌ / 좋은 예: '팀명' ⭕)
7. 다중 페이지 문서의 경우, 각 페이지별 누락되는 영역이 없도록 모든 페이지(1~3페이지)를 끝까지 꼼꼼히 전수 분석하세요.

[Few-Shot Examples (다중 도메인 예시)]
- 회의록 양식: Level 1 '회의비 사용 내역' -> Level 2 '일 시', '장 소', '참석자', '안 건', '회의내용', '지출금액', '증빙자료'
- 영수증(인보이스) 양식: Level 1 'Invoice 000081709' -> Level 2 'Header Meta', 'Company info', 'Billing info', 'Description', 'Total (USD)', 'Contact support'
- 공문(참가신청서) 양식:
  * 1페이지: Level 1 '지원신청서' -> Level 2 '기본 과제 정보' (Level 3 '팀명', '지원유형', '과제명'), Level 2 '팀장' (Level 3 '성명', '연락처', '소속' -> Level 4 '대학', '학과(부)', '학년', '학번'), Level 2 '과제수행 기간', Level 2 '과제수행 계획 요약', Level 2 '지원요청금액', Level 2 '붙임 서류', Level 2 '제출문 및 서명'
  * 2~3페이지: Level 1 '활동계획서' -> Level 2 '1. 목표', '2. 팀원 명단 및 역할', '3. 월별 추진일정', '4. 소요 예산' 등 대소주제 전수 추출

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
