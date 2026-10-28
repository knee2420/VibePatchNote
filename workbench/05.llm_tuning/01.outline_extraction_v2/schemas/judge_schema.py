"""[01.outline_extraction_v2] LLM Judge 채점 스키마 및 프롬프트."""
import json
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel, Field


class LLMJudgeResult(BaseModel):
    cognitive_score: int = Field(..., description="인간 인지 만족도 종합 점수 (1~100)")
    verdict: str = Field(..., description="종합 판정 ('EXCELLENT', 'ACCEPTABLE', 'NEEDS_IMPROVEMENT')")
    core_coverage_pct: float = Field(..., description="인간이 기대하는 핵심 랜드마크 구획 커버리지 비율 (0.0 ~ 100.0)")
    rationale: str = Field(..., description="인간 관점에서의 간결한 채점 총평")
    well_captured_blocks: List[str] = Field(default_factory=list, description="합리적으로 잘 짚어낸 주요 구획 목록")
    critical_omissions: List[str] = Field(default_factory=list, description="사람이 보기에 아쉬운 치명적 누락 구획 목록")


def export_judge_json_schema(target_path: Optional[Path] = None) -> Path:
    if target_path is None:
        target_path = Path(__file__).resolve().parent / "judge_schema.json"
    schema = LLMJudgeResult.model_json_schema()
    target_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")
    return target_path


if __name__ == "__main__":
    p = export_judge_json_schema()
    print(f"Judge schema exported: {p}")
