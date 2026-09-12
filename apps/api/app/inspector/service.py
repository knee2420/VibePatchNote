"""Inspector 조회 서비스 (Data 수명주기 헌법 준수)."""
from __future__ import annotations

import ast
import json
import logging
import shutil
from pathlib import Path
from typing import Any, Optional

from agent_telemetry.contracts import (
    SpanUsage,
    usage_from_product_dict,
    usage_to_product_dict,
)

from app.core.agent_runtime.repository import LocalAgentRunRepository
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

#: 스팬/텔레메트리 어휘(`SpanStatus`) → run 생애주기 어휘(`RunStatus`).
#:
#: 둘은 서로 다른 개념이라 통합하지 않는다 — run 에는 `waiting_*` 이 있고
#: 스팬에는 없다. 다만 **한 목록 안에 두 어휘가 섞이면** 소비자가 양쪽을 모두
#: 비교해야 하고, 한쪽만 맞추면 나머지가 전부 실패로 그려진다.
#: 그래서 run 을 말할 때는 run 어휘로 옮긴다.
#: 정본: `.agents/rules/60-data/observability.md` §3-1
_SPAN_TO_RUN_STATUS = {
    "success": "completed",
    "failed": "failed",
    "running": "running",
    "pending": "queued",
    # 건너뛴 단계도 실행은 끝난 것이다.
    "skipped": "completed",
}


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


class _LedgerIndex:
    """월별 원장을 `run_id` 로 색인한다.

    **비용의 정본은 원장이다** (`observability.md` §2-2). 스팬 `usage` 합산은
    표시용 파생일 뿐이고, 계측되지 않은 파이프라인의 비용은 거기 잡히지 않는다.
    """

    def __init__(self, ledger_dir: Path) -> None:
        self._by_run: dict[str, dict[str, Any]] = {}
        if not ledger_dir.exists():
            return
        for path in sorted(ledger_dir.glob("*.jsonl")):
            try:
                raw = path.read_text(encoding="utf-8")
            except OSError as exc:
                logger.warning("[Inspector] 원장을 읽지 못했습니다 (%s): %s", path.name, exc)
                continue
            for line in raw.splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    continue
                run_id = row.get("run_id")
                if isinstance(run_id, str) and run_id:
                    # 같은 run 이 여러 번 기록됐으면 마지막 줄이 최종이다.
                    self._by_run[run_id] = row

    def get(self, run_id: str) -> dict[str, Any]:
        return self._by_run.get(run_id, {})


