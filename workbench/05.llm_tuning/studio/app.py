"""
VibePatchNote — LLM Tuning Studio Backend (v2)
Ground Truth vs V2 아웃라인 50:50 좌-우 대조 및 정밀 F1 지표 대시보드 서버 (:8088).
"""
import json
import logging
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel, Field

# 윈도우 콘솔 UTF-8 강제
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

STUDIO_DIR = Path(__file__).resolve().parent
TUNING_DIR = STUDIO_DIR.parent
PROJECT_ROOT = TUNING_DIR.parent.parent

V1_DIR = TUNING_DIR / "01.outline_extraction"
V2_DIR = TUNING_DIR / "01.outline_extraction_v2"

# V1 평가 모듈 임포트
sys.path.insert(0, str(V1_DIR / "05.evaluations"))
try:
    from evaluate import (
        evaluate_outlines,
        flatten_outline_tree,
        collect_all_elements,
        evaluate_elements,
    )
except ImportError:
    evaluate_outlines = None
    flatten_outline_tree = None
    collect_all_elements = None
    evaluate_elements = None


# V2 파이프라인 모듈 임포트
sys.path.insert(0, str(V2_DIR))
try:
    from pipeline.step1_outline import OutlineExtractionStep
    from evaluations.llm_judge import OutlineLLMJudge
except ImportError:
    OutlineExtractionStep = None
    OutlineLLMJudge = None


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LLMTuningStudio")

