"""정답셋(Ground Truth) vs LLM 예측 결과(Outline + Element) 다차원 F1 정밀 채점기.

[측정 차원]
1. Outline Tree Hierarchy F1:
   - 노드 제목(Title) 정합도
   - 계층 경로(Path: Level & Parent-Child) 일치율
   - 노드 레벨 Precision, Recall, F1
2. Element Extraction F1:
   - Key-Value, List, Table 등 요소 Label 및 Content/Value 일치도
   - 요소 레벨 Precision, Recall, F1
3. Structural Binding Accuracy:
   - 추출된 엘리먼트가 올바른 아웃라인 섹션(Outline Node)에 귀속되었는지 검증
4. Overall Composite Score:
   - 가중 종합 점수 (Outline 40% + Element 40% + Binding 20%)
"""

import argparse
import difflib
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


def normalize_text(text: str) -> str:
    """공백, 특수문자 정규화 및 소문자화."""
    if not text:
        return ""
    text = re.sub(r"[\s_\-·,()]+", " ", str(text)).strip().lower()
    return text


def text_similarity(a: str, b: str) -> float:
    """두 텍스트 간의 형태적 유사도 (0.0 ~ 1.0)."""
    norm_a = normalize_text(a)
    norm_b = normalize_text(b)
    if not norm_a or not norm_b:
        return 0.0
    if norm_a == norm_b:
        return 1.0
    if norm_a in norm_b or norm_b in norm_a:
        # 부분 포함 시 높은 점수 부여
        min_len = min(len(norm_a), len(norm_b))
        max_len = max(len(norm_a), len(norm_b))
        return 0.8 + 0.2 * (min_len / max_len)
    return difflib.SequenceMatcher(None, norm_a, norm_b).ratio()


# ============================================================================
# 1. 트리 순회 및 데이터 추출 헬퍼
# ============================================================================

