"""[01.outline_extraction_v2] 통합 벤치마크 매트릭스 러너.

3대 기준 문서(11월_디딤돌_회의록, Atticus_LLC_Invoice_000081709, 디딤돌_참가신청서_딥드론)에 대해
V2 아웃라인 추출 파이프라인을 일괄 구동하고 정답셋(Ground Truth)과 비교 채점하여 정밀 비교표를 생성합니다.
"""
import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List

V2_ROOT = Path(__file__).resolve().parent
REPO_ROOT = next(p for p in V2_ROOT.parents if (p / "apps").exists())
V1_ROOT = REPO_ROOT / "workbench" / "05.llm_tuning" / "01.outline_extraction"

sys.path.insert(0, str(V2_ROOT))
sys.path.insert(0, str(V1_ROOT / "05.evaluations"))

from evaluate import (
    evaluate_outlines,
    flatten_outline_tree,
    collect_all_elements,
    evaluate_elements,
)
from pipeline.step1_outline import OutlineExtractionStep

BENCHMARK_DOCS = [
    "11월_디딤돌_회의록",
    "Atticus_LLC_Invoice_000081709",
    "디딤돌_참가신청서_딥드론",
]


def load_v1_baseline(doc_name: str) -> Dict[str, Any]:
    """V1 기준 결과 점수 조회 (비교용)."""
    v1_file = V1_ROOT / "06.staging" / "step1_outline" / f"output_{doc_name}.json"
    gt_file = V1_ROOT / "02.ground_truth" / doc_name / "expected_outlines.json"
    if not v1_file.exists() or not gt_file.exists():
        return {}

    with open(gt_file, "r", encoding="utf-8") as f:
        gt_data = json.load(f)
    with open(v1_file, "r", encoding="utf-8") as f:
        v1_data = json.load(f)

    gt_flat = flatten_outline_tree(gt_data.get("outlines", []))
    v1_flat = flatten_outline_tree(v1_data.get("outlines", []))
    res = evaluate_outlines(gt_flat, v1_flat)
    return {
        "precision": res["precision"],
        "recall": res["recall"],
        "f1": res["f1"],
        "path_acc": res["avg_path_accuracy"],
        "total_nodes": len(v1_flat),
    }


