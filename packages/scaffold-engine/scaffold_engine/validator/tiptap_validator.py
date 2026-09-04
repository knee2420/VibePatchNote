"""Tiptap DOM Validator & Auto-healer.

LLM이 생성한 HTML 과 Markdown 의 Tiptap 규약 준수 여부를 검증하고,
잘못된 태그나 슬롯을 자동으로 교정(Auto-healing)합니다.
"""
import re
from typing import Tuple, Dict, Any
from scaffold_engine.types import ScaffoldExtractResult, ScaffoldMeta


class TiptapValidator:
    """Tiptap 스캐폴딩 DOM 및 마크다운 유효성 검증기."""

    @classmethod
    def validate_and_heal(cls, raw_data: Dict[str, Any]) -> ScaffoldExtractResult:
        html = raw_data.get("htmlContent", "")
        markdown = raw_data.get("markdownContent", "")
        meta_dict = raw_data.get("meta", {})

        # 1. HTML 자가 교정
        html = cls._heal_html(html)

        # 2. Markdown 자가 교정
        markdown = cls._heal_markdown(markdown, html)

        # 3. 메타데이터 보정
        meta = ScaffoldMeta(
            id=meta_dict.get("id", "scaffold-auto"),
            title=meta_dict.get("title", "스캐폴딩 서식"),
            targetDoc=meta_dict.get("targetDoc", "general"),
            sourcePdfFileName=meta_dict.get("sourcePdfFileName", "unknown.pdf"),
            description=meta_dict.get("description", "추출된 와이어프레임"),
            difficulty=meta_dict.get("difficulty", "easy"),
        )

        return ScaffoldExtractResult(
            meta=meta,
            htmlContent=html,
            markdownContent=markdown,
        )

    @classmethod
    def _heal_html(cls, html: str) -> str:
        if not html:
            return ""

        # 마크다운 코드블록 감싸기 제거 (```html ... ```)
        cleaned = re.sub(r"^```html\s*", "", html, flags=re.MULTILINE)
        cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE).strip()

        # 슬롯 내부 텍스트 비우기 (data-placeholder 가 있는데 내용이 차 있는 경우 비우기)
        # 예: <span data-type="scaffold-slot" data-placeholder="X">내용</span> -> <span data-type="scaffold-slot" data-placeholder="X"></span>
        def empty_slot_content(match: re.Match) -> str:
            full_open = match.group(1)
            return f"{full_open}></span>"

        cleaned = re.sub(
            r'(<span[^>]*data-type=["\']scaffold-slot["\'][^>]*)>(.*?)</span>',
            empty_slot_content,
            cleaned,
            flags=re.DOTALL | re.IGNORECASE,
        )

        # column-group 에 인라인 그리드 보강
        def ensure_grid_style(match: re.Match) -> str:
            tag = match.group(0)
            if "display:" not in tag and "grid" not in tag:
                tag = tag.replace(
                    ">",
                    ' style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.25rem;">',
                )
            return tag

        cleaned = re.sub(
            r'<div[^>]*data-type=["\']column-group["\'][^>]*>',
            ensure_grid_style,
            cleaned,
            flags=re.IGNORECASE,
        )

        return cleaned

    @classmethod
    def _heal_markdown(cls, markdown: str, html: str) -> str:
        if not markdown:
            # 최소한의 대체 마크다운
            return ":::column-group\n:::column\n[ 스캐폴딩 추출 결과 ]\n:::\n:::"

        # 코드블록 감싸기 제거
        cleaned = re.sub(r"^```markdown\s*", "", markdown, flags=re.MULTILINE)
        cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE).strip()
        return cleaned
