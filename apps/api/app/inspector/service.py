"""Inspector 조회 서비스 (Data 수명주기 헌법 준수)."""
from __future__ import annotations

import ast
import json
import logging
import shutil
from pathlib import Path
from typing import Any, Optional

from agent_telemetry.contracts import SpanUsage, usage_to_product_dict

from app.core.config import settings
from app.core.storage.paths import safe_segment
from app.inspector.schemas import (
    MatrixModelInfo,
    MatrixResponse,
    RunDetailResponse,
    RunSummaryResponse,
    SourceCodeResponse,
)

logger = logging.getLogger(__name__)


def _usage_of(meta: dict[str, Any]) -> dict[str, int]:
    """`meta.json` 의 사용량을 **제품 어휘** 딕셔너리로 돌려준다.

    호출부가 `meta.get("prompt_tokens")` 처럼 남의 어휘를 직접 추측하면
    호출부 수만큼 틀릴 기회가 생긴다 — 실제로 그래서 토큰·캐시가 전부 0 으로
    표시됐다. 어휘 변환은 `agent_telemetry.contracts.usage` 한 곳만 안다.

    정본: `.agents/rules/60-data/observability.md` §3-2
    """
    raw = meta.get("usage")
    if isinstance(raw, dict) and raw:
        # 생산자가 쓴 공급자 어휘 블록. 이것이 정상 경로다.
        span_usage = SpanUsage.model_validate(raw)
    else:
        # `usage` 블록이 없던 시절의 run. 평면 키에서 복원한다.
        span_usage = SpanUsage(
            prompt_tokens=int(meta.get("prompt_tokens") or 0),
            completion_tokens=int(meta.get("completion_tokens") or 0),
            total_tokens=int(meta.get("total_tokens") or 0),
        )
    return usage_to_product_dict(span_usage)


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

                usage = _usage_of(meta)
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
                                    l_entry = json.loads(l_line)
                                    l_data = l_entry.get("data", {})
                                    meta_data = l_data.get("metadata", {}) or {}
                                    candidate = (
                                        l_data.get("provider")
                                        or meta_data.get("extra", {}).get("provider")
                                        or meta_data.get("provider")
                                    )
                                    if candidate and candidate != "unknown":
                                        prov = candidate
                                        if not mod:
                                            mod = l_data.get("model_name") or meta_data.get("model_name") or meta_data.get("extra", {}).get("model")
                                        break
                        except Exception:
                            pass

                # 여전히 provider가 없으나 모델이 명시된 경우 모델명 기반 자동 판정
                if not prov and mod:
                    mod_lower = str(mod).lower()
                    if "low" in mod_lower or "cli" in mod_lower or "agy" in mod_lower:
                        prov = "agy_cli"
                    elif "local" in mod_lower or "gemma" in mod_lower:
                        prov = "local"
                    else:
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
                        total_tokens=usage["total_tokens"],
                        input_tokens=usage["input_tokens"],
                        output_tokens=usage["output_tokens"],
                        thinking_tokens=usage["thinking_tokens"],
                        cache_read_tokens=usage["cache_read_tokens"],
                        # ModelSpec 에 단가 축이 없어 USD 비용은 시스템 어디에도 없다.
                        # 0.0 으로 내보내면 "무료"라는 거짓말이 된다.
                        cost_usd=None,
                        created_at=meta.get("start_time", ""),
                        primary_provider=prov,
                        primary_model=mod,
                        spans_count=int(meta.get("spans_count") or len(spans)),
                        snapshots_count=int(meta.get("snapshots_count") or snapshots_count),
                        has_span_detail=(run_path / "ledger.jsonl").exists(),
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

    def delete_run(self, run_id: str) -> bool:
        """지정된 run_id의 런 디렉터리를 안전하게 삭제합니다."""
        if not run_id:
            return False

        try:
            safe_id = safe_segment(run_id)
        except Exception:
            return False

        run_path = self.runs_dir / safe_id
        if not run_path.exists() or not run_path.is_dir():
            return False

        try:
            shutil.rmtree(run_path)
            logger.info("[InspectorService] Run 삭제 완료: %s", safe_id)
            return True
        except Exception as e:
            logger.error("[InspectorService] Run 삭제 실패 (%s): %s", safe_id, e)
            return False

    def get_source_code(
        self,
        file_path: str,
        symbol: Optional[str] = None,
    ) -> Optional[SourceCodeResponse]:
        """지정된 파일 경로 및 심볼의 원본 소스 코드/프롬프트를 안전하게 추출합니다."""
        if not file_path:
            return None

        repo_root = settings.base_dir.parents[1].resolve()
        clean_path = file_path.strip().replace("\\", "/")

        # 레거시 별칭 및 오타 매핑 보정
        path_aliases = {
            "local_artifact_repository.py": "apps/api/app/documents/adapters/local_document_artifact_repository.py",
            "apps/api/app/scaffolds/adapters/local_artifact_repository.py": "apps/api/app/documents/adapters/local_document_artifact_repository.py",
        }
        if clean_path in path_aliases:
            clean_path = path_aliases[clean_path]
        elif Path(clean_path).name in path_aliases:
            clean_path = path_aliases[Path(clean_path).name]

        if symbol and "LocalArtifactRepository" in symbol:
            symbol = symbol.replace("LocalArtifactRepository", "LocalDocumentArtifactRepository")

        # 1. 경로 후보군 수집
        raw_candidates = [
            repo_root / clean_path,
            repo_root / "apps" / clean_path,
            repo_root / "packages" / clean_path,
            repo_root / "apps" / "api" / clean_path,
            repo_root / "packages" / "scaffold-engine" / clean_path,
            repo_root / "packages" / "agent-telemetry" / clean_path,
        ]

        file_candidates: list[Path] = []
        for cand in raw_candidates:
            if cand.is_file() and cand not in file_candidates:
                file_candidates.append(cand)

        fname = Path(clean_path).name
        if fname:
            for sub in ("packages", "apps"):
                for m in (repo_root / sub).glob(f"**/{fname}"):
                    if m.is_file() and m not in file_candidates:
                        file_candidates.append(m)

        if not file_candidates:
            return None

        # 서브패스 매칭 및 파일 크기(구현체 우선) 역순 정렬
        file_candidates.sort(
            key=lambda p: (
                1 if clean_path in str(p).replace("\\", "/") else 0,
                p.stat().st_size,
            ),
            reverse=True,
        )

        target_file: Optional[Path] = None
        extracted_content: Optional[str] = None
        start_line = 1
        end_line = 1
        total_lines = 1
        language = "text"

        for cand in file_candidates:
            resolved = cand.resolve()
            if not resolved.is_relative_to(repo_root):
                continue

            try:
                raw_text = resolved.read_text(encoding="utf-8")
            except Exception:
                continue

            lines = raw_text.splitlines()
            c_total = len(lines)
            ext = resolved.suffix.lower()

            lang_map = {
                ".py": "python",
                ".md": "markdown",
                ".json": "json",
                ".toml": "toml",
                ".ts": "typescript",
                ".tsx": "typescript",
                ".js": "javascript",
                ".jsx": "javascript",
            }
            c_lang = lang_map.get(ext, "text")

            if ext == ".py" and symbol:
                clean_sym = symbol.strip()
                sym_parts = clean_sym.split(".")
                found_node = None
                try:
                    tree = ast.parse(raw_text)
                    if len(sym_parts) == 1:
                        target_name = sym_parts[0]
                        for node in ast.walk(tree):
                            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                                if node.name == target_name:
                                    found_node = node
                                    break
                    elif len(sym_parts) >= 2:
                        cls_name, method_name = sym_parts[0], sym_parts[1]
                        for node in ast.walk(tree):
                            if isinstance(node, ast.ClassDef) and node.name == cls_name:
                                for sub_node in node.body:
                                    if isinstance(sub_node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                                        if sub_node.name == method_name:
                                            found_node = sub_node
                                            break
                                if not found_node:
                                    found_node = node
                                break
                except Exception:
                    pass

                if found_node:
                    target_file = resolved
                    start_line = found_node.lineno
                    end_line = getattr(found_node, "end_lineno", c_total)
                    extracted_content = "\n".join(lines[start_line - 1:end_line])
                    total_lines = c_total
                    language = c_lang
                    break
            else:
                if not target_file:
                    target_file = resolved
                    start_line = 1
                    end_line = c_total
                    total_lines = c_total
                    extracted_content = raw_text
                    language = c_lang
                    if not symbol:
                        break

        if not target_file or extracted_content is None:
            # fallback to first readable candidate
            target_file = file_candidates[0].resolve()
            raw_text = target_file.read_text(encoding="utf-8")
            lines = raw_text.splitlines()
            start_line = 1
            end_line = len(lines)
            total_lines = len(lines)
            extracted_content = raw_text
            language = "python" if target_file.suffix == ".py" else "text"

        rel_path = str(target_file.relative_to(repo_root)).replace("\\", "/")

        return SourceCodeResponse(
            file_path=rel_path,
            symbol=symbol,
            content=extracted_content,
            start_line=start_line,
            end_line=end_line,
            total_lines=total_lines,
            language=language,
        )

