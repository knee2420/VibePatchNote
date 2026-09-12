"""Inspector 조회 서비스 (Data 수명주기 헌법 준수)."""
from __future__ import annotations

import ast
import importlib.util
import json
import logging
import shutil
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Optional

from agent_telemetry.contracts import (
    SpanSource,
    SpanUsage,
    StageSnapshotRecord,
    usage_from_product_dict,
    usage_to_product_dict,
)
from pydantic import ValidationError

from app.core.agent_runtime.repository import LocalAgentRunRepository
from app.core.config import settings
from app.core.storage.paths import safe_segment
from app.core.storage.payloads import read_payload
from app.inspector.schemas import (
    MatrixModelInfo,
    MatrixResponse,
    RunDetailResponse,
    RunSummaryResponse,
    SourceCodeResponse,
    WorkflowInfo,
    WorkflowStageInfo,
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

        # 스냅샷은 계약(`StageSnapshotRecord`) 그대로 돌려준다.
        #
        # 예전에는 `{stage_name: data}` 딕셔너리로 납작하게 만들면서 `stage_id` 와
        # 순서를 잃었고, 게다가 계약에 없는 `data` 키를 읽어서 **값이 전부 None**
        # 이었다. 프론트가 이것을 렌더한 적이 없어 아무도 몰랐다.
        snapshots: list[StageSnapshotRecord] = []
        snapshots_file = run_path / "snapshots.json"
        if snapshots_file.exists():
            try:
                raw_snaps = json.loads(snapshots_file.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                logger.warning("[Inspector] snapshots.json 해석 실패 (%s): %s", run_id, exc)
                raw_snaps = []

            # 옛 기록은 `{stage_name: payload}` 딕셔너리일 수 있다.
            if isinstance(raw_snaps, dict):
                raw_snaps = [
                    {"stage_id": name, "stage_name": name, "payload": payload}
                    for name, payload in raw_snaps.items()
                ]

            for item in raw_snaps if isinstance(raw_snaps, list) else []:
                try:
                    snapshots.append(StageSnapshotRecord.model_validate(item))
                except ValidationError:
                    # 한 건이 깨져도 나머지는 보여준다. 관측 도구는 깨진 데이터를
                    # 보여주는 것이 일이다.
                    logger.info("[Inspector] 해석할 수 없는 스냅샷을 건너뜁니다 (%s)", run_id)

        return RunDetailResponse(
            meta=meta,
            spans=spans,
            snapshots=snapshots,
        )

    def get_payload(self, run_id: str, digest: str) -> Optional[str]:
        """포인터가 가리키는 대용량 본문을 돌려준다.

        상세 응답에 본문을 다시 끼워 넣지 않는 이유는 그러면 응답이 다시
        수 MB 가 되기 때문이다. 소비자는 카드를 펼칠 때만 이것을 부른다.
        """
        try:
            safe_id = safe_segment(run_id)
        except Exception:
            return None
        return read_payload(self.runs_dir / safe_id, digest)


    # ── 워크플로우 카탈로그 ──────────────────────────────────────

    #: 한 워크플로우당 구조를 도출할 때 훑을 최근 run 수.
    #: 전부 훑으면 run 이 쌓일수록 느려지고, 얻는 정보는 늘지 않는다.
    WORKFLOW_SAMPLE_RUNS = 20

    def list_workflows(self) -> list[WorkflowInfo]:
        """시스템이 실행한 적 있는 워크플로우와 그 단계 구조를 반환합니다.

        **손으로 쓴 매니페스트가 아니라 기록된 실행에서 도출한다.**

        매니페스트를 따로 관리하면, 방금 없앤 하드코딩이 다른 형태로 돌아온다 —
        파이프라인이 바뀌어도 매니페스트는 안 바뀌고, 어긋나도 아무도 모른다.
        실행 기록은 정의상 최신이고, 계측이 정확하면 이것도 정확하다.

        요구사항 정본: REQ-06 FR-01(단계별 계약), FR-05(워크플로우 카탈로그).
        """
        if not self.runs_dir.exists():
            return []

        # 1. run 을 워크플로우별로 모은다. 최신순으로 본다.
        grouped: dict[str, list[tuple[Path, dict[str, Any]]]] = defaultdict(list)
        for run_path in self.runs_dir.iterdir():
            if not run_path.is_dir():
                continue
            meta_file = run_path / "meta.json"
            if not meta_file.exists():
                continue
            try:
                meta = json.loads(meta_file.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if not isinstance(meta, dict):
                continue
            name = str(meta.get("workflow_name") or meta.get("pipeline_name") or "").strip()
            if not name:
                continue
            grouped[name].append((run_path, meta))

        workflows: list[WorkflowInfo] = []
        for name, entries in grouped.items():
            entries.sort(key=lambda item: str(item[1].get("start_time") or ""), reverse=True)
            workflows.append(self._describe_workflow(name, entries))

        workflows.sort(key=lambda w: w.last_run_at, reverse=True)
        return workflows

    def _describe_workflow(
        self,
        name: str,
        entries: list[tuple[Path, dict[str, Any]]],
    ) -> WorkflowInfo:
        newest_meta = entries[0][1]

        models: list[str] = []
        status_counts: Counter[str] = Counter()
        for _, meta in entries:
            model = meta.get("primary_model")
            if model and model not in models:
                models.append(str(model))
            recorded = str(meta.get("status") or "unknown").lower()
            status_counts[_SPAN_TO_RUN_STATUS.get(recorded, recorded)] += 1

        # 2. 최근 run 들의 스팬을 모아 단계 구조를 만든다.
        durations: dict[str, list[float]] = defaultdict(list)
        first_seen: dict[str, dict[str, Any]] = {}
        order: list[str] = []
        seen_runs: Counter[str] = Counter()

        for run_path, _ in entries[: self.WORKFLOW_SAMPLE_RUNS]:
            spans = self._read_spans(run_path)
            names_in_run: set[str] = set()
            for span in spans:
                span_name = str(span.get("name") or "")
                if not span_name:
                    continue
                if span_name not in first_seen:
                    first_seen[span_name] = span
                    order.append(span_name)
                durations[span_name].append(float(span.get("duration_ms") or 0.0))
                names_in_run.add(span_name)
            for span_name in names_in_run:
                seen_runs[span_name] += 1

        stages: list[WorkflowStageInfo] = []
        for span_name in order:
            span = first_seen[span_name]
            samples = sorted(durations[span_name])
            stages.append(
                WorkflowStageInfo(
                    name=span_name,
                    display_label=str(span.get("display_label") or ""),
                    description=str(span.get("description") or ""),
                    span_type=str(span.get("span_type") or "chain"),
                    phase=span.get("phase"),
                    seen_in_runs=seen_runs[span_name],
                    median_duration_ms=samples[len(samples) // 2] if samples else 0.0,
                    sources=[
                        SpanSource.model_validate(src)
                        for src in (span.get("sources") or [])
                        if isinstance(src, dict)
                    ],
                )
            )

        return WorkflowInfo(
            workflow_name=name,
            workflow_label=str(newest_meta.get("workflow_label") or ""),
            domain=str(newest_meta.get("domain") or "documents"),
            pipeline_name=str(newest_meta.get("pipeline_name") or ""),
            run_count=len(entries),
            last_run_at=str(newest_meta.get("start_time") or ""),
            models=models,
            status_counts=dict(status_counts),
            stages=stages,
        )

    @staticmethod
    def _read_spans(run_path: Path) -> list[dict[str, Any]]:
        """원장에서 스팬 레코드만 뽑는다. 없으면 빈 목록이다."""
        ledger = run_path / "ledger.jsonl"
        if not ledger.is_file():
            return []
        spans: list[dict[str, Any]] = []
        try:
            raw = ledger.read_text(encoding="utf-8")
        except OSError:
            return []
        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(entry, dict) and entry.get("event_type") == "span":
                data = entry.get("data")
                if isinstance(data, dict):
                    spans.append(data)
        return spans

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

    # ── 소스 조회 ────────────────────────────────────────────────

    #: 확장자 → 표시 언어.
    _LANGUAGES = {
        ".py": "python",
        ".md": "markdown",
        ".json": "json",
        ".toml": "toml",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".js": "javascript",
        ".jsx": "javascript",
    }

    #: 저장소 안이라도 여기 있는 파일은 우리 코드가 아니다.
    _EXCLUDED_PARTS = frozenset({"venv", "node_modules", ".venv", "site-packages", "dist", ".turbo"})

    @property
    def _repo_root(self) -> Path:
        return settings.base_dir.parents[1].resolve()

    def get_source_code(
        self,
        file_path: Optional[str] = None,
        symbol: Optional[str] = None,
        module: Optional[str] = None,
    ) -> Optional[SourceCodeResponse]:
        """지정된 코드 지점의 원본을 반환합니다.

        **탐색하지 않는다.** `module` 은 `importlib` 이 정확히 한 파일로
        해석하고, `file_path` 는 저장소 루트 기준 정확 경로로만 받는다.

        예전에는 파일명(basename)으로 `apps/**` 와 `packages/**` 를 전수 glob 한 뒤
        **파일 크기 내림차순**으로 골랐다. 그래서

            요청: packages/scaffold-engine/.../outline/schema.py   (존재하지 않는 경로)
            반환: apps/api/venv/Lib/site-packages/pydantic/v1/schema.py  (47KB 라서 1등)

        이 되었고, 이 노드는 모든 run 의 검증 스팬에 있었다. 실측 비용도
        요청당 1.4초였다 — node_modules 와 venv 를 매번 훑었기 때문이다.
        """
        target = self._resolve_module(module) if module else self._resolve_path(file_path)
        if target is None:
            return None

        try:
            raw_text = target.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            logger.warning("[Inspector] 소스를 읽지 못했습니다 (%s): %s", target, exc)
            return None

        lines = raw_text.splitlines()
        language = self._LANGUAGES.get(target.suffix.lower(), "text")

        start_line, end_line, content = 1, len(lines), raw_text
        if symbol and target.suffix.lower() == ".py":
            extracted = self._extract_symbol(raw_text, symbol)
            if extracted is None:
                # 심볼을 못 찾으면 파일 전체를 준다. 다만 조용히 넘어가지 않는다 —
                # 심볼 이름이 바뀌었다는 신호이기 때문이다.
                logger.info("[Inspector] 심볼을 찾지 못해 파일 전체를 반환합니다: %s::%s", target.name, symbol)
            else:
                start_line, end_line, content = extracted

        return SourceCodeResponse(
            file_path=target.relative_to(self._repo_root).as_posix(),
            symbol=symbol,
            content=content,
            start_line=start_line,
            end_line=end_line,
            total_lines=len(lines),
            language=language,
        )

    def _resolve_module(self, module: str) -> Optional[Path]:
        """import 가능한 이름을 파일 하나로 해석한다. 추측하지 않는다."""
        if not module or not all(part.isidentifier() for part in module.split(".")):
            return None
        try:
            spec = importlib.util.find_spec(module)
        except (ImportError, ValueError, AttributeError) as exc:
            logger.info("[Inspector] 모듈을 찾지 못했습니다 (%s): %s", module, exc)
            return None
        if spec is None or not spec.origin:
            return None
        return self._accept(Path(spec.origin))

    def _resolve_path(self, file_path: Optional[str]) -> Optional[Path]:
        """저장소 루트 기준 **정확 경로**만 받는다."""
        if not file_path:
            return None
        clean = file_path.strip().replace("\\", "/").lstrip("/")
        if not clean:
            return None
        return self._accept(self._repo_root / clean)

    def _accept(self, candidate: Path) -> Optional[Path]:
        """저장소 안의 우리 코드일 때만 통과시킨다."""
        try:
            resolved = candidate.resolve()
        except OSError:
            return None

        root = self._repo_root
        if not resolved.is_relative_to(root):
            # 경로 탈출이거나 site-packages 다. 어느 쪽이든 보여줄 것이 아니다.
            return None
        if self._EXCLUDED_PARTS & set(resolved.relative_to(root).parts):
            return None
        if not resolved.is_file():
            return None
        return resolved

    @staticmethod
    def _extract_symbol(raw_text: str, symbol: str) -> Optional[tuple[int, int, str]]:
        """`Class.method` 또는 `name` 을 AST 로 정확히 잘라낸다."""
        parts = [p for p in symbol.strip().split(".") if p]
        if not parts:
            return None
        try:
            tree = ast.parse(raw_text)
        except SyntaxError:
            return None

        definitions = (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
        node: Optional[ast.AST] = None

        if len(parts) == 1:
            for candidate in ast.walk(tree):
                if isinstance(candidate, definitions) and candidate.name == parts[0]:
                    node = candidate
                    break
        else:
            cls_name, member = parts[0], parts[1]
            for candidate in ast.walk(tree):
                if isinstance(candidate, ast.ClassDef) and candidate.name == cls_name:
                    node = candidate  # 멤버를 못 찾으면 클래스 전체가 답이다.
                    for child in candidate.body:
                        if isinstance(child, definitions) and child.name == member:
                            node = child
                            break
                    break

        if node is None:
            return None

        start = getattr(node, "lineno", 1)
        end = getattr(node, "end_lineno", None) or len(raw_text.splitlines())
        body = "\n".join(raw_text.splitlines()[start - 1:end])
        return start, end, body
