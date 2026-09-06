"""scaffolds 아티팩트 포맷터 (SRP: 문서 포맷팅 및 표현 생성 전담)."""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from app.core.config import settings
from .schemas import ScaffoldArchiveMeta


class PromptSpecFormatter:
    """에이전트/LLM이 해석하기 쉬운 슬롯 명세 마크다운 문서 빌더."""

    @staticmethod
    def format(
        title: str,
        source_name: str,
        slots: List[Dict[str, Any]],
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

        for i, s in enumerate(slots):
            num = s.get("number", i + 1)
            s_id = s.get("id", f"s{num}")
            label = s.get("label", "")
            box = s.get("box_2d", [])
            lines.append(f"| {num} | `{s_id}` | {label} | `{box}` |")

        lines.extend([
            "",
            "## 📝 와이어프레임 텍스트 뼈대 (Markdown)",
            "```markdown",
            markdown_content.strip(),
            "```",
            "",
        ])

        return "\n".join(lines)


class ManifestFormatter:
    """스캐폴드 매니페스트 메타데이터 및 에셋 URL 빌더."""

    @staticmethod
    def create_meta(
        scaffold_id: str,
        title: str,
        source_pdf_file_name: str,
        slots_count: int,
        difficulty: str,
        archive_dir: str,
        created_at: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> ScaffoldArchiveMeta:
        created_at_iso = created_at or datetime.now(timezone.utc).isoformat()
        public_url = (base_url or settings.public_base_url).rstrip("/")

        return ScaffoldArchiveMeta(
            scaffold_id=scaffold_id,
            title=title,
            source_pdf_file_name=source_pdf_file_name,
            created_at=created_at_iso,
            slots_count=slots_count,
            difficulty=difficulty,
            overlay_image_url=f"{public_url}/api/v1/scaffolds/{scaffold_id}/assets/vision/overlay_p1.png",
            original_image_url=f"{public_url}/api/v1/scaffolds/{scaffold_id}/assets/vision/original_p1.png",
            prompt_spec_url=f"{public_url}/api/v1/scaffolds/{scaffold_id}/assets/prompt_spec.md",
            html_url=f"{public_url}/api/v1/scaffolds/{scaffold_id}/assets/scaffold.html",
            slots_url=f"{public_url}/api/v1/scaffolds/{scaffold_id}/assets/slots.json",
            archive_dir=archive_dir,
        )
