"""Inspector 조회 서비스 (Data 수명주기 헌법 준수)."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

from app.core.config import settings
from app.inspector.schemas import (
    MatrixModelInfo,
    MatrixResponse,
    RunDetailResponse,
    RunSummaryResponse,
)

logger = logging.getLogger(__name__)


class InspectorService:
    def __init__(self, runs_dir: Optional[Path] = None) -> None:
        self.runs_dir = runs_dir or settings.storage.runs

    def list_runs(self, limit: int = 50, doc_id: Optional[str] = None) -> list[RunSummaryResponse]:
        """저장된 전체 Run 목록을 최신순으로 반환합니다."""
        if not self.runs_dir.exists():
            return []

        summaries: list[RunSummaryResponse] = []
        for run_path in self.runs_dir.iterdir():
            if not run_path.is_dir():
                continue

            meta_file = run_path / "meta.json"
            if not meta_file.exists():
                continue

            try:
                meta = json.loads(meta_file.read_text(encoding="utf-8"))
                run_doc_id = meta.get("doc_id")
                if doc_id and run_doc_id != doc_id:
                    continue

                usage = meta.get("usage", {})
                spans = meta.get("spans", [])
                snapshots = meta.get("snapshots", {})

                # snapshots.json이 별도로 존재하는 경우 개수 산출
                snapshots_count = len(snapshots)
                snapshots_file = run_path / "snapshots.json"
                if snapshots_file.exists():
                    try:
                        snap_data = json.loads(snapshots_file.read_text(encoding="utf-8"))
                        snapshots_count = max(snapshots_count, len(snap_data))
                    except Exception:
                        pass

                p_name = meta.get("pipeline_name") or meta.get("task_name") or "pipeline"
                p_lower = p_name.lower()
                if "outline" in p_lower:
                    default_label = "\ubb38\uc11c \ubaa9\ucc28 \ucd94\ucd9c"
                elif "scaffold" in p_lower:
                    default_label = "\uc640\uc774\uc5b4\ud504\ub808\uc784 \uc0dd\uc131"
                elif "scan" in p_lower:
                    default_label = "\ubb38\uc11c \ub808\uc774\uc544\uc6c3 \uc2a4\uce94"
                else:
                    default_label = p_name

                w_label = meta.get("workflow_label")
                if not w_label or any(ord(c) == 0xfffd or c == "?" for c in w_label):
                    w_label = default_label

                prov = (
                    meta.get("primary_provider")
                    or meta.get("provenance", {}).get("provider")
                    or meta.get("metadata", {}).get("execution", {}).get("provider")
                )
                mod = (
                    meta.get("primary_model")
                    or meta.get("provenance", {}).get("model")
                    or meta.get("metadata", {}).get("execution", {}).get("model")
                )

                # meta에 provider가 없는 경우 ledger.jsonl에서 탐색
                if not prov:
                    ledger_file = run_path / "ledger.jsonl"
                    if ledger_file.exists():
                        try:
                            for l_line in ledger_file.read_text(encoding="utf-8").splitlines():
                                if '"provider"' in l_line:
                                    l_data = json.loads(l_line).get("data", {})
                                    if "provider" in l_data:
                                        prov = l_data["provider"]
                                        if not mod and "model_name" in l_data:
                                            mod = l_data["model_name"]
                                        break
                        except Exception:
                            pass

                # 여전히 provider가 없으나 모델이 명시된 경우
                if not prov and mod:
                    prov = "google_genai"

                # target_name 유효성 검사 및 실제 문서 원본 파일명 매핑
                t_name = meta.get("target_name")
                if not t_name or any(ord(c) == 0xfffd or c == "?" for c in t_name) or t_name == run_doc_id:
                    if run_doc_id:
                        doc_meta_file = settings.storage.data / "knowledge" / "documents" / run_doc_id / "meta.json"
                        if doc_meta_file.exists():
                            try:
                                d_meta = json.loads(doc_meta_file.read_text(encoding="utf-8"))
                                orig_name = d_meta.get("originalName")
                                if orig_name and not any(ord(c) == 0xfffd or c == "?" for c in orig_name):
                                    t_name = orig_name
                                else:
                                    t_name = d_meta.get("storedName") or run_doc_id
                            except Exception:
                                t_name = run_doc_id
                        else:
                            t_name = run_doc_id
                    else:
                        t_name = ""

                summaries.append(
                    RunSummaryResponse(
                        run_id=meta.get("run_id", run_path.name),
                        task_name=p_name,
                        domain=meta.get("domain") or "documents",
                        workflow_name=meta.get("workflow_name") or p_name,
                        workflow_label=w_label,
                        target_name=t_name,
                        doc_id=run_doc_id,
                        status=meta.get("status", "UNKNOWN"),
                        total_duration_ms=float(meta.get("duration_ms") or meta.get("total_latency_ms") or 0.0),
                        total_tokens=int(usage.get("total_tokens") or meta.get("total_tokens") or 0),
                        input_tokens=int(usage.get("input_tokens") or meta.get("prompt_tokens") or 0),
                        output_tokens=int(usage.get("output_tokens") or meta.get("completion_tokens") or 0),
                        thinking_tokens=int(usage.get("thinking_tokens", 0)),
                        cache_read_tokens=int(usage.get("cache_read_tokens", 0)),
                        cost_usd=float(usage.get("cost_usd", 0.0)),
                        created_at=meta.get("start_time", ""),
                        primary_provider=prov,
                        primary_model=mod,
                        spans_count=int(meta.get("spans_count") or len(spans)),
                        snapshots_count=int(meta.get("snapshots_count") or snapshots_count),
                    )
                )
            except Exception as e:
                logger.warning("Failed to parse run meta at %s: %s", meta_file, e)

        # 최신 생성 시간 역순 정렬
        summaries.sort(key=lambda x: x.created_at, reverse=True)
        return summaries[:limit]

    def get_run(self, run_id: str) -> Optional[RunDetailResponse]:
        """지정된 run_id의 원장과 스냅샷 상세를 반환합니다."""
        run_path = self.runs_dir / run_id
        if not run_path.exists() or not run_path.is_dir():
            return None

        meta_file = run_path / "meta.json"
        if not meta_file.exists():
            return None

        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8"))
        except Exception as e:
            logger.error("Failed to read meta.json for run %s: %s", run_id, e)
            return None

        spans: list[dict[str, Any]] = []
        raw_attempts: list[dict[str, Any]] = []
        ledger_file = run_path / "ledger.jsonl"
        if ledger_file.exists():
            try:
                for line in ledger_file.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line:
                        continue
                    item = json.loads(line)
                    if isinstance(item, dict) and "event_type" in item:
                        if item["event_type"] == "span":
                            spans.append(item["data"])
                        elif item["event_type"] == "attempt":
                            raw_attempts.append(item["data"])
                    else:
                        spans.append(item)
            except Exception as e:
                logger.warning("Error reading ledger.jsonl for run %s: %s", run_id, e)

        # fallback to meta['spans'] if ledger.jsonl is empty
        if not spans and "spans" in meta:
            spans = meta["spans"]

        # 만약 raw_attempts가 있고 span에 attempts가 없으면 llm span에 바인딩
        if raw_attempts:
            for sp in spans:
                if sp.get("span_type") == "llm" and not sp.get("attempts"):
                    sp["attempts"] = raw_attempts

        snapshots: dict[str, Any] = {}
        snapshots_file = run_path / "snapshots.json"
        if snapshots_file.exists():
            try:
                raw_snaps = json.loads(snapshots_file.read_text(encoding="utf-8"))
                if isinstance(raw_snaps, list):
                    for s in raw_snaps:
                        if isinstance(s, dict) and "stage_name" in s:
                            snapshots[s["stage_name"]] = s.get("data")
                elif isinstance(raw_snaps, dict):
                    snapshots = raw_snaps
            except Exception as e:
                logger.warning("Error reading snapshots.json for run %s: %s", run_id, e)

        return RunDetailResponse(
            meta=meta,
            spans=spans,
            snapshots=snapshots,
        )

    def get_matrix(self) -> MatrixResponse:
        """현재 등록된 모델 매트릭스 및 라우팅 설정 반환."""
        from scaffold_engine.harness import MODEL_REGISTRY

        models: list[MatrixModelInfo] = []
        for name, spec in MODEL_REGISTRY.items():
            models.append(
                MatrixModelInfo(
                    name=spec.name,
                    family=spec.family,
                    provider=spec.provider,
                    max_input_tokens=spec.max_input_tokens,
                    max_output_tokens=spec.max_output_tokens,
                    supports_structured_schema=spec.supports_structured_schema,
                    display_name=spec.display_name,
                    description=spec.description,
                    active=True,
                )
            )

        return MatrixResponse(
            primary_provider=settings.primary_provider,
            fallback_provider=settings.fallback_provider,
            models=models,
        )
