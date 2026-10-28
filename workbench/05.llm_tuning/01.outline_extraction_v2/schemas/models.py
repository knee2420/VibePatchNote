"""[01.outline_extraction_v2] 통합 아웃라인 및 5대 컴포넌트 분류(Classify) 스키마 모델."""
import json
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class ElementItem(BaseModel):
    """아웃라인 섹션 내부에 속한 세부 컴포넌트 단위 및 실제 내용 값."""
    id: str = Field(..., description="elem-1 등 고유 식별자")
    type: Literal["key_value", "table", "list", "paragraph", "media"] = Field(
        ...,
        description="5대 컴포넌트 분류 유형: key_value(단일필드/값), table(표), list(목록), paragraph(본문서술), media(서명/사진/증빙)",
    )
    label: str = Field(..., description="항목명/라벨")
    value: Optional[Any] = Field(default=None, description="기입된 실제 값(문자열, 숫자, 딕셔너리, 테이블 데이터 등)")
    items: Optional[List[str]] = Field(default=None, description="list 타입인 경우 세부 불릿/항목 목록")
    page: int = Field(1, description="페이지 번호 (1-based)")


class OutlineItem(BaseModel):
    id: str = Field(..., description="out-1, out-1-1 등 고유 식별자")
    level: int = Field(1, description="계층 깊이: 1(대주제/문서표제), 2(소주제/섹션/표대구획), 3(세부항목/서식필드), 4(하위 세부필드)")
    title: str = Field(..., description="순수 항목명/서식 라벨")
    type: Literal["header", "key_value", "table", "list", "paragraph", "media"] = Field(
        default="key_value",
        description="컴포넌트 분류: header(상위 구획/헤더), key_value(단일필드/값), table(표), list(목록), paragraph(본문서술), media(서명/사진/증빙)",
    )
    page: int = Field(1, description="페이지 번호 (1부터 시작)")
    box_2d: Optional[List[int]] = Field(
        default=None, description="[ymin, xmin, ymax, xmax] 0~1000 상대 비율 좌표"
    )
    purpose: Optional[str] = Field(None, description="해당 섹션의 비즈니스/도메인 목적 및 역할 요약")
    elements: List[ElementItem] = Field(
        default_factory=list,
        description="해당 노드에 바인딩된 세부 내용 데이터 및 분류(type, label, value/items)",
    )
    children: List["OutlineItem"] = Field(default_factory=list, description="하위 자식 목차 항목 리스트")


OutlineItem.model_rebuild()


class OutlineOutput(BaseModel):
    document_title: str = Field(..., description="분석 대상 문서 파일명")
    total_pages: int = Field(1, description="실제 분석한 총 페이지 수")
    outlines: List[OutlineItem] = Field(
        default_factory=list,
        description="계층적 목차 트리 (L1~L4 아웃라인 및 5대 컴포넌트 요소 전수 바인딩)",
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
