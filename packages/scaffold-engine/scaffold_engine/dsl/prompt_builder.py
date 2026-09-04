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
        
        # 골든 샷 로드 (인보이스 유형이면 invoice_golden 로드)
        golden_example = self._load_few_shot("invoice_golden")
        golden_block = ""
        if golden_example:
            golden_block = f"""
### [골든 레퍼런스 모범 사례 (Reference Few-shot)]
문서명: {golden_example.get('document_title')}
설명: {golden_example.get('meta', {}).get('description')}
[HTML 결과물]:
```html
{golden_example.get('htmlContent')}
```

[Markdown 결과물]:
```markdown
{golden_example.get('markdownContent')}
```
""".strip()

        # 페이지별 이미지 및 텍스트 레이아웃 정보 조립
        pages_summary = []
        for pl in page_layouts:
            blocks_preview = "\n".join(
                [f"  - [{b['bbox']}] {b['text'][:60]}" for b in pl.text_blocks[:20]]
            )
            pages_summary.append(
                f"Page {pl.page_number} (시각 이미지: {pl.image_path.resolve()}):\n"
                f"2D 텍스트 블록 위치 샘플:\n{blocks_preview}\n"
            )
        pages_str = "\n".join(pages_summary)

        prompt = f"""당신은 최고 수준의 문서 레이아웃 분석 및 Tiptap 에디터 와이어프레임 설계 전문가입니다.
다음 원본 문서를 정밀 분석하여, '실제 내용은 싹 빠지고 틀(Layout + Scaffolding)만 남아있는' Tiptap 스캐폴딩 템플릿을 생성하세요.

[분석 대상 파일]: {pdf_path.name} (전체 경로: {pdf_path})
{pages_str}

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
  "htmlContent": "<div data-type=\\"column-group\\" ...>...</div>",
  "markdownContent": ":::column-group\\n..."
}}
""".strip()

        return prompt
