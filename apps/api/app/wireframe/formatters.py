"""wireframe 아티팩트 포맷터 (SRP: 문서 포맷팅 및 표현 생성 전담)."""
import re
from datetime import datetime, timezone
from typing import List, Optional

from scaffold_engine.wireframe import ScaffoldMeta, SlotMappingItem

from .schemas import (
    ASSET_HTML,
    ASSET_MARKDOWN,
    ASSET_PROMPT_SPEC,
    ASSET_RENDER_HTML,
    ASSET_SLOTS,
    ASSET_VISION_ORIGINAL,
    ASSET_VISION_OVERLAY,
    ASSET_VISION_RENDER,
    WireframeArchiveMeta,
    WireframeArchiveRecord,
)

# 에셋 라우트 프리픽스. main.py 의 include_router prefix 와 일치해야 한다.
_ASSET_ROUTE = "/api/v1/scaffolds"

_BACKTICK_RUN = re.compile(r"`+")


def _fence_for(content: str) -> str:
    """본문에 포함된 백틱 런보다 긴 코드펜스를 만든다."""
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


class ManifestFormatter:
    """WireframeArchiveRecord 를 기반으로 URL/절대경로를 입힌 메타데이터 조립기."""

    @staticmethod
    def to_record(
        scaffold_id: str,
        doc_id: str,
        meta: ScaffoldMeta,
        source_pdf_file_name: str,
        slots_count: int,
        page_number: int = 1,
        total_pages: int = 1,
        pages: Optional[List[int]] = None,
    ) -> WireframeArchiveRecord:
        now_iso = datetime.now(timezone.utc).isoformat()
        return WireframeArchiveRecord(
            scaffold_id=scaffold_id,
            doc_id=doc_id,
            title=meta.title,
            source_pdf_file_name=source_pdf_file_name,
            created_at=now_iso,
            slots_count=slots_count,
            difficulty=meta.difficulty,
            engine_scaffold_id=meta.id,
            target_doc=meta.target_doc,
            description=meta.description,
            page_number=page_number,
            total_pages=total_pages,
            pages=pages or [page_number],
        )

    @staticmethod
    def to_meta(
        record: WireframeArchiveRecord,
        archive_dir: str,
        has_render: bool = False,
        has_render_image: bool = False,
        base_url: Optional[str] = None,
    ) -> WireframeArchiveMeta:
        prefix = base_url.rstrip("/") if base_url else ""
        sid = record.scaffold_id
        route = f"{prefix}{_ASSET_ROUTE}/{sid}/assets"

        html_asset = ASSET_RENDER_HTML if has_render else ASSET_HTML
        render_img_url = f"{route}/{ASSET_VISION_RENDER}" if has_render_image else ""

        return WireframeArchiveMeta(
            scaffold_id=record.scaffold_id,
            doc_id=record.doc_id,
            title=record.title,
            source_pdf_file_name=record.source_pdf_file_name,
            created_at=record.created_at,
            slots_count=record.slots_count,
            difficulty=record.difficulty,
            engine_scaffold_id=record.engine_scaffold_id,
            target_doc=record.target_doc,
            description=record.description,
            page_number=record.page_number,
            total_pages=record.total_pages,
            pages=record.pages,
            revision=record.revision,
            updated_at=record.updated_at,
            overlay_image_url=f"{route}/{ASSET_VISION_OVERLAY}",
            original_image_url=f"{route}/{ASSET_VISION_ORIGINAL}",
            render_image_url=render_img_url,
            prompt_spec_url=f"{route}/{ASSET_PROMPT_SPEC}",
            html_url=f"{route}/{html_asset}",
            markdown_url=f"{route}/{ASSET_MARKDOWN}",
            slots_url=f"{route}/{ASSET_SLOTS}",
            archive_dir=archive_dir,
        )