app = FastAPI(title="LLM Tuning Studio v2", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_INDEX = STUDIO_DIR / "static" / "index.html"


@app.get("/", response_class=HTMLResponse)
async def serve_index():
    if not STATIC_INDEX.exists():
        raise HTTPException(status_code=404, detail="Studio UI not found.")
    return FileResponse(STATIC_INDEX)


@app.get("/api/documents")
async def get_documents():
    """사용 가능한 벤치마크 대상 문서 목록 반환."""
    docs = set()
    for p in [V1_DIR / "02.ground_truth", V1_DIR / "01.dataset" / "raw"]:
        if p.exists():
            for item in p.iterdir():
                name = item.stem if item.is_file() else item.name
                if not name.startswith("."):
                    docs.add(name)

    doc_list = sorted(list(docs))
    if not doc_list:
        doc_list = ["11월_디딤돌_회의록", "Atticus_LLC_Invoice_000081709", "디딤돌_참가신청서_딥드론"]
    return {"documents": doc_list}


def bind_gt_elements(gt_data: Dict[str, Any], doc: str) -> None:
    """Ground Truth 디렉터리의 expected_elements.json을 아웃라인 트리에 자동 매핑."""
    gt_elem_file = V1_DIR / "02.ground_truth" / doc / "expected_elements.json"
    if not gt_elem_file.exists() or "outlines" not in gt_data:
        return

    try:
        gt_elements = json.loads(gt_elem_file.read_text(encoding="utf-8"))
        elem_map: Dict[str, List[Dict[str, Any]]] = {}
        for el in gt_elements:
            oid = el.get("outline_id")
            if oid:
                elem_map.setdefault(oid, []).append(el)

        def attach(nodes: List[Dict[str, Any]]):
            for node in nodes:
                nid = node.get("id")
                if nid in elem_map:
                    node["elements"] = elem_map[nid]
                    if not node.get("type"):
                        node["type"] = elem_map[nid][0].get("type", "key_value")
                else:
                    if node.get("children"):
                        if not node.get("type"):
                            node["type"] = "header"
                    else:
                        if not node.get("type"):
                            node["type"] = "key_value"
                attach(node.get("children", []))

        attach(gt_data.get("outlines", []))
    except Exception as e:
        logger.warning("Failed to bind GT elements: %s", e)


def calculate_diff_and_metrics(gt_data: Dict[str, Any], pred_data: Dict[str, Any]) -> Dict[str, Any]:
    """정답셋 vs 예측결과 F1 채점 및 각 노드별 일치/누락/과추출 매핑 (아웃라인 + 엘리먼트 종합)."""
    if not flatten_outline_tree or not evaluate_outlines:
        return {"f1": 0.0, "precision": 0.0, "recall": 0.0, "path_accuracy": 0.0}

    gt_flat = flatten_outline_tree(gt_data.get("outlines", []))
    pred_flat = flatten_outline_tree(pred_data.get("outlines", []))
    res = evaluate_outlines(gt_flat, pred_flat)

    matched_nodes = res.get("matched_nodes", [])
    matched_gt_ids = {m["gt_id"]: m for m in matched_nodes}
    matched_pred_ids = {m["pred_id"]: m for m in matched_nodes}

    # 엘리먼트/컴포넌트 채점 (evaluate_elements)
    elem_metrics = {"f1": 0.0, "precision": 0.0, "recall": 0.0, "total_gt": 0, "total_pred": 0}
    if collect_all_elements and evaluate_elements:
        try:
            gt_elems = collect_all_elements(gt_data.get("outlines", []))
            pred_elems = collect_all_elements(pred_data.get("outlines", []))
            if gt_elems or pred_elems:
                el_res = evaluate_elements(gt_elems, pred_elems, res.get("matched_nodes", []))
                elem_metrics = {
                    "f1": el_res.get("f1", 0.0),
                    "precision": el_res.get("precision", 0.0),
                    "recall": el_res.get("recall", 0.0),
                    "total_gt": len(gt_elems),
                    "total_pred": len(pred_elems),
                    "tp": el_res.get("tp", 0),
                    "fn": el_res.get("fn", 0),
                    "fp": el_res.get("fp", 0),
                }
        except Exception as e:
            logger.warning("Failed to evaluate elements: %s", e)

    return {
        "f1": res.get("f1", 0.0),
        "precision": res.get("precision", 0.0),
        "recall": res.get("recall", 0.0),
        "path_accuracy": res.get("avg_path_accuracy", 0.0),
        "total_gt": len(gt_flat),
        "total_pred": len(pred_flat),
        "tp": res.get("tp", 0),
        "fn": res.get("fn", 0),
        "fp": res.get("fp", 0),
        "matched_gt_ids": matched_gt_ids,
        "matched_pred_ids": matched_pred_ids,
        "missed_samples": res.get("missed_outlines", []),
        "excess_samples": res.get("excess_outlines", []),
        "elements": elem_metrics,
    }


@app.get("/api/document-data")
async def get_document_data(doc: str = "11월_디딤돌_회의록"):
    """선택된 문서의 Ground Truth, V2 예측 결과, 정밀 지표 반환."""
    # 1. Ground Truth 로드 및 elements 결합
    gt_file = V1_DIR / "02.ground_truth" / doc / "expected_outlines.json"
    gt_data: Dict[str, Any] = {"document_title": f"{doc}.pdf", "outlines": []}
    if gt_file.exists():
        try:
            gt_data = json.loads(gt_file.read_text(encoding="utf-8"))
            bind_gt_elements(gt_data, doc)
        except Exception as e:
            logger.warning("Failed to load GT file: %s", e)

    # 2. V2 예측 결과 로드
    v2_file = V2_DIR / "staging" / "step1_outline" / f"output_{doc}.json"
    pred_data: Dict[str, Any] = {"document_title": f"{doc}.pdf", "outlines": []}
    if v2_file.exists():
        try:
            pred_data = json.loads(v2_file.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("Failed to load V2 file: %s", e)
    else:
        # Fallback to V1
        v1_file = V1_DIR / "06.staging" / "step1_outline" / f"output_{doc}.json"
        if v1_file.exists():
            try:
                pred_data = json.loads(v1_file.read_text(encoding="utf-8"))
            except Exception:
                pass

    # V2 트리의 노드 type 기본값 보정 (type이 누락된 경우 elements 또는 자식 여부 기준)
    def normalize_types(nodes: List[Dict[str, Any]]):
        for n in nodes:
            if not n.get("type"):
                elems = n.get("elements", [])
                if elems and isinstance(elems, list) and len(elems) > 0 and elems[0].get("type"):
                    n["type"] = elems[0]["type"]
                elif n.get("children"):
                    n["type"] = "header"
                else:
                    n["type"] = "key_value"
            normalize_types(n.get("children", []))

    normalize_types(pred_data.get("outlines", []))

    # 3. 벤치마크 리포트에서 텔레메트리(지연시간, 토큰) 조회
    telemetry = {"latency": 0.0, "tokens": 0}
    report_json = V2_DIR / "benchmark_report.json"
    if report_json.exists():
        try:
            reports = json.loads(report_json.read_text(encoding="utf-8"))
            for r in reports:
                if r.get("document") == doc:
                    telemetry["latency"] = round(r.get("latency", 0.0), 1)
                    telemetry["tokens"] = r.get("tokens", 0)
                    break
        except Exception:
            pass

    # 4. 정밀 채점
    metrics = calculate_diff_and_metrics(gt_data, pred_data)

    return {
        "document": doc,
        "ground_truth": gt_data,
        "prediction": pred_data,
        "metrics": metrics,
        "telemetry": telemetry,
    }


class SaveGroundTruthRequest(BaseModel):
    document: str
    outlines: Dict[str, Any]


@app.post("/api/save-ground-truth")
async def save_ground_truth(req: SaveGroundTruthRequest):
    """Ground Truth 파일 저장 및 즉시 재채점."""
    gt_dir = V1_DIR / "02.ground_truth" / req.document
    gt_dir.mkdir(parents=True, exist_ok=True)
    outlines_path = gt_dir / "expected_outlines.json"

    outlines_path.write_text(
        json.dumps(req.outlines, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    logger.info("Saved Ground Truth for %s", req.document)

    # V2 예측 로드 후 즉시 새 메트릭 계산
    v2_file = V2_DIR / "staging" / "step1_outline" / f"output_{req.document}.json"
    pred_data: Dict[str, Any] = {"outlines": []}
    if v2_file.exists():
        try:
            pred_data = json.loads(v2_file.read_text(encoding="utf-8"))
        except Exception:
            pass

    metrics = calculate_diff_and_metrics(req.outlines, pred_data)
    return {"status": "success", "metrics": metrics}


class RunV2Request(BaseModel):
    document: str
    model: str = "gemini-3.8-flash-low"
    effort: str = "low"


@app.post("/api/run-v2")
async def run_v2_pipeline(req: RunV2Request):
    """선택된 문서에 대해 V2 아웃라인 추출 파이프라인 단독 실행 및 즉시 갱신."""
    if not OutlineExtractionStep:
        raise HTTPException(status_code=500, detail="OutlineExtractionStep not loaded.")

    pdf_path = V1_DIR / "01.dataset" / "raw" / f"{req.document}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF not found: {pdf_path}")

    step = OutlineExtractionStep()
    res = step.execute(pdf_path=pdf_path, model=req.model, effort=req.effort)

    if not res.get("success"):
        raise HTTPException(
            status_code=502, detail=res.get("error", "Extraction failed")
        )

    pred_data = res.get("data", {})
    telemetry = {
        "latency": res.get("telemetry", {}).get("cli_duration", 0.0),
        "tokens": res.get("telemetry", {}).get("tokens", {}).get("total", 0),
    }

    # Ground Truth 로드 및 즉시 채점
    gt_file = V1_DIR / "02.ground_truth" / req.document / "expected_outlines.json"
    gt_data: Dict[str, Any] = {"outlines": []}
    if gt_file.exists():
        try:
            gt_data = json.loads(gt_file.read_text(encoding="utf-8"))
        except Exception:
            pass

    metrics = calculate_diff_and_metrics(gt_data, pred_data)

    return {
        "status": "success",
        "prediction": pred_data,
        "metrics": metrics,
        "telemetry": telemetry,
    }


class RunJudgeRequest(BaseModel):

    document: str


@app.post("/api/run-judge")
async def run_judge_evaluation(req: RunJudgeRequest):
    """선택된 문서의 V2 예측 결과에 대해 LLM-as-a-Judge 인지적 채점 실행."""
    if not OutlineLLMJudge:
        raise HTTPException(status_code=500, detail="OutlineLLMJudge module not loaded.")

    pdf_path = V1_DIR / "01.dataset" / "raw" / f"{req.document}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail=f"PDF not found: {pdf_path}")

    v2_file = V2_DIR / "staging" / "step1_outline" / f"output_{req.document}.json"
    if not v2_file.exists():
        raise HTTPException(status_code=404, detail=f"V2 prediction not found for: {req.document}")

    pred_data = json.loads(v2_file.read_text(encoding="utf-8"))
    judge = OutlineLLMJudge()
    res = judge.evaluate(pdf_path, pred_data)
    if not res.get("success"):
        raise HTTPException(status_code=502, detail=res.get("error", "Judge evaluation failed"))
    return res


if __name__ == "__main__":

    import uvicorn

    print("=" * 64)
    print("  [*] VibePatchNote — LLM Tuning Studio (v2)")
    print("  [*] URL: http://localhost:8088")
    print("=" * 64)
    uvicorn.run(app, host="127.0.0.1", port=8088, log_level="info")
