"""[06.staging/step2_elements] Step 2: 아웃라인 기반 세부 엘리먼트 추출 및 매핑 단계.

운영 코드: apps/api/app/documents/pipeline/steps/elements_step.py 덤프본
목표: 각 아웃라인 노드에 귀속된 table, form_field, list, media 등의 컴포넌트를 정밀 추출하고 outline_id로 바인딩.
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
from scaffold_engine.outline import ElementItem, OutlineNode
from scaffold_engine.outline.prompt import build_elements_prompt

logger = logging.getLogger(__name__)


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
    value: Optional[str] = Field(None, description="추출된 원문 값")
    items: Optional[List[Any]] = Field(None, description="목록 항목 배열")
    content_summary: Optional[str] = Field(None, description="핵심 내용 요약")
    structured_data: Optional[Dict[str, Any]] = Field(
        default=None, description="표 컬럼/데이터, Key-Value 등 구조화 메타"
    )


class ElementsStepOutput(BaseModel):
    elements: List[RawElementOutput]


class EnrichElementsStep(PipelineStep):
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
        import tempfile
        import subprocess
        import sys
        import fitz
        from pathlib import Path

        if not ctx.outlines:
            ctx.log(f"[{self.name}] 경고: 아웃라인이 비어 있습니다. 빈 엘리먼트 반환.")
            return

        ctx.log(f"[{self.name}] 문서 세부 엘리먼트 분석 시작 (모델: {self.agent.model})")
        outline_summary = self._build_outline_summary(ctx.outlines)
        geometry_summary = self._build_geometry_summary(ctx)
        prompt = self._build_prompt(ctx.file_path, outline_summary, geometry_summary)

        raw_json = await asyncio.to_thread(self.agent.run_json, prompt)
        if not raw_json:
            ctx.log(f"[{self.name}] 엘리먼트 추출 실패 - 기본 엘리먼트 생성 건너뜀")
            return

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
                tables = getattr(page, "tables", [])
                for t in tables:
                    lines.append(f"[실측 표 테이블] norm_bbox={t.norm_bbox}, col={t.col_count}, row={t.row_count}")
                text_blocks = getattr(page, "text_blocks", [])
                # 누락 방지를 위해 페이지 당 최대 400개 블록까지 허용 (기존 30개 제한 해제)
                for b in text_blocks[:400]:
                    text = b.get("text", "").replace("\n", " ").strip()
                    if text:
                        lines.append(f"[텍스트] bbox={b.get('bbox')} text='{text}'")
        # 다중 페이지 분석을 위해 전체 라인 수 제한 완화 (기존 60라인 제한 해제)
        return "\n".join(lines[:800])

    def _build_prompt(self, file_path: Path, outline_summary: str, geometry_summary: str) -> str:
        """[Step 2 튜닝 대상 프롬프트: 범용 엘리먼트 원문 추출 및 바인딩]"""
        resolved_path = str(file_path.resolve())
        filename = file_path.name
        return f"""당신은 고정밀 문서 컴포넌트 분석 엔진입니다.

[분석 대상 원본 문서]
- 파일명: {filename}
- 원본 파일 경로: {resolved_path}

[중요 지침]
반드시 위 원본 파일 경로('{resolved_path}')의 문서를 직접 열람/검토하여 시각적 표 구조, 텍스트 배치, 서명란 등을 확인하고,
앞서 정립된 [아웃라인 목차] 및 [실측 기하 데이터]와 대조하여 각 아웃라인에 소속된 세부 컴포넌트(Element)들을 정밀 추출하고 outline_id로 연결하세요.

[기존 추출된 아웃라인 목록]
{outline_summary}

[실측 기하 데이터]
{geometry_summary}

[고급 엘리먼트 추출 가이드 (Best Practices)]
1. [Schema Anchoring] 아래 제공된 JSON 스키마 규격을 엄격히 준수하세요.
2. [Chain of Thought] JSON 최상단 `_reasoning` 필드에, 주어진 아웃라인 목록과 기하 데이터를 대조하여 어떤 데이터 조각들을 어느 outline_id에 매핑할지 분석 논리를 1~2줄로 작성하세요.
3. 추출할 엘리먼트 타입:
   - 'form_field' 또는 'key_value': 인적사항, 일시/장소, 서명란, 금액 등 명확한 라벨-값 쌍을 갖는 필드.
   - 'list': 개조식 글머리 기호 목록 (항목들을 items 배열로 필수 분리).
   - 'table': 데이터 표 전체 구조 (가급적 행렬을 items로 표현).
   - 'paragraph': 서술형 핵심 문단 본문.
   - 'media': 로고, 서명, 도장, 증빙 이미지 첨부 영역 등.
