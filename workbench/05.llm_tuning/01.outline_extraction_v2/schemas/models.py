"""[01.outline_extraction_v2] 스키마 모델 정의 및 CLI용 JSON Schema 생성기."""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class OutlineItem(BaseModel):
    id: str = Field(..., description="out-1, out-1-1 등 고유 식별자")
    level: int = Field(1, description="계층 깊이: 1(대주제/문서표제), 2(소주제/섹션/표대구획), 3(세부항목/서식필드), 4(하위 세부필드)")
    title: str = Field(..., description="순수 항목명/서식 라벨 (입력값 제외, 원문 표기 유지)")
    page: int = Field(1, description="페이지 번호 (1부터 시작)")
    box_2d: Optional[List[int]] = Field(
        default=None, description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    purpose: Optional[str] = Field(None, description="해당 섹션의 비즈니스/도메인 목적 및 역할 요약")
    children: List["OutlineItem"] = Field(default_factory=list, description="하위 자식 목차 항목 리스트")


OutlineItem.model_rebuild()


class OutlineOutput(BaseModel):
    document_title: str = Field(..., description="분석 대상 문서 파일명")
    total_pages: int = Field(1, description="실제 분석한 총 페이지 수")
    outlines: List[OutlineItem] = Field(
        default_factory=list,
        description="계층적 목차 트리 (한국형 서식 표의 L2, L3, L4 필드 라벨을 children에 남김없이 전수 분해)",
    )



def export_json_schema(target_path: Optional[Path] = None) -> Path:
    """CLI --json-schema 플래그 주입용 표준 JSON Schema 파일 내보내기."""
    if target_path is None:
        target_path = Path(__file__).resolve().parent / "outline_schema.json"
    schema = OutlineOutput.model_json_schema()
    target_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    return target_path


if __name__ == "__main__":
    out_p = export_json_schema()
    print(f"JSON Schema exported successfully: {out_p}")
