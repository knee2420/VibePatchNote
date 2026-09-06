import json
import re
from typing import Tuple, Dict, Any, List
from scaffold_engine.types import ScaffoldExtractResult, ScaffoldMeta, SlotMappingItem


class TiptapValidator:
    """Tiptap 스캐폴딩 DOM 및 마크다운 유효성 검증기."""

    @classmethod
    def validate_and_heal(cls, raw_data: Dict[str, Any]) -> ScaffoldExtractResult:
        html = raw_data.get("htmlContent", "")
        markdown = raw_data.get("markdownContent", "")
        meta_dict = raw_data.get("meta", {})
        raw_slots = raw_data.get("slots", [])

        # 1. HTML 자가 교정
        html = cls._heal_html(html)

        # 2. Markdown 자가 교정
        markdown = cls._heal_markdown(markdown, html)

        # 3. 슬롯 매핑 정보 파싱 및 자동 복구 (HTML 내 data-bbox 기반)
        slots = cls._heal_slots(raw_slots, html)

        # 4. 메타데이터 보정
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
            slots=slots,
        )

    @classmethod
    def _heal_slots(cls, raw_slots: List[Dict[str, Any]], html: str) -> List[SlotMappingItem]:
        """슬롯 매핑 목록을 검증하고, 누락된 경우 HTML 속성으로부터 복원합니다."""
        results: List[SlotMappingItem] = []

        # 1. raw_slots 가 유효한 경우 먼저 검증
        if raw_slots:
            for s in raw_slots:
                try:
                    box = s.get("box_2d", [0, 0, 0, 0])
                    if len(box) == 4:
                        results.append(
                            SlotMappingItem(
                                id=str(s.get("id", f"slot-{len(results)+1}")),
                                number=int(s.get("number", len(results) + 1)),
                                label=str(s.get("label", "입력 슬롯")),
                                box_2d=[int(v) for v in box],
                                pageNumber=int(s.get("pageNumber", 1)),
                            )
                        )
                except Exception:
                    pass

        # 2. 결과가 비어 있다면 HTML 태그의 data-bbox 속성으로부터 파싱
        if not results and html:
            slot_tags = re.findall(r'<span[^>]*data-type=["\']scaffold-slot["\'][^>]*>', html, re.IGNORECASE)
            for idx, tag in enumerate(slot_tags):
                num_m = re.search(r'data-mapping-num=["\'](\d+)["\']', tag)
                bbox_m = re.search(r'data-bbox=["\']\[(.*?)\]["\']', tag)
                ph_m = re.search(r'data-placeholder=["\'](.*?)["\']', tag)

                mapping_num = int(num_m.group(1)) if num_m else idx + 1
                label = ph_m.group(1) if ph_m else f"슬롯 #{mapping_num}"

                box_2d = [0, 0, 0, 0]
                if bbox_m:
                    try:
                        coords = [int(v.strip()) for v in bbox_m.group(1).split(",")]
                        if len(coords) == 4:
                            box_2d = coords
                    except Exception:
                        pass

                results.append(
                    SlotMappingItem(
                        id=f"slot-{mapping_num}",
                        number=mapping_num,
                        label=label,
                        box_2d=box_2d,
                        pageNumber=1,
                    )
                )

        return results

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

        # table 태그에 table-layout: fixed 및 width: 100% 보강 (비율 유지 핵심)
        def ensure_table_style(match: re.Match) -> str:
            tag = match.group(0)
            if "table-layout:" not in tag:
                if 'style="' in tag:
                    tag = tag.replace('style="', 'style="table-layout: fixed; width: 100%; ')
                else:
                    tag = tag.replace(">", ' style="table-layout: fixed; width: 100%; border-collapse: collapse;">')
            return tag

        cleaned = re.sub(r'<table[^>]*>', ensure_table_style, cleaned, flags=re.IGNORECASE)

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