4. [밀도 및 그룹핑 지침] 목차(Outline)로 독립하지 못한 문서 내의 모든 자잘한 세부 데이터(Key-Value, 리스트 항목, 서술형 텍스트 등)는 반드시 가장 적합한 부모 'outline_id'에 소속된 Element로 묶어서 추출하세요. 다중 페이지 문서의 경우 각 페이지 하단의 텍스트까지 누락 없이 모두 스캔하세요.
5. [원문 보존 원칙 (Literal Extractive)]
   - 문서에 기재된 구체적인 숫자, 인명, 고유명사, 식별자, 날짜/시간, 금액 등은 임의로 요약·의역(Abstractive)하거나 추상화/일반화하지 마세요.
   - 나쁜 예: '홍길동 외 2명' 텍스트를 '팀원 전원'으로 추상화 ❌, '10,000 USD'를 '비용'으로 퉁치기 ❌
   - 좋은 예: 원문 그대로 '홍길동 외 2명' 추출 ⭕, '10,000 USD' 금액 단위까지 정확히 기재 ⭕
6. box_2d는 [ymin, xmin, ymax, xmax] 0~1000 상대 좌표 (반드시 소수점 없는 정수 배열)로 지정하세요.

[Few-Shot Examples (다중 도메인 매핑 예시)]
- 영수증(인보이스) Header: `brand_logo` 이미지, `Invoice Number`, `Invoice Date` 엘리먼트들을 모두 'Header Meta' 아웃라인에 바인딩.
- 공문(신청서) 표 내부: '팀장 성명', '연락처', '소속' 등의 독립적인 Key-Value 텍스트를 모두 '팀장 인적사항' 아웃라인에 바인딩.
- 회의록 리스트: '- 1차 안건\n- 2차 안건' 본문 텍스트를 type='list' 엘리먼트로 파싱하여 '안 건' 아웃라인에 바인딩.

반드시 다음 JSON 형식으로만 응답하세요:
{{
  "_reasoning": "기하 데이터 분석 결과, 상단 테이블의 이름/연락처는 팀장 인적사항(out-1-1)에 바인딩하고, 하단의 금액 데이터는 예산(out-2)에 key_value 형태로 바인딩함.",
  "elements": [
    {{
      "id": "elem-1",
      "outline_id": "out-1-1",
      "type": "key_value",
      "label": "일 시",
      "page": 1,
      "box_2d": [121, 122, 160, 878],
      "value": "2018.11.08",
      "content_summary": "2018.11.08"
    }}
  ]
}}
"""

    def _bind_elements_to_context(
        self, ctx: DocumentPipelineContext, raw_elements: List[RawElementOutput]
    ) -> None:
        node_map: Dict[str, OutlineNode] = {}

        def register(nodes: List[OutlineNode]) -> None:
            for n in nodes:
                node_map[n.id] = n
                if n.children:
                    register(n.children)

        register(ctx.outlines)

        for raw in raw_elements:
            s_data = raw.structured_data or {}
            if raw.value:
                s_data["value"] = raw.value
            if raw.items:
                s_data["items"] = raw.items
            c_summary = raw.value or raw.content_summary or (", ".join(raw.items) if raw.items else "")

            elem = ElementItem(
                id=raw.id,
                outline_id=raw.outline_id,
                type=raw.type,
                label=raw.label,
                page=raw.page,
                box_2d=raw.box_2d,
                content_summary=c_summary,
                structured_data=s_data,
            )
            ctx.flat_elements.append(elem)
            target_node = node_map.get(raw.outline_id)
            if target_node:
                target_node.elements.append(elem)
            else:
                if ctx.outlines:
                    ctx.outlines[0].elements.append(elem)

    def _lenient_parse_and_bind(
        self, ctx: DocumentPipelineContext, raw_json: Dict[str, Any]
    ) -> None:
        raw_list = raw_json.get("elements") or []
        recovered: List[RawElementOutput] = []
        for idx, item in enumerate(raw_list):
            if isinstance(item, dict):
                raw_box = item.get("box_2d") or [0, 0, 1000, 1000]
                safe_box = [0, 0, 1000, 1000]
                if isinstance(raw_box, list):
                    try:
                        safe_box = [int(float(x)) for x in raw_box]
                    except (ValueError, TypeError):
                        pass
                try:
                    recovered.append(
                        RawElementOutput(
                            id=item.get("id") or f"elem-{idx+1}",
                            outline_id=item.get("outline_id") or "out-1",
                            type=item.get("type") or "paragraph",
                            label=item.get("label") or "컴포넌트",
                            page=item.get("page", 1),
                            box_2d=safe_box,
                            content_summary=item.get("content_summary"),
                            structured_data=item.get("structured_data"),
                        )
                    )
                except Exception:
                    pass
        if recovered:
            self._bind_elements_to_context(ctx, recovered)
