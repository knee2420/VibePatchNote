"""[06.staging] Step 1 + Step 2 통합 파이프라인 러너 및 종합 채점기.

step1_outline과 step2_elements를 순차적으로 통과시키고
05.evaluations/evaluate.py를 통해 종합 점수(Composite Score)를 산출합니다.
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

# 저장소 루트 동적 탐색 (apps 디렉터리 기준)
curr = Path(__file__).resolve()
REPO_ROOT = next(p for p in curr.parents if (p / "apps").exists())
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))
sys.path.insert(0, str(REPO_ROOT / "packages" / "scaffold-engine"))

from app.core.antigravity import AntigravityAgent
from app.documents.pipeline.context import DocumentPipelineContext, OutlineNode
from app.documents.pipeline.steps.geometry_step import ExtractGeometryStep

# Step별 모듈 임포트
CURRENT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(CURRENT_DIR / "step1_outline"))
sys.path.insert(0, str(CURRENT_DIR / "step2_elements"))

from step1_outline.step import ExtractOutlineStep
from step2_elements.step import EnrichElementsStep

# 평가기 임포트
EVAL_DIR = REPO_ROOT / "workbench" / "05.llm_tuning" / "01.outline_extraction" / "05.evaluations"
sys.path.insert(0, str(EVAL_DIR))
from evaluate import run_evaluation


async def run_staging_pipeline(doc_name: str = "11월_디딤돌_회의록", model: str = "gemini-3.8-flash-low"):
    print("\n" + "=" * 72)
    print(f"[*] Starting 06.staging End-to-End Pipeline: {doc_name} (Model: {model})")
    print("=" * 72)

    tuning_dir = REPO_ROOT / "workbench" / "05.llm_tuning" / "01.outline_extraction"
    pdf_path = tuning_dir / "01.dataset" / "raw" / f"{doc_name}.pdf"
    if not pdf_path.exists():
        pdf_path = REPO_ROOT / "apps" / "api" / "storage" / "documents" / doc_name / f"{doc_name}.pdf"

    if not pdf_path.exists():
        print(f"[!] PDF not found: {pdf_path}")
        return

    # 1. Step 0: 기하 정보 추출
    ctx = DocumentPipelineContext(file_path=pdf_path, filename=pdf_path.name)
    geo_step = ExtractGeometryStep()
    await geo_step.execute(ctx)
    print(f"[*] [Step 0 Geometry] 완료 ({len(ctx.geometry_pages)} 페이지)")

    # 2. Step 1: 아웃라인 추출
    agent = AntigravityAgent(model=model, timeout_seconds=90)
    step1 = ExtractOutlineStep(agent=agent)
    await step1.execute(ctx)
    print(f"[*] [Step 1 Outline] 완료 (루트 {len(ctx.outlines)}개)")

    # 3. Step 2: 엘리먼트 추출 및 바인딩
    step2 = EnrichElementsStep(agent=agent)
    await step2.execute(ctx)
    print(f"[*] [Step 2 Elements] 완료 (총 {len(ctx.flat_elements)}개 바인딩)")

    # 4. 결과 직렬화
    out_file = CURRENT_DIR / f"staging_output_{doc_name}.json"
    dump_data = {
        "document_title": f"{doc_name}.pdf",
        "total_pages": len(ctx.geometry_pages),
        "outlines": [n.model_dump(by_alias=True) for n in ctx.outlines],
        "elements": [e.model_dump(by_alias=True) for e in ctx.flat_elements],
    }
    out_file.write_text(json.dumps(dump_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[*] Staging 전체 산출물 저장: {out_file.name}")

    # 5. 종합 F1 평가
    print("\n[*] Running End-to-End Evaluation...")
    report = run_evaluation(doc_name=doc_name, pred_path=out_file, print_report=True)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="06.staging End-to-End Runner")
    parser.add_argument("--doc", default="11월_디딤돌_회의록", help="문서 이름")
    parser.add_argument("--model", default="gemini-3.8-flash-low", help="사용할 모델명")
    args = parser.parse_args()

    asyncio.run(run_staging_pipeline(doc_name=args.doc, model=args.model))
