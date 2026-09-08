"""[06.staging/step1_outline] Step 1 아웃라인 추출기 단독 실행 및 Outline F1 즉시 채점기."""
import argparse
import asyncio
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# 저장소 루트 동적 탐색 (apps 디렉터리 기준)
curr = Path(__file__).resolve()
REPO_ROOT = next(p for p in curr.parents if (p / "apps").exists())
sys.path.insert(0, str(REPO_ROOT / "apps" / "api"))
sys.path.insert(0, str(REPO_ROOT / "packages" / "scaffold-engine"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.antigravity import AntigravityAgent
from app.documents.pipeline.context import DocumentPipelineContext
from app.documents.pipeline.steps.geometry_step import ExtractGeometryStep

from step import ExtractOutlineStep

# 평가기 임포트
EVAL_DIR = REPO_ROOT / "workbench" / "05.llm_tuning" / "01.outline_extraction" / "05.evaluations"
sys.path.insert(0, str(EVAL_DIR))
from evaluate import flatten_outline_tree, evaluate_outlines


async def run_step1_isolated(doc_name: str = "11월_디딤돌_회의록", model: str = "gemini-3.8-flash-low"):
    print("\n" + "=" * 72)
    print(f"  [06.staging] Step 1 (Outline Extraction) 단독 테스트: {doc_name}")
    print(f"  Model: {model}")
    print("=" * 72)

    tuning_dir = REPO_ROOT / "workbench" / "05.llm_tuning" / "01.outline_extraction"
    pdf_path = tuning_dir / "01.dataset" / "raw" / f"{doc_name}.pdf"
    if not pdf_path.exists():
        pdf_path = REPO_ROOT / "apps" / "api" / "storage" / "documents" / doc_name / f"{doc_name}.pdf"

    if not pdf_path.exists():
        print(f"[!] PDF not found: {pdf_path}")
        return

    # 1. 기하 데이터 추출
    ctx = DocumentPipelineContext(file_path=pdf_path, filename=pdf_path.name)
    geo_step = ExtractGeometryStep()
    await geo_step.execute(ctx)

    # 2. Step 1 실행
    agent = AntigravityAgent(model=model, timeout_seconds=90)
    step = ExtractOutlineStep(agent=agent)
    await step.execute(ctx)

    # 3. Step 1 결과 저장
    out_dir = Path(__file__).parent
    out_file = out_dir / f"output_{doc_name}.json"
    pred_data = {
        "document_title": f"{doc_name}.pdf",
        "total_pages": len(ctx.geometry_pages),
        "outlines": [n.model_dump(by_alias=True) for n in ctx.outlines],
    }
    out_file.write_text(json.dumps(pred_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[*] Step 1 결과 저장: {out_file.name}")

    # 4. 정답셋과 비교하여 Outline Hierarchy F1 채점
    gt_file = tuning_dir / "02.ground_truth" / doc_name / "expected_outlines.json"
    if not gt_file.exists():
        print(f"[!] Ground Truth file missing: {gt_file}")
        return

    with open(gt_file, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    gt_flat = flatten_outline_tree(gt_data.get("outlines", []))
    pred_flat = flatten_outline_tree(pred_data.get("outlines", []))

    eval_res = evaluate_outlines(gt_flat, pred_flat)

    print("-" * 72)
    print(f"  [Step 1 단독 채점 결과 - OUTLINE HIERARCHY]")
    print(f"  - Ground Truth 노드 수: {len(gt_flat)}개 | 예측 노드 수: {len(pred_flat)}개")
    print(f"  - Matched (TP): {eval_res['tp']}개 | 누락 (FN): {eval_res['fn']}개 | 과추출 (FP): {eval_res['fp']}개")
    print(f"  - Precision: {eval_res['precision']:>5.1f}% | Recall: {eval_res['recall']:>5.1f}% | F1 Score: {eval_res['f1']:>5.1f}%")
    print(f"  - 계층 경로 정합도(Path Accuracy): {eval_res['avg_path_accuracy']:>5.1f}%")
    if eval_res["missed_outlines"]:
        print(f"  - 미탐지 노드 샘플: {', '.join(eval_res['missed_outlines'][:5])}")
    print("=" * 72 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Step 1 Isolated Test")
    parser.add_argument("--doc", default="11월_디딤돌_회의록")
    parser.add_argument("--model", default="gemini-3.8-flash-low")
    args = parser.parse_args()

    asyncio.run(run_step1_isolated(doc_name=args.doc, model=args.model))
