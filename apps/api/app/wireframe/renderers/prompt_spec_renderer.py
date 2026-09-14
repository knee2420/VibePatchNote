"""슬롯 명세 마크다운 문서 렌더러."""
import re
from typing import List

from scaffold_engine.wireframe import SlotMappingItem

_BACKTICK_RUN = re.compile(r"`+")


def _fence_for(content: str) -> str:
    """본문에 포함된 백틱 런보다 긴 코드펜스를 만든다."""
    longest = max((len(m) for m in _BACKTICK_RUN.findall(content)), default=0)
    return "`" * max(3, longest + 1)


class PromptSpecRenderer:
    """에이전트/LLM이 해석하기 쉬운 슬롯 명세 마크다운 문서 렌더러 (순수 서식 표현)."""

    @staticmethod
    def render(
        title: str,
        source_name: str,
        slots: List[SlotMappingItem],
        markdown_content: str,
        created_at: str,
    ) -> str:
        lines = [
            f"# {title} — 서식 명세서",
            "",
            f"- **원본 문서**: `{source_name}`",
            f"- **추출 일시**: {created_at}",
            f"- **총 슬롯 수**: {len(slots)}개",
            "",
            "## 📌 입력 슬롯 목록 및 가이드",
            "| 번호 | 슬롯 ID | 라벨(항목명) | 정규화 좌표 [ymin, xmin, ymax, xmax] |",
            "|:---:|:---:|:---|:---|",
        ]
        for slot in slots:
            box_str = f"[{', '.join(str(c) for c in slot.box_2d)}]"
            lines.append(f"| {slot.number} | `{slot.id}` | **{slot.label}** | `{box_str}` |")

        fence = _fence_for(markdown_content)
        lines.extend([
            "",
            "## 📄 원문 구조 마크다운 (참고용)",
            f"{fence}markdown",
            markdown_content.strip(),
            fence,
            "",
        ])
        return "\n".join(lines)

    # 하위 호환 별칭
    format = render
