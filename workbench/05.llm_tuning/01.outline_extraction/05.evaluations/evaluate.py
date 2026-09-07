"""정답셋 vs 예측 아웃라인 트리 F1 채점기."""
import json
from pathlib import Path

def evaluate():
    base = Path(__file__).resolve().parent.parent
    gt_file = base / "02.ground_truth" / "11월_디딤돌_회의록" / "expected_outlines.json"
    pred_file = base / "03.baselines_raw_llm" / "gemini-3.5-flash" / "11월_디딤돌_회의록" / "outline_tree.json"
    if not (gt_file.exists() and pred_file.exists()):
        print("[!] File missing")
        return
    with open(gt_file, "r", encoding="utf-8") as f: gt = json.load(f)
    with open(pred_file, "r", encoding="utf-8") as f: pred = json.load(f)
    print(f"Ground Truth Outlines: {len(gt.get('outlines', []))}")
    print(f"Predicted Outlines:    {len(pred.get('outlines', []))}")

if __name__ == "__main__":
    evaluate()
