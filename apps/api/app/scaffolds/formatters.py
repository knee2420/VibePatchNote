"""scaffolds 아티팩트 포맷터 (SRP: 문서 포맷팅 및 표현 생성 전담)."""
import re
from datetime import datetime, timezone
from typing import List, Optional

from scaffold_engine.types import ScaffoldMeta, SlotMappingItem

from app.core.config import settings

from .schemas import (
    ASSET_HTML,
    ASSET_MARKDOWN,
    ASSET_PROMPT_SPEC,
    ASSET_RENDER_HTML,
    ASSET_SLOTS,
    ASSET_VISION_ORIGINAL,
    ASSET_VISION_OVERLAY,
    ASSET_VISION_RENDER,
    ScaffoldArchiveMeta,
    ScaffoldArchiveRecord,
)

# 에셋 라우트 프리픽스. main.py 의 include_router prefix 와 일치해야 한다.
_ASSET_ROUTE = "/api/v1/scaffolds"

_BACKTICK_RUN = re.compile(r"`+")


def _fence_for(content: str) -> str:
    """본문에 포함된 백틱 런보다 긴 코드펜스를 만든다.

    마크다운 원문에 ```(펜스)가 들어 있으면 3중 펜스로 감쌌을 때 문서가 조기
    종료되어 명세서가 깨진다. 실제로 표/코드 예시가 든 서식에서 발생한다.
    """
    longest = max((len(m) for m in _BACKTICK_RUN.findall(content)), default=0)
    return "`" * max(3, longest + 1)


class PromptSpecFormatter:
    """에이전트/LLM이 해석하기 쉬운 슬롯 명세 마크다운 문서 빌더."""

    @staticmethod
    def format(
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

        for i, slot in enumerate(slots):
            number = slot.number or (i + 1)
            lines.append(f"| {number} | `{slot.id}` | {slot.label} | `{slot.box_2d}` |")

        body = markdown_content.strip()
        fence = _fence_for(body)
        lines.extend([
            "",
            "## 📝 와이어프레임 텍스트 뼈대 (Markdown)",
            "",
            f"> 원문은 `{ASSET_MARKDOWN}` 에 그대로 보관되어 있다. 아래는 그 사본이다.",
            "",
            f"{fence}markdown",
            body,
            fence,
            "",
        ])

        return "\n".join(lines)


class ManifestFormatter:
    """스캐폴드 매니페스트 레코드 및 에셋 URL 빌더."""

    @staticmethod
    def create_record(
        scaffold_id: str,
        engine_meta: ScaffoldMeta,
        title: str,
        source_pdf_file_name: str,
        slots_count: int,
        doc_id: str = "",
        page_number: int = 1,
        created_at: Optional[str] = None,
    ) -> ScaffoldArchiveRecord:
        """디스크에 기록할 환경 비종속 코어 레코드를 만든다."""
        return ScaffoldArchiveRecord(
            scaffold_id=scaffold_id,
            doc_id=doc_id,
            title=title,
            source_pdf_file_name=source_pdf_file_name,
            created_at=created_at or datetime.now(timezone.utc).isoformat(),
            slots_count=slots_count,
            difficulty=engine_meta.difficulty,
            engine_scaffold_id=engine_meta.id,
            target_doc=engine_meta.target_doc,
            description=engine_meta.description,
            page_number=page_number,
        )

    @staticmethod
    def to_meta(
        record: ScaffoldArchiveRecord,
        archive_dir: str,
        has_render_image: bool = False,
        base_url: Optional[str] = None,
    ) -> ScaffoldArchiveMeta:
        """코어 레코드에 현재 실행 환경 기준 URL/경로를 입혀 응답 메타로 변환."""
        public_url = (base_url or settings.public_base_url).rstrip("/")

        def asset(rel_path: str) -> str:
            return f"{public_url}{_ASSET_ROUTE}/{record.scaffold_id}/assets/{rel_path}"

        return ScaffoldArchiveMeta(
            **record.model_dump(),
            overlay_image_url=asset(ASSET_VISION_OVERLAY),
            original_image_url=asset(ASSET_VISION_ORIGINAL),
            prompt_spec_url=asset(ASSET_PROMPT_SPEC),
            html_url=asset(ASSET_HTML),
            markdown_url=asset(ASSET_MARKDOWN),
            render_url=asset(ASSET_RENDER_HTML),
            render_image_url=asset(ASSET_VISION_RENDER),
            has_render_image=has_render_image,
            slots_url=asset(ASSET_SLOTS),
            archive_dir=archive_dir,
        )