def run_benchmark(
    docs: List[str] = BENCHMARK_DOCS,
    model: str = "gemini-3.8-flash-low",
    effort: str = "low",
) -> Dict[str, Any]:
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    print("\n" + "=" * 80)
    print("  [01.outline_extraction_v2] 종합 벤치마크 매트릭스 실행")
    print(f"  - 모델: {model} (추론 강도: {effort})")
    print(f"  - 대상 문서군: {', '.join(docs)}")
    print("=" * 80 + "\n")

    step = OutlineExtractionStep()
    matrix_results = []

    for doc_name in docs:
        print(f"▶ [{doc_name}] V2 추출 진행 중...")
        pdf_path = V1_ROOT / "01.dataset" / "raw" / f"{doc_name}.pdf"
        if not pdf_path.exists():
            print(f"  [!] PDF 미발견: {pdf_path}")
            continue

        gt_file = V1_ROOT / "02.ground_truth" / doc_name / "expected_outlines.json"
        if not gt_file.exists():
            print(f"  [!] Ground Truth 미발견: {gt_file}")
            continue

        with open(gt_file, "r", encoding="utf-8") as f:
            gt_data = json.load(f)

        # GT elements 바인딩
        gt_elem_file = V1_ROOT / "02.ground_truth" / doc_name / "expected_elements.json"
        if gt_elem_file.exists():
            try:
                gt_elems = json.loads(gt_elem_file.read_text(encoding="utf-8"))
                elem_map = {}
                for el in gt_elems:
                    oid = el.get("outline_id")
                    if oid:
                        elem_map.setdefault(oid, []).append(el)

                def attach(nodes):
                    for n in nodes:
                        nid = n.get("id")
                        if nid in elem_map:
                            n["elements"] = elem_map[nid]
                        attach(n.get("children", []))

                attach(gt_data.get("outlines", []))
            except Exception:
                pass

        # 1. V2 실행
        res = step.execute(pdf_path=pdf_path, model=model, effort=effort)
        if not res["success"]:
            print(f"  [!] 실행 실패: {res['error']}")
            continue

        v2_pred = res["data"]
        telemetry = res["telemetry"]

        # 2. 채점 (Outline Tree)
        gt_flat = flatten_outline_tree(gt_data.get("outlines", []))
        v2_flat = flatten_outline_tree(v2_pred.get("outlines", []))
        eval_res = evaluate_outlines(gt_flat, v2_flat)

        # 3. 채점 (Elements / Classify)
        gt_all_elems = collect_all_elements(gt_data.get("outlines", []))
        v2_all_elems = collect_all_elements(v2_pred.get("outlines", []))
        elem_res = (
            evaluate_elements(gt_all_elems, v2_all_elems, eval_res.get("matched_nodes", []))
            if (gt_all_elems or v2_all_elems)
            else {}
        )

        # 4. V1 기준선 로드
        v1_score = load_v1_baseline(doc_name)

        doc_summary = {
            "document": doc_name,
            "v1_f1": v1_score.get("f1", 0.0),
            "v1_path_acc": v1_score.get("path_acc", 0.0),
            "v2_nodes": len(v2_flat),
            "gt_nodes": len(gt_flat),
            "tp": eval_res["tp"],
            "fp": eval_res["fp"],
            "fn": eval_res["fn"],
            "precision": eval_res["precision"],
            "recall": eval_res["recall"],
            "f1": eval_res["f1"],
            "f1_delta": round(eval_res["f1"] - v1_score.get("f1", 0.0), 1),
            "path_acc": eval_res["avg_path_accuracy"],
            "elem_f1": elem_res.get("f1", 0.0),
            "elem_tp": elem_res.get("tp", 0),
            "elem_gt": len(gt_all_elems),
            "elem_pred": len(v2_all_elems),
            "latency": telemetry["cli_duration"],
            "tokens": telemetry["tokens"]["total"],
            "missed_samples": eval_res["missed_outlines"][:3],
            "excess_samples": eval_res["excess_outlines"][:3],
        }
        matrix_results.append(doc_summary)

        print(
            f"  └─ 결과: 목차 F1 {doc_summary['f1']}% (V1 대비 {doc_summary['f1_delta']:+0.1f}%) | "
            f"요소(Classify) F1 {doc_summary['elem_f1']}% ({doc_summary['elem_tp']}/{doc_summary['elem_gt']} 매핑) | "
            f"P: {doc_summary['precision']}% | R: {doc_summary['recall']}% | "
            f"Path: {doc_summary['path_acc']}% | 지연: {doc_summary['latency']}s\n"
        )

    # 4. 전체 요약 및 마크다운 리포트 생성
    print("\n" + "=" * 80)
    print("  [01.outline_extraction_v2] 최종 벤치마크 평가 매트릭스")
    print("=" * 80)

    header = f"| {'문서명':<25} | {'V1 F1':>7} | {'V2 F1':>7} | {'Δ F1':>7} | {'Precision':>9} | {'Recall':>7} | {'Path Acc':>8} | {'Latency':>7} | {'Tokens':>7} |"
    sep = f"|{'-'*27}|{'-'*9}|{'-'*9}|{'-'*9}|{'-'*11}|{'-'*9}|{'-'*10}|{'-'*9}|{'-'*9}|"
    print(header)
    print(sep)

    md_lines = [
        "# [01.outline_extraction_v2] 벤치마크 매트릭스 리포트",
        "",
        f"- **모델**: `{model}` (추론 모드: `{effort}`)",
        f"- **테스트 시각**: `{time.strftime('%Y-%m-%d %H:%M:%S')}`",
        "",
        header,
        sep,
    ]

    for m in matrix_results:
        row = (
            f"| {m['document']:<25} | "
            f"{m['v1_f1']:>6.1f}% | "
            f"{m['f1']:>6.1f}% | "
            f"{m['f1_delta']:>+6.1f}% | "
            f"{m['precision']:>8.1f}% | "
            f"{m['recall']:>6.1f}% | "
            f"{m['path_acc']:>7.1f}% | "
            f"{m['latency']:>6.1f}s | "
            f"{m['tokens']:>7} |"
        )
        print(row)
        md_lines.append(row)

    print("=" * 80 + "\n")

    # 파일 저장
    report_json = V2_ROOT / "benchmark_report.json"
    report_md = V2_ROOT / "benchmark_report.md"
    report_json.write_text(json.dumps(matrix_results, ensure_ascii=False, indent=2), encoding="utf-8")
    report_md.write_text("\n".join(md_lines), encoding="utf-8")

    return {"matrix": matrix_results, "report_path": str(report_md)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run V2 Benchmark Matrix")
    parser.add_argument("--model", default="gemini-3.8-flash-low", help="Model name")
    parser.add_argument("--effort", default="low", help="Effort level")
    args = parser.parse_args()

    run_benchmark(model=args.model, effort=args.effort)
