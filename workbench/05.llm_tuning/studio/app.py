"""
VibePatchNote — LLM Tuning Studio Backend
본 프로젝트(apps/web, apps/api)와 100% 분리되어 로컬 8088 포트에서 구동되는 독립형 튜닝/평가 서버입니다.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from pathlib import Path
import json
import logging
import sys

# 윈도우 콘솔 UTF-8 강제
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

# 프로젝트 루트 경로 등록 (AntigravityAgent 재사용 목적)
STUDIO_DIR = Path(__file__).resolve().parent
TUNING_DIR = STUDIO_DIR.parent
PROJECT_ROOT = TUNING_DIR.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "apps" / "api"))

try:
    from app.core.antigravity import AntigravityAgent
except Exception as e:
    AntigravityAgent = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LLMTuningStudio")

app = FastAPI(title="LLM Tuning Studio", version="1.0.0")

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


@app.get("/api/tasks")
async def get_tasks():
    """사용 가능한 LLM 메인 태스크 목록."""
    return [
        {"id": "01.outline_extraction", "name": "01. 아웃라인 및 5대 컴포넌트 추출", "domain": "apps/api/app/documents/pipeline"},
        {"id": "02.segment_scan", "name": "02. 논리 블록/세그먼트 고속 스캔", "domain": "apps/api/app/documents/prompts.py"},
        {"id": "03.scaffold_generation", "name": "03. Tiptap 서식 및 슬롯 분류", "domain": "packages/scaffold-engine"},
    ]


@app.get("/api/documents")
async def get_documents(task: str = "01.outline_extraction"):
    """선택된 태스크에 등록된 문서 목록 반환."""
    task_dir = TUNING_DIR / task
    docs = set()

    # ground_truth, baselines_raw_llm, dataset/raw 순회
    import re
    for sub in ["02.ground_truth", "03.baselines_raw_llm/gemini-3.5-flash", "01.dataset/raw"]:
        target = task_dir / sub
        if target.exists():
            for item in target.iterdir():
                name = item.stem if item.is_file() else item.name
                normalized = re.sub(r'[\s_]+', '_', name).strip('_')
                docs.add(normalized)

    doc_list = sorted(list(docs))
    if not doc_list:
        doc_list = ["11월_디딤돌_회의록"]
    return {"task": task, "documents": doc_list}


@app.get("/api/document-data")
async def get_document_data(task: str = "01.outline_extraction", doc: str = "11월_디딤돌_회의록"):
    """해당 문서의 Baseline, Ground Truth, Bias Analysis, 텍스트 원문 조회."""
    task_dir = TUNING_DIR / task

    # 1. Baseline (원 LLM AS-IS)
    base_dir = task_dir / "03.baselines_raw_llm" / "gemini-3.5-flash" / doc
    baseline_outlines = {}
    baseline_elements = []
    bias_analysis_md = ""

    if base_dir.exists():
        if (base_dir / "outline_tree.json").exists():
            try:
                baseline_outlines = json.loads((base_dir / "outline_tree.json").read_text(encoding="utf-8"))
            except Exception:
                pass
        if (base_dir / "elements.json").exists():
            try:
                baseline_elements = json.loads((base_dir / "elements.json").read_text(encoding="utf-8"))
            except Exception:
                pass
        if (base_dir / "bias_analysis.md").exists():
            bias_analysis_md = (base_dir / "bias_analysis.md").read_text(encoding="utf-8")

    # 2. Ground Truth
    gt_dir = task_dir / "02.ground_truth" / doc
    gt_outlines = {}
    gt_elements = []
    if gt_dir.exists():
        if (gt_dir / "expected_outlines.json").exists():
            try:
                gt_outlines = json.loads((gt_dir / "expected_outlines.json").read_text(encoding="utf-8"))
            except Exception:
                pass
        if (gt_dir / "expected_elements.json").exists():
            try:
                gt_elements = json.loads((gt_dir / "expected_elements.json").read_text(encoding="utf-8"))
            except Exception:
                pass

    # 만약 GT가 비어있다면 베이스라인 내용을 기본 템플릿으로 제공
    if not gt_outlines and baseline_outlines:
        gt_outlines = baseline_outlines
    if not gt_elements and baseline_elements:
        gt_elements = baseline_elements

    # 3. 기본 추천 프롬프트 템플릿
    default_prompt = (
        "당신은 고정밀 비즈니스 문서 구조화 전문가입니다.\n"
        f"문서 '{doc}'의 핵심 목차(Outline Tree)와 주요 안건을 균형 있게 추출하세요.\n\n"
        "[추출 원칙]\n"
        "1. 회의비/영수증 등 단순 지출에 편향되지 말고, 문서에 기재된 주요 기술 논의, 진행 안건, 의결 사항을 빠짐없이 계층적으로 추출하세요.\n"
        "2. Level 1: 문서 대제목 또는 회의 차수(예: 1차 회의, 2차 회의)\n"
        "   Level 2: 회의 일시/장소 기본정보, 기술 논의 안건 상세, 회의비 지출 내역 등\n"
        "3. 각 항목의 page 번호와 비즈니스 목적(purpose)을 구체적으로 서술하세요.\n\n"
        "반드시 지정된 JSON 규격으로만 응답하세요."
    )

    return {
        "task": task,
        "document": doc,
        "baseline": {
            "outlines": baseline_outlines,
            "elements": baseline_elements,
            "bias_analysis": bias_analysis_md,
        },
        "ground_truth": {
            "outlines": gt_outlines,
            "elements": gt_elements,
        },
        "default_prompt": default_prompt,
    }


class SaveGroundTruthRequest(BaseModel):
    task: str = "01.outline_extraction"
    document: str
    outlines: Dict[str, Any]
    elements: List[Dict[str, Any]]


@app.post("/api/save-ground-truth")
async def save_ground_truth(req: SaveGroundTruthRequest):
    """사용자가 UI에서 수정한 Ground Truth 정답셋을 로컬 파일로 저장."""
    gt_dir = TUNING_DIR / req.task / "02.ground_truth" / req.document
    gt_dir.mkdir(parents=True, exist_ok=True)

    outlines_path = gt_dir / "expected_outlines.json"
    elements_path = gt_dir / "expected_elements.json"

    outlines_path.write_text(json.dumps(req.outlines, ensure_ascii=False, indent=2), encoding="utf-8")
    elements_path.write_text(json.dumps(req.elements, ensure_ascii=False, indent=2), encoding="utf-8")

    logger.info("Saved Ground Truth for %s at %s", req.document, gt_dir)
    return {"status": "success", "message": f"Ground Truth for '{req.document}' saved successfully!"}


class RunExperimentRequest(BaseModel):
    task: str = "01.outline_extraction"
    document: str
    model: str = "gemini-3.5-flash"
    prompt: str


@app.post("/api/run-experiment")
async def run_experiment(req: RunExperimentRequest):
    """헤드리스 AntigravityAgent로 프롬프트 튜닝 실험 실행."""
    if not AntigravityAgent:
        raise HTTPException(status_code=500, detail="AntigravityAgent not available in python environment.")

    # 문서 원본 텍스트 추출 또는 기존 베이스라인 참조 컨텍스트 구성
    task_dir = TUNING_DIR / req.task
    doc_text = ""
    raw_md = task_dir / "01.dataset" / "inputs" / f"{req.document}.md"
    if raw_md.exists():
        doc_text = raw_md.read_text(encoding="utf-8")
    else:
        # 베이스라인의 summary나 outline.md 컨텍스트 활용
        base_md = task_dir / "03.baselines_raw_llm" / "gemini-3.5-flash" / req.document / "outline.md"
        if base_md.exists():
            doc_text = base_md.read_text(encoding="utf-8")

    full_prompt = (
        f"{req.prompt}\n\n"
        f"[참조 문서 컨텍스트]\n"
        f"{doc_text[:4000]}\n\n"
        f"반드시 다음 JSON 규격으로만 응답하세요:\n"
        f"{{\n"
        f'  "document_title": "{req.document}",\n'
        f'  "total_pages": 2,\n'
        f'  "outlines": [\n'
        f'    {{\n'
        f'      "id": "out-1",\n'
        f'      "level": 1,\n'
        f'      "title": "섹션 제목",\n'
        f'      "page": 1,\n'
        f'      "purpose": "비즈니스 목적",\n'
        f'      "children": []\n'
        f'    }}\n'
        f'  ]\n'
        f"}}\n"
    )

    logger.info("Executing experiment for %s with model %s", req.document, req.model)
    agent = AntigravityAgent(model=req.model, timeout_seconds=90)
    result = agent.run_json(full_prompt)

    if not result:
        raise HTTPException(status_code=502, detail="LLM execution failed or returned invalid JSON.")

    # 실험 결과 아카이빙 (workbench/05.llm_tuning/01.outline_extraction/04.experiments/)
    exp_dir = task_dir / "04.experiments" / req.document
    exp_dir.mkdir(parents=True, exist_ok=True)
    exp_path = exp_dir / f"result_{req.model}.json"
    exp_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "status": "success",
        "model": req.model,
        "result": result,
        "saved_path": str(exp_path),
    }


class EvaluateRequest(BaseModel):
    ground_truth_outlines: List[Dict[str, Any]]
    predicted_outlines: List[Dict[str, Any]]


@app.post("/api/evaluate")
async def evaluate_metrics(req: EvaluateRequest):
    """정답셋 대비 예측 결과의 재현율(Recall) 및 정밀도(Precision) 정량 채점."""
    gt_titles = set()
    def collect_titles(items, target_set):
        for it in items:
            t = it.get("title", "").strip().lower()
            if t:
                target_set.add(t)
            if "children" in it and isinstance(it["children"], list):
                collect_titles(it["children"], target_set)

    collect_titles(req.ground_truth_outlines, gt_titles)
    
    pred_titles = set()
    collect_titles(req.predicted_outlines, pred_titles)

    if not gt_titles:
        return {"recall": 0, "precision": 0, "f1": 0, "matched": [], "missed": []}

    matched = []
    missed = []
    for gt in gt_titles:
        # 부분 일치(유사도) 검사
        found = any(gt in pt or pt in gt for pt in pred_titles)
        if found:
            matched.append(gt)
        else:
            missed.append(gt)

    recall = round(len(matched) / len(gt_titles) * 100, 1)
    precision = round(len(matched) / max(len(pred_titles), 1) * 100, 1)
    f1 = round((2 * recall * precision) / max(recall + precision, 1), 1)

    return {
        "total_gt": len(gt_titles),
        "total_pred": len(pred_titles),
        "matched_count": len(matched),
        "recall": recall,
        "precision": precision,
        "f1": f1,
        "matched_titles": matched,
        "missed_titles": missed,
    }


if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("[*] VibePatchNote LLM Tuning Studio Started")
    print("[*] Studio URL: http://localhost:8088")
    print("=" * 60)
    uvicorn.run(app, host="127.0.0.1", port=8088, log_level="info")