def flatten_outline_tree(
    nodes: List[Dict[str, Any]],
    parent_path: str = "",
    parent_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """중첩된 아웃라인 트리를 평탄화하여 고유 경로와 메타데이터 추출."""
    flattened = []
    for node in nodes:
        node_id = str(node.get("id", ""))
        title = node.get("title", "").strip()
        level = node.get("level", 1)
        page = node.get("page", 1)
        path = f"{parent_path} > {title}" if parent_path else title

        flat_item = {
            "id": node_id,
            "title": title,
            "norm_title": normalize_text(title),
            "level": level,
            "page": page,
            "path": path,
            "parent_id": parent_id,
            "raw_elements": node.get("elements", []),
        }
        flattened.append(flat_item)

        children = node.get("children", [])
        if isinstance(children, list) and children:
            flattened.extend(flatten_outline_tree(children, parent_path=path, parent_id=node_id))
    return flattened


def collect_all_elements(
    outline_nodes: List[Dict[str, Any]],
    external_elements: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """아웃라인 내부 임베디드 요소 또는 외부 elements.json 통합 수집."""
    elements = []
    
    # 1. 아웃라인 트리 내부 elements 수집
    flat_outlines = flatten_outline_tree(outline_nodes)
    for node in flat_outlines:
        for elem in node.get("raw_elements", []):
            e_copy = dict(elem)
            if "outline_id" not in e_copy or not e_copy["outline_id"]:
                e_copy["outline_id"] = node["id"]
            e_copy["_outline_title"] = node["title"]
            elements.append(e_copy)

    # 2. 외부 별도 리스트가 있는 경우 병합 (중복 제외)
    if external_elements:
        seen_ids = {e.get("id") for e in elements if e.get("id")}
        for elem in external_elements:
            if elem.get("id") not in seen_ids:
                elements.append(elem)

    # 필드 정규화
    normalized_elements = []
    for elem in elements:
        label = elem.get("label", "") or elem.get("name", "")
        val = elem.get("value", "") or elem.get("content_summary", "")
        if not val and elem.get("items"):
            val = " ".join(str(i) for i in elem["items"])
        elif not val and elem.get("structured_data"):
            val = json.dumps(elem["structured_data"], ensure_ascii=False)

        normalized_elements.append({
            "id": elem.get("id", ""),
            "outline_id": str(elem.get("outline_id", "")),
            "type": elem.get("type", "unknown"),
            "label": label,
            "norm_label": normalize_text(label),
            "value": str(val).strip(),
            "norm_value": normalize_text(str(val)),
            "page": elem.get("page", 1),
        })

    return normalized_elements


# ============================================================================
# 2. 채점 엔진 (Evaluation Metrics)
# ============================================================================

def evaluate_outlines(
    gt_flat: List[Dict[str, Any]],
    pred_flat: List[Dict[str, Any]],
    sim_threshold: float = 0.65,
) -> Dict[str, Any]:
    """아웃라인 노드 및 계층 경로(Path) 정합성 평가."""
    if not gt_flat and not pred_flat:
        return {
            "tp": 0, "fp": 0, "fn": 0,
            "precision": 100.0, "recall": 100.0, "f1": 100.0,
            "avg_path_accuracy": 100.0, "matched_nodes": [],
            "missed_outlines": [], "excess_outlines": []
        }
    if not gt_flat or not pred_flat:
        tp = 0
        fp = len(pred_flat)
        fn = len(gt_flat)
        return {
            "tp": tp, "fp": fp, "fn": fn,
            "precision": 0.0, "recall": 0.0, "f1": 0.0,
            "avg_path_accuracy": 0.0, "matched_nodes": [],
            "missed_outlines": [g.get("title", "") for g in gt_flat],
            "excess_outlines": [p.get("title", "") for p in pred_flat]
        }

    matched_gt_ids: Set[str] = set()
    matched_pred_ids: Set[str] = set()
    matches = []

    # 1. 최적 매칭 탐색 (Greedy Match based on similarity)
    candidates = []
    for g_idx, g in enumerate(gt_flat):
        for p_idx, p in enumerate(pred_flat):
            title_sim = text_similarity(g["title"], p["title"])
            path_sim = text_similarity(g["path"], p["path"])
            # 가중 유사도: 제목 70% + 경로(Hierarchy) 30%
            combined_sim = (title_sim * 0.7) + (path_sim * 0.3)
            if combined_sim >= sim_threshold:
                candidates.append((combined_sim, g_idx, p_idx, title_sim, path_sim))

    # 유사도 높은 순으로 정렬 후 1:1 매칭
    candidates.sort(key=lambda x: x[0], reverse=True)
    for combined_sim, g_idx, p_idx, t_sim, p_sim in candidates:
        g = gt_flat[g_idx]
        p = pred_flat[p_idx]
        if g["id"] not in matched_gt_ids and p["id"] not in matched_pred_ids:
            matched_gt_ids.add(g["id"])
            matched_pred_ids.add(p["id"])
            matches.append({
                "gt_id": g["id"],
                "pred_id": p["id"],
                "gt_title": g["title"],
                "pred_title": p["title"],
                "gt_path": g["path"],
                "pred_path": p["path"],
                "title_sim": round(t_sim, 2),
                "path_sim": round(p_sim, 2),
                "combined_sim": round(combined_sim, 2),
            })

    tp = len(matches)
    fp = len(pred_flat) - tp
    fn = len(gt_flat) - tp

    precision = round((tp / len(pred_flat)) * 100, 1) if pred_flat else 0.0
    recall = round((tp / len(gt_flat)) * 100, 1) if gt_flat else 0.0
    f1 = round((2 * precision * recall) / (precision + recall), 1) if (precision + recall) > 0 else 0.0

    # Path 일치도 평균 (트리 구조 충실도)
    avg_path_sim = (
        round(sum(m["path_sim"] for m in matches) / len(matches) * 100, 1)
        if matches else 0.0
    )

    missed_gt = [g["title"] for g in gt_flat if g["id"] not in matched_gt_ids]
    excess_pred = [p["title"] for p in pred_flat if p["id"] not in matched_pred_ids]

    return {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "avg_path_accuracy": avg_path_sim,
        "matched_nodes": matches,
        "missed_outlines": missed_gt,
        "excess_outlines": excess_pred,
    }


def evaluate_elements(
    gt_elements: List[Dict[str, Any]],
    pred_elements: List[Dict[str, Any]],
    outline_matches: List[Dict[str, Any]],
    sim_threshold: float = 0.60,
) -> Dict[str, Any]:
    """엘리먼트(내용 데이터) 추출 정확도 및 아웃라인 바인딩 정합도 평가."""
    if not gt_elements and not pred_elements:
        return {
            "tp": 0, "fp": 0, "fn": 0,
            "precision": 100.0, "recall": 100.0, "f1": 100.0,
            "binding_accuracy": 100.0, "matched_elements": [],
            "missed_elements": [], "excess_elements": []
        }
    if not gt_elements or not pred_elements:
        tp = 0
        fp = len(pred_elements)
        fn = len(gt_elements)
        missed = [f"[{g.get('label','')}] {str(g.get('value',''))[:30]}" for g in gt_elements]
        excess = [f"[{p.get('label','')}] {str(p.get('value',''))[:30]}" for p in pred_elements]
        return {
            "tp": tp, "fp": fp, "fn": fn,
            "precision": 0.0, "recall": 0.0, "f1": 0.0,
            "binding_accuracy": 0.0, "matched_elements": [],
            "missed_elements": missed, "excess_elements": excess
        }

    # outline ID 매핑 테이블 생성 (gt_outline_id -> pred_outline_id)
    outline_gt_to_pred = {m["gt_id"]: m["pred_id"] for m in outline_matches}

    matched_gt_ids: Set[str] = set()
    matched_pred_ids: Set[str] = set()
    matches = []

    candidates = []
    for g_idx, g in enumerate(gt_elements):
        for p_idx, p in enumerate(pred_elements):
            label_sim = text_similarity(g["label"], p["label"])
            val_sim = text_similarity(g["value"], p["value"])
            # 가중치: Label 50% + Value 50%
            combined_sim = (label_sim * 0.5) + (val_sim * 0.5)
            if combined_sim >= sim_threshold:
                candidates.append((combined_sim, g_idx, p_idx, label_sim, val_sim))

    candidates.sort(key=lambda x: x[0], reverse=True)
    for combined_sim, g_idx, p_idx, l_sim, v_sim in candidates:
        g = gt_elements[g_idx]
        p = pred_elements[p_idx]
        if g["id"] not in matched_gt_ids and p["id"] not in matched_pred_ids:
            matched_gt_ids.add(g["id"])
            matched_pred_ids.add(p["id"])

            # 바인딩 검증: 이 엘리먼트가 올바른 아웃라인 섹션 아래에 달렸는가?
            expected_pred_outline_id = outline_gt_to_pred.get(g["outline_id"])
            binding_correct = (
                expected_pred_outline_id is not None
                and expected_pred_outline_id == p["outline_id"]
            )

            matches.append({
                "gt_id": g["id"],
                "pred_id": p["id"],
                "gt_label": g["label"],
                "pred_label": p["label"],
                "gt_value": g["value"][:40] + ("..." if len(g["value"]) > 40 else ""),
                "pred_value": p["value"][:40] + ("..." if len(p["value"]) > 40 else ""),
                "label_sim": round(l_sim, 2),
                "value_sim": round(v_sim, 2),
                "binding_correct": binding_correct,
            })

    tp = len(matches)
    fp = len(pred_elements) - tp
    fn = len(gt_elements) - tp

    precision = round((tp / len(pred_elements)) * 100, 1) if pred_elements else 0.0
    recall = round((tp / len(gt_elements)) * 100, 1) if gt_elements else 0.0
    f1 = round((2 * precision * recall) / (precision + recall), 1) if (precision + recall) > 0 else 0.0

    # 바인딩 정확도 (올바른 아웃라인에 소속된 비율)
    correct_bindings = sum(1 for m in matches if m["binding_correct"])
    binding_acc = round((correct_bindings / tp) * 100, 1) if tp > 0 else 0.0

    missed_elems = [f"[{g['label']}] {g['value'][:30]}" for g in gt_elements if g["id"] not in matched_gt_ids]
    excess_elems = [f"[{p['label']}] {p['value'][:30]}" for p in pred_elements if p["id"] not in matched_pred_ids]

    return {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "binding_accuracy": binding_acc,
        "correct_bindings_count": correct_bindings,
        "matched_elements": matches,
        "missed_elements": missed_elems,
        "excess_elements": excess_elems,
    }


# ============================================================================
# 3. 종합 평가 및 CLI 리포트 출력
# ============================================================================

def run_evaluation(
    doc_name: str = "11월_디딤돌_회의록",
    pred_path: Optional[Path] = None,
    print_report: bool = True,
) -> Dict[str, Any]:
    """지정 문서에 대해 Ground Truth vs 예측 결과를 종합 채점."""
    base_dir = Path(__file__).resolve().parent.parent

    # 1. Ground Truth 로드
    gt_dir = base_dir / "02.ground_truth" / doc_name
    gt_outline_file = gt_dir / "expected_outlines.json"
    gt_element_file = gt_dir / "expected_elements.json"

    if not gt_outline_file.exists():
        if print_report:
            print(f"[!] Ground Truth file not found: {gt_outline_file}")
        return {"error": f"GT file not found: {gt_outline_file}"}

    with open(gt_outline_file, "r", encoding="utf-8") as f:
        gt_outline_data = json.load(f)
    gt_element_data = []
    if gt_element_file.exists():
        with open(gt_element_file, "r", encoding="utf-8") as f:
            gt_element_data = json.load(f)

    # 2. Prediction 로드
    if pred_path is None:
        # 우선순위: 04.experiments 최신 결과 -> 03.baselines_raw_llm
        exp_dir = base_dir / "04.experiments" / doc_name
        exp_files = sorted(exp_dir.glob("result_*.json"), key=lambda p: p.stat().st_mtime, reverse=True) if exp_dir.exists() else []
        if exp_files:
            pred_path = exp_files[0]
        else:
            pred_path = base_dir / "03.baselines_raw_llm" / "gemini-3.5-flash" / doc_name / "outline_tree.json"

    if not pred_path.exists():
        if print_report:
            print(f"[!] Prediction file not found: {pred_path}")
        return {"error": f"Prediction file not found: {pred_path}"}

    with open(pred_path, "r", encoding="utf-8") as f:
        pred_outline_data = json.load(f)

    # 별도 elements.json 확인
    pred_element_file = pred_path.parent / "elements.json"
    pred_element_data = []
    if pred_element_file.exists():
        with open(pred_element_file, "r", encoding="utf-8") as f:
            pred_element_data = json.load(f)

    # 3. 데이터 평탄화 및 요소 통합
    gt_flat_outlines = flatten_outline_tree(gt_outline_data.get("outlines", []))
    pred_flat_outlines = flatten_outline_tree(pred_outline_data.get("outlines", []))

    gt_all_elements = collect_all_elements(gt_outline_data.get("outlines", []), gt_element_data)
    pred_all_elements = collect_all_elements(pred_outline_data.get("outlines", []), pred_element_data)

    # 4. 평가 실행
    outline_eval = evaluate_outlines(gt_flat_outlines, pred_flat_outlines)
    element_eval = evaluate_elements(
        gt_all_elements,
        pred_all_elements,
        outline_eval.get("matched_nodes", []),
    )

    # 5. 가중 종합 점수 계산 (Outline 40% + Element 40% + Binding 20%)
    w_outline = 0.40
    w_element = 0.40
    w_binding = 0.20

    overall_score = round(
        (outline_eval["f1"] * w_outline)
        + (element_eval["f1"] * w_element)
        + (element_eval["binding_accuracy"] * w_binding),
        1,
    )

    report = {
        "document": doc_name,
        "prediction_file": str(pred_path),
        "overall_score": overall_score,
        "weights": {"outline_f1": w_outline, "element_f1": w_element, "binding_acc": w_binding},
        "outline_metrics": {
            "total_gt": len(gt_flat_outlines),
            "total_pred": len(pred_flat_outlines),
            "tp": outline_eval["tp"],
            "fp": outline_eval["fp"],
            "fn": outline_eval["fn"],
            "precision": outline_eval["precision"],
            "recall": outline_eval["recall"],
            "f1": outline_eval["f1"],
            "path_hierarchy_accuracy": outline_eval["avg_path_accuracy"],
            "missed_samples": outline_eval["missed_outlines"][:5],
            "excess_samples": outline_eval["excess_outlines"][:5],
        },
        "element_metrics": {
            "total_gt": len(gt_all_elements),
            "total_pred": len(pred_all_elements),
            "tp": element_eval["tp"],
            "fp": element_eval["fp"],
            "fn": element_eval["fn"],
            "precision": element_eval["precision"],
            "recall": element_eval["recall"],
            "f1": element_eval["f1"],
            "binding_accuracy": element_eval["binding_accuracy"],
            "missed_samples": element_eval["missed_elements"][:5],
            "excess_samples": element_eval["excess_elements"][:5],
        },
    }

    if print_report:
        _print_terminal_report(report)

    return report


def _print_terminal_report(r: Dict[str, Any]):
    """가독성 높은 터미널 대시보드 리포트 출력."""
    import sys
    if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    o = r["outline_metrics"]
    e = r["element_metrics"]

    print("\n" + "=" * 72)
    print(f"  [LLM Tuning Benchmark Report] - {r['document']}")
    print(f"  Target: {Path(r['prediction_file']).name}")
    print("=" * 72)
    print(f"  * OVERALL COMPOSITE SCORE: {r['overall_score']:>5.1f} / 100.0 *")
    print("-" * 72)

    print("  [1] OUTLINE HIERARCHY EVALUATION (Weight: 40%)")
    print(f"      - Ground Truth / Predicted:   {o['total_gt']} items / {o['total_pred']} items")
    print(f"      - Matched (TP) / Missed (FN):  {o['tp']} / {o['fn']} (Excess FP: {o['fp']})")
    print(f"      - Precision: {o['precision']:>5.1f}% | Recall: {o['recall']:>5.1f}% | F1: {o['f1']:>5.1f}%")
    print(f"      - Hierarchy Path Accuracy:    {o['path_hierarchy_accuracy']:>5.1f}%")
    if o["missed_samples"]:
        print(f"      - Missed Outline Samples: {', '.join(o['missed_samples'][:3])}")

    print("-" * 72)
    print("  [2] ELEMENT EXTRACTION EVALUATION (Weight: 40%)")
    print(f"      - Ground Truth / Predicted:   {e['total_gt']} items / {e['total_pred']} items")
    print(f"      - Matched (TP) / Missed (FN):  {e['tp']} / {e['fn']} (Excess FP: {e['fp']})")
    print(f"      - Precision: {e['precision']:>5.1f}% | Recall: {e['recall']:>5.1f}% | F1: {e['f1']:>5.1f}%")
    if e["missed_samples"]:
        print(f"      - Missed Element Samples: {', '.join(e['missed_samples'][:2])}")

    print("-" * 72)
    print("  [3] STRUCTURAL BINDING ACCURACY (Weight: 20%)")
    print(f"      - Section Binding Accuracy:   {e['binding_accuracy']:>5.1f}%")
    print("=" * 72 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Outline & Element Multi-Dimensional F1 Evaluator")
    parser.add_argument("--doc", default="11월_디딤돌_회의록", help="문서 이름 (02.ground_truth 하위)")
    parser.add_argument("--pred", default=None, help="예측 결과 JSON 파일 경로 (미지정 시 최신 결과 자동 탐색)")
    args = parser.parse_args()

    pred_path = Path(args.pred) if args.pred else None
    run_evaluation(doc_name=args.doc, pred_path=pred_path)