class InspectorService:
    def __init__(
        self,
        runs_dir: Optional[Path] = None,
        ledger_dir: Optional[Path] = None,
    ) -> None:
        self.runs_dir = runs_dir or settings.storage.runs
        self.ledger_dir = ledger_dir or settings.storage.ledger

    def list_runs(self, limit: int = 50, doc_id: Optional[str] = None) -> list[RunSummaryResponse]:
        """저장된 전체 Run 목록을 최신순으로 반환합니다.

        세 층을 조인한다 (`.agents/rules/60-data/observability.md` §2).

            실행 상태  events.jsonl   run 의 존재와 생애주기. **목록의 정본**
            비용       월별 원장       토큰·모델. 정산의 정본
            단계 상세  ledger.jsonl   스팬. 없을 수 있고, 없어도 정상이다

        예전에는 `meta.json` 있는 디렉터리만 목록에 올렸다. `meta.json` 은
        텔레메트리의 요약 파생이므로, 계측되지 않은 실행은 **존재하지 않는 것**이
        되었다 — 실제로 54건 중 37건이 화면에서 사라져 있었고 그중에는 TIMEOUT 과
        FAILED 도 있었다. 관측 도구가 가장 보여줘야 할 기록이다.
        """
        if not self.runs_dir.exists():
            return []

        ledger = _LedgerIndex(self.ledger_dir)
        runs = LocalAgentRunRepository(self.runs_dir)

        summaries: list[RunSummaryResponse] = []
        for run_path in self.runs_dir.iterdir():
            if not run_path.is_dir():
                continue
            try:
                summary = self._summarize(run_path, runs, ledger)
            except Exception as exc:
                # 한 건이 깨졌다고 목록 전체를 잃지 않는다.
                logger.warning("[Inspector] run 요약 실패 (%s): %s", run_path.name, exc)
                continue
            if summary is None:
                continue
            if doc_id and summary.doc_id != doc_id:
                continue
            summaries.append(summary)

        summaries.sort(key=lambda x: x.created_at, reverse=True)
        return summaries[:limit]

    def _summarize(
        self,
        run_path: Path,
        runs: LocalAgentRunRepository,
        ledger: _LedgerIndex,
    ) -> Optional[RunSummaryResponse]:
        """한 run 디렉터리를 세 층에서 모아 요약한다."""
        run_id = run_path.name

        # ── 1층: 실행 상태 (정본) ──────────────────────────────
        lifecycle = runs.get(run_id)

        # ── 2층: 단계 상세 (선택) ──────────────────────────────
        meta: dict[str, Any] = {}
        meta_file = run_path / "meta.json"
        if meta_file.exists():
            try:
                loaded = json.loads(meta_file.read_text(encoding="utf-8"))
                if isinstance(loaded, dict):
                    meta = loaded
            except (OSError, json.JSONDecodeError) as exc:
                logger.warning("[Inspector] meta.json 해석 실패 (%s): %s", run_id, exc)

        # 둘 다 없으면 run 이 아니다. 빈 디렉터리이거나 다른 무언가다.
        if lifecycle is None and not meta:
            return None

        # ── 3층: 비용 (정본) ───────────────────────────────────
        entry = ledger.get(run_id)
        cost = entry.get("cost") if isinstance(entry.get("cost"), dict) else {}

        # 토큰은 원장이 정본이다. 다만 원장 항목이 0 만 담고 있고 텔레메트리에
        # 값이 있으면 텔레메트리를 쓴다 — 둘은 같은 실행을 기록하므로,
        # 더 많이 아는 쪽이 맞다. (기록 자체가 0 인 run 도 있어서, 항목의
        # 존재 여부가 아니라 내용이 있는지로 판정해야 한다.)
        ledger_usage = usage_to_product_dict(usage_from_product_dict(cost)) if cost else None
        usage = ledger_usage if ledger_usage and ledger_usage["total_tokens"] else _usage_of(meta)

        # ── 상태 ────────────────────────────────────────────────
        # 생애주기가 정본이다. 없으면 텔레메트리·원장이 남긴 최종 상태를
        # **run 어휘로 옮겨서** 쓴다. 옮기지 않으면 같은 목록 안에서 어떤 행은
        # `completed`, 어떤 행은 `success` 가 되어 소비자가 두 어휘를 모두
        # 비교해야 한다 (observability.md §3-1).
        if lifecycle is not None:
            status = lifecycle.status
        else:
            recorded = str(meta.get("status") or entry.get("status") or "unknown")
            status = _SPAN_TO_RUN_STATUS.get(recorded.lower(), recorded.lower())

        # ── 시각 ────────────────────────────────────────────────
        created_at = ""
        if lifecycle is not None:
            created_at = lifecycle.started_at.isoformat()
        elif meta.get("start_time"):
            created_at = str(meta["start_time"])
        elif entry.get("recorded_at"):
            created_at = str(entry["recorded_at"])

        duration_ms = float(meta.get("total_latency_ms") or 0.0)
        if not duration_ms and entry.get("duration_seconds"):
            duration_ms = float(entry["duration_seconds"]) * 1000.0
        if not duration_ms and lifecycle is not None and lifecycle.finished_at:
            delta = lifecycle.finished_at - lifecycle.started_at
            duration_ms = round(delta.total_seconds() * 1000.0, 2)

        # ── 이름표 ──────────────────────────────────────────────
        # 조회 계층은 도메인을 모른다. 이름은 기록 시점에 정해진 것만 쓴다.
        # 예전에는 `if "outline" in name: "문서 목차 추출"` 로 라벨을 지어냈다.
        task_name = str(
            meta.get("pipeline_name")
            or meta.get("task_name")
            or entry.get("task_name")
            or (lifecycle.agent_name if lifecycle else "")
            or "run"
        )
        workflow_name = str(meta.get("workflow_name") or (lifecycle.agent_name if lifecycle else "") or task_name)
        workflow_label = str(meta.get("workflow_label") or "")

        run_doc_id = (
            meta.get("doc_id")
            or entry.get("doc_id")
            or (lifecycle.doc_id if lifecycle else None)
        )

        return RunSummaryResponse(
            run_id=str(meta.get("run_id") or run_id),
            task_name=task_name,
            domain=str(meta.get("domain") or "documents"),
            workflow_name=workflow_name,
            workflow_label=workflow_label,
            target_name=self._target_name(meta, run_doc_id),
            doc_id=run_doc_id,
            status=status,
            total_duration_ms=duration_ms,
            total_tokens=usage["total_tokens"],
            input_tokens=usage["input_tokens"],
            output_tokens=usage["output_tokens"],
            thinking_tokens=usage["thinking_tokens"],
            cache_read_tokens=usage["cache_read_tokens"],
            # ModelSpec 에 단가 축이 없어 USD 비용은 시스템 어디에도 없다.
            # 0.0 으로 내보내면 "무료"라는 거짓말이 된다 (observability.md §4).
            cost_usd=None,
            created_at=created_at,
            # 공급자·모델은 기록된 것만 쓴다. 모델명으로 공급자를 추측하지 않는다.
            primary_provider=(meta.get("primary_provider") or entry.get("provider") or None),
            primary_model=(
                meta.get("primary_model")
                or (meta.get("provenance") or {}).get("model")
                or entry.get("model")
                or None
            ),
            spans_count=int(meta.get("spans_count") or 0),
            snapshots_count=int(meta.get("snapshots_count") or 0),
            # 상세의 부재는 오류가 아니라 정상 상태다 (observability.md §2-3).
            has_span_detail=(run_path / "ledger.jsonl").exists(),
        )

    @staticmethod
    def _target_name(meta: dict[str, Any], run_doc_id: Optional[str]) -> str:
        """작업 대상의 표시 이름.

        텔레메트리가 대상 이름을 남겼으면 그것을 쓴다. 안 남겼을 때만 문서
        메타에서 원본 파일명을 찾는다 — 식별자를 그대로 보여주면 사용자는
        어느 문서인지 알 수 없다.
        """
        recorded = meta.get("target_name")
        if recorded and recorded != run_doc_id:
            return str(recorded)

        if not run_doc_id:
            return ""

        doc_meta_file = settings.storage.knowledge / "documents" / run_doc_id / "meta.json"
        if not doc_meta_file.exists():
            return str(recorded or run_doc_id)
        try:
            d_meta = json.loads(doc_meta_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return str(recorded or run_doc_id)
        return str(d_meta.get("originalName") or d_meta.get("storedName") or run_doc_id)

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

