"""Scaffold Prompt Builder.

PDF 시각 이미지와 텍스트 레이아웃 정보, DSL 문법 규칙, 슬롯 정책,
골든 Few-shot 레퍼런스를 조립하여 고정밀 에이전트 프롬프트를 생성합니다.
"""
import json
from pathlib import Path
from typing import List, Optional
from scaffold_engine.vision.pdf_renderer import PageLayoutInfo
from .grammar_guide import TIPTAP_GRAMMAR_GUIDE
from .slot_policy import SLOT_EXTRACTION_POLICY


class ScaffoldPromptBuilder:
    """고정밀 Tiptap 스캐폴딩 생성 프롬프트 빌더."""

    def __init__(self) -> None:
        self.few_shots_dir = Path(__file__).parent / "few_shots"

    def _load_few_shot(self, name: str) -> Optional[dict]:
        path = self.few_shots_dir / f"{name}.json"
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return None

    def build_scaffold_prompt(
        self,
        pdf_path: Path,
        page_layouts: List[PageLayoutInfo],
        doc_hint: str = "general",
    ) -> str:
        """PDF 및 레이아웃 메타데이터로부터 종합 프롬프트를 빌드합니다."""
        pdf_path = Path(pdf_path).resolve()
        filename_lower = pdf_path.name.lower()
        all_raw_text = " ".join([pl.raw_text.lower() for pl in page_layouts])

        # 1. 문서 유형에 따른 최적 Few-shot 자동 선택
        is_meeting = any(k in filename_lower or k in all_raw_text for k in ["회의", "minutes", "디딤돌", "보고서"])
        shot_name = "meeting_golden" if is_meeting else "invoice_golden"
        golden_example = self._load_few_shot(shot_name) or self._load_few_shot("invoice_golden")

        golden_block = ""
        if golden_example:
            golden_block = f"""
### [골든 레퍼런스 모범 사례 (Reference Few-shot: {shot_name})]
문서명: {golden_example.get('document_title')}
[슬롯 매핑 메타 샘플]:
{json.dumps(golden_example.get('slots', [])[:2], ensure_ascii=False, indent=2)}

[HTML 서식 구조 모범 예시]:
```html
{golden_example.get('htmlContent')}
```
""".strip()


        # 2. 물리적 기하 구조 및 공간 제약 (Geometry & Proportional Constraints) 요약
        geometry_constraints = []
        pages_summary = []

        for pl in page_layouts:
            # 2D 텍스트 블록 (최대 15개 핵심 앵커 샘플)
            blocks_preview = "\n".join(
                [f"  - [{b.get('norm_bbox', b['bbox'])}] {b['text'][:50]}" for b in pl.text_blocks[:15]]
            )
            pages_summary.append(
                f"Page {pl.page_number} (시각 이미지: {pl.image_path.resolve()}, 크기: {round(pl.width)}x{round(pl.height)}):\n"
                f"2D 텍스트 블록 위치 샘플 (0~1000 정규화):\n{blocks_preview}\n"
            )

            # 감지된 이미지/로고
            if pl.images:
                img_strs = [f"  - 로고/이미지 norm_bbox: {img.norm_bbox} (가로 {img.width}px x 세로 {img.height}px)" for img in pl.images]
                geometry_constraints.append(f"[Page {pl.page_number} 이미지 기하]\n" + "\n".join(img_strs))

            # 감지된 표 기하 및 상대 비율
            if pl.tables:
                tab_strs = []
                for t_i, tab in enumerate(pl.tables):
                    widths_str = ", ".join([f"{w}%" for w in tab.col_widths_pct])
                    tab_strs.append(
                        f"  - 표 {t_i+1}: {tab.row_count}행 x {tab.col_count}열 | 열 너비 비율: [{widths_str}]\n"
                        f"    -> 반드시 HTML에 <colgroup>을 적용하여 각 <col style=\"width: {tab.col_widths_pct[0]}%;\" /> 등으로 물리적 비율을 일치시키세요!"
                    )
                    for pr in tab.prominent_rows:
                        tab_strs.append(
                            f"    * 주요 대형 영역 (행 {pr['row_index']+1}, 점유율 {pr['height_pct']}%): min-height: {pr['estimated_min_height_px']}px 권장 (내용 힌트: {pr['content_hint']})"
                        )
                geometry_constraints.append(f"[Page {pl.page_number} 표 정밀 기하 비율]\n" + "\n".join(tab_strs))

        pages_str = "\n".join(pages_summary)
        geometry_str = "\n\n".join(geometry_constraints) if geometry_constraints else "감지된 별도 특수 기하 없음 (기본 그리드 추론 적용)"

        prompt = f"""당신은 최고 수준의 문서 레이아웃 분석 및 Tiptap 에디터 와이어프레임 설계 전문가입니다.
다음 원본 문서를 정밀 분석하여, '실제 내용은 싹 빠지고 틀(Layout + Scaffolding)만 남아있는' Tiptap 스캐폴딩 템플릿을 생성하세요.

[분석 대상 파일]: {pdf_path.name} (전체 경로: {pdf_path})
{pages_str}

### [추출된 물리적 기하 비율 및 공간 점유 제약 (Physical Geometry Constraints)]
{geometry_str}

{TIPTAP_GRAMMAR_GUIDE}

{SLOT_EXTRACTION_POLICY}

{golden_block}

### [출력 형식 지침]
반드시 다음 JSON 형식으로만 응답해야 하며, 최외곽 코드블록이나 불필요한 서술은 일체 제외하세요.
{{
  "document_title": "{pdf_path.name}",
  "meta": {{
    "id": "{pdf_path.stem.lower().replace(' ', '-')}",
    "title": "{pdf_path.stem} 정밀 와이어프레임 서식",
    "targetDoc": "{pdf_path.stem.lower()}",
    "sourcePdfFileName": "{pdf_path.name}",
    "description": "원본 문서의 공간 그리드와 1:1 일치하는 정밀 와이어프레임 틀",
    "difficulty": "easy"
  }},
  "slots": [
    {{
      "id": "slot-1",
      "number": 1,
      "label": "상호 / 로고명 (예: Atticus)",
      "box_2d": [83, 101, 154, 535],
      "pageNumber": 1
    }}
  ],
  "htmlContent": "<div data-type=\\"column-group\\" ...>...</div>",
  "markdownContent": ":::column-group\\n..."
}}
""".strip()

        return prompt

