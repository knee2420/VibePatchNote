"""[06.staging/step2_elements] Step 2 엘리먼트 추출기 단독 실행 및 Element F1 / Binding 즉시 채점기.

특징:
Step 1의 오차 전파를 차단하기 위해, 정답셋(Ground Truth)의 아웃라인을 기준 컨텍스트로 주입하여
Step 2 모델 자체의 엘리먼트 추출 및 바인딩 성능만 독립적으로 정밀 채점합니다.
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
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.antigravity import AntigravityAgent
from app.documents.pipeline.context import DocumentPipelineContext, OutlineNode
from app.documents.pipeline.steps.geometry_step import ExtractGeometryStep

from step import EnrichElementsStep

# 평가기 임포트
EVAL_DIR = REPO_ROOT / "workbench" / "05.llm_tuning" / "01.outline_extraction" / "05.evaluations"
sys.path.insert(0, str(EVAL_DIR))
from evaluate import (
    collect_all_elements,
    evaluate_elements,
    flatten_outline_tree,
)


def _load_gt_nodes(nodes_raw: list) -> list:
    res = []
    for r in nodes_raw:
        n = OutlineNode(
            id=r["id"],
            level=r["level"],
            title=r["title"],
            page=r.get("page", 1),
            box_2d=r.get("box_2d"),
            purpose=r.get("purpose"),
            elements=[],
            children=_load_gt_nodes(r.get("children", [])),
        )
        res.append(n)
    return res


async def run_step2_isolated(doc_name: str = "11월_디딤돌_회의록", model: str = "gemini-3.8-flash-low"):
    print("\n" + "=" * 72)
    print(f"  [06.staging] Step 2 (Element Extraction & Binding) 단독 테스트: {doc_name}")
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

    # 2. GT Outline을 Context에 기준 아웃라인으로 주입 (오차 격리)
    gt_outline_file = tuning_dir / "02.ground_truth" / doc_name / "expected_outlines.json"
    if not gt_outline_file.exists():
        print(f"[!] Ground Truth Outline missing: {gt_outline_file}")
        return

    with open(gt_outline_file, "r", encoding="utf-8") as f:
        gt_outline_data = json.load(f)
    ctx.outlines = _load_gt_nodes(gt_outline_data.get("outlines", []))
    print(f"[*] Standard GT Outlines ({len(ctx.outlines)} roots) injected as clean context.")

    # 3. Step 2 실행
    agent = AntigravityAgent(model=model, timeout_seconds=90)
    step = EnrichElementsStep(agent=agent)
    await step.execute(ctx)

    # 4. Step 2 결과 저장
    out_dir = Path(__file__).parent
    out_file = out_dir / f"output_{doc_name}.json"
    pred_data = {
        "document_title": f"{doc_name}.pdf",
        "elements": [e.model_dump(by_alias=True) for e in ctx.flat_elements],
    }
    out_file.write_text(json.dumps(pred_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[*] Step 2 결과 저장: {out_file.name} (총 {len(ctx.flat_elements)}건)")

    # 5. GT Elements와 비교하여 정밀 채점
    gt_elem_file = tuning_dir / "02.ground_truth" / doc_name / "expected_elements.json"
    if not gt_elem_file.exists():
        print(f"[!] GT Elements missing: {gt_elem_file}")
        return

    with open(gt_elem_file, "r", encoding="utf-8") as f:
        gt_elems_data = json.load(f)

    gt_all_elements = collect_all_elements(gt_outline_data.get("outlines", []), gt_elems_data)
    pred_all_elements = collect_all_elements(gt_outline_data.get("outlines", []), pred_data["elements"])

    # 1:1 완벽 아웃라인 매칭 테이블 구성 (GT id == Pred id)
    fake_outline_matches = [
        {"gt_id": n["id"], "pred_id": n["id"]}
        for n in flatten_outline_tree(gt_outline_data.get("outlines", []))
    ]

    eval_res = evaluate_elements(gt_all_elements, pred_all_elements, fake_outline_matches)

    print("-" * 72)
    print(f"  [Step 2 단독 채점 결과 - ELEMENT & BINDING]")
    print(f"  - Ground Truth 엘리먼트 수: {len(gt_all_elements)}개 | 추출된 엘리먼트 수: {len(pred_all_elements)}개")
    print(f"  - Matched (TP): {eval_res['tp']}개 | 누락 (FN): {eval_res['fn']}개 | 과추출 (FP): {eval_res['fp']}개")
    print(f"  - Precision: {eval_res['precision']:>5.1f}% | Recall: {eval_res['recall']:>5.1f}% | F1 Score: {eval_res['f1']:>5.1f}%")
    print(f"  - 섹션 바인딩 정합률 (Binding Accuracy): {eval_res['binding_accuracy']:>5.1f}%")
    if eval_res["missed_elements"]:
        print(f"  - 미추출 엘리먼트 샘플: {', '.join(eval_res['missed_elements'][:4])}")
    print("=" * 72 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Step 2 Isolated Test")
    parser.add_argument("--doc", default="11월_디딤돌_회의록")
    parser.add_argument("--model", default="gemini-3.8-flash-low")
    args = parser.parse_args()

    asyncio.run(run_step2_isolated(doc_name=args.doc, model=args.model))
