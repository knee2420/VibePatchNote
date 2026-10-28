"""Inspector 조회 서비스.

관측 콘솔이 읽는 세 층을 조인해 화면 계약으로 옮긴다
(`.agents/rules/60-data/observability.md` §2).

    실행 상태  events.jsonl   run 의 존재와 생애주기. **목록의 정본**
    비용       월별 원장       토큰·모델. 정산의 정본
    단계 상세  ledger.jsonl   스팬. 없을 수 있고, 없어도 정상이다

**이 서비스는 경로도 파일 이름도 모른다.** 어디에 무엇이 들어 있는지는
`adapters/` 가 알고, 무엇을 물어볼 수 있는지는 `ports.py` 가 정한다.
"""
from __future__ import annotations

import logging
from collections import Counter, defaultdict
from typing import Any, Optional

from agent_telemetry.contracts import (
    SpanSource,
    SpanUsage,
    StageSnapshotRecord,
    usage_from_product_dict,
    usage_to_product_dict,
)
from pydantic import ValidationError

from app.inspector.ports import (
    ModelMatrixPort,
    RunArchivePort,
    SourceArchivePort,
    TargetNamePort,
)
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


class InspectorService:
    """기록된 실행을 관측 콘솔의 계약으로 옮긴다."""

    #: 한 워크플로우당 구조를 도출할 때 훑을 최근 run 수.
    #: 전부 훑으면 run 이 쌓일수록 느려지고, 얻는 정보는 늘지 않는다.
    WORKFLOW_SAMPLE_RUNS = 20

    def __init__(
        self,
        runs: RunArchivePort,
        target_names: TargetNamePort,
        sources: SourceArchivePort,
        matrix: ModelMatrixPort,
    ) -> None:
        self._runs = runs
        self._target_names = target_names
        self._sources = sources
        self._matrix = matrix

    # ── 실행 목록 ────────────────────────────────────────────────

    def list_runs(self, limit: int = 50, doc_id: Optional[str] = None) -> list[RunSummaryResponse]:
        """저장된 전체 Run 목록을 최신순으로 반환합니다.

        예전에는 `meta.json` 있는 디렉터리만 목록에 올렸다. `meta.json` 은
        텔레메트리의 요약 파생이므로, 계측되지 않은 실행은 **존재하지 않는 것**이
        되었다 — 실제로 54건 중 37건이 화면에서 사라져 있었고 그중에는 TIMEOUT 과
        FAILED 도 있었다. 관측 도구가 가장 보여줘야 할 기록이다.
        """
        ledger = self._runs.ledger_by_run()

        summaries: list[RunSummaryResponse] = []
        for run_id in self._runs.list_run_ids():
            try:
                summary = self._summarize(run_id, ledger.get(run_id, {}))
            except Exception as exc:
                # 한 건이 깨졌다고 목록 전체를 잃지 않는다.
                logger.warning("[Inspector] run 요약 실패 (%s): %s", run_id, exc)
                continue
            if summary is None:
                continue
            if doc_id and summary.doc_id != doc_id:
                continue
            summaries.append(summary)

        summaries.sort(key=lambda x: x.created_at, reverse=True)
        return summaries[:limit]

    def _summarize(self, run_id: str, entry: dict[str, Any]) -> Optional[RunSummaryResponse]:
        """한 run 을 세 층에서 모아 요약한다."""
        # ── 1층: 실행 상태 (정본) ──────────────────────────────
        lifecycle = self._runs.lifecycle(run_id)

        # ── 2층: 단계 상세 (선택) ──────────────────────────────
        meta = self._runs.meta(run_id)

        # 둘 다 없으면 run 이 아니다. 빈 디렉터리이거나 다른 무언가다.
        if lifecycle is None and not meta:
            return None

        # ── 3층: 비용 (정본) ───────────────────────────────────
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
        workflow_name = str(
            meta.get("workflow_name") or (lifecycle.agent_name if lifecycle else "") or task_name
        )
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
            has_span_detail=self._runs.has_span_detail(run_id),
        )

    def _target_name(self, meta: dict[str, Any], run_doc_id: Optional[str]) -> str:
        """작업 대상의 표시 이름.

        텔레메트리가 대상 이름을 남겼으면 그것을 쓴다. 안 남겼을 때만 대상을
        소유한 쪽에 물어본다 — 식별자를 그대로 보여주면 사용자는 어느 문서인지
        알 수 없다.
        """
        recorded = meta.get("target_name")
        if recorded and recorded != run_doc_id:
            return str(recorded)
        if not run_doc_id:
            return ""
        resolved = self._target_names.display_name(run_doc_id)
        return str(resolved or recorded or run_doc_id)

    # ── 실행 상세 ────────────────────────────────────────────────

    def get_run(self, run_id: str) -> Optional[RunDetailResponse]:
        """지정된 run 의 원장과 단계별 스냅샷을 반환합니다."""
        meta = self._runs.meta(run_id)
        if not meta:
            return None

        spans = self._runs.spans(run_id)
        raw_attempts = self._runs.attempts(run_id)

        # 시도 기록이 있고 스팬에 아직 붙어 있지 않으면 llm 스팬에 바인딩한다.
        if raw_attempts:
            for span in spans:
                if span.get("span_type") == "llm" and not span.get("attempts"):
                    span["attempts"] = raw_attempts

        # 스냅샷은 계약(`StageSnapshotRecord`) 그대로 돌려준다.
        #
        # 예전에는 `{stage_name: data}` 딕셔너리로 납작하게 만들면서 `stage_id` 와
        # 순서를 잃었고, 게다가 계약에 없는 `data` 키를 읽어서 **값이 전부 None**
        # 이었다. 프론트가 이것을 렌더한 적이 없어 아무도 몰랐다.
        snapshots: list[StageSnapshotRecord] = []
        for item in self._runs.snapshots(run_id):
            try:
                snapshots.append(StageSnapshotRecord.model_validate(item))
            except ValidationError:
                # 한 건이 깨져도 나머지는 보여준다. 관측 도구는 깨진 데이터를
                # 보여주는 것이 일이다.
                logger.info("[Inspector] 해석할 수 없는 스냅샷을 건너뜁니다 (%s)", run_id)

        return RunDetailResponse(meta=meta, spans=spans, snapshots=snapshots)

    def get_payload(self, run_id: str, digest: str) -> Optional[str]:
        """포인터가 가리키는 대용량 본문을 돌려준다.

        상세 응답에 본문을 다시 끼워 넣지 않는 이유는 그러면 응답이 다시
        수 MB 가 되기 때문이다. 소비자는 카드를 펼칠 때만 이것을 부른다.
        """
        return self._runs.payload(run_id, digest)

    def delete_run(self, run_id: str) -> bool:
        return self._runs.delete(run_id)

    # ── 워크플로우 카탈로그 ──────────────────────────────────────

    def list_workflows(self) -> list[WorkflowInfo]:
        """시스템이 실행한 적 있는 워크플로우와 그 단계 구조를 반환합니다.

        **손으로 쓴 매니페스트가 아니라 기록된 실행에서 도출한다.**

        매니페스트를 따로 관리하면, 방금 없앤 하드코딩이 다른 형태로 돌아온다 —
        파이프라인이 바뀌어도 매니페스트는 안 바뀌고, 어긋나도 아무도 모른다.
        실행 기록은 정의상 최신이고, 계측이 정확하면 이것도 정확하다.

        요구사항 정본: REQ-06 FR-01(단계별 계약), FR-05(워크플로우 카탈로그).
        """
        # 1. run 을 워크플로우별로 모은다. 최신순으로 본다.
        grouped: dict[str, list[tuple[str, dict[str, Any]]]] = defaultdict(list)
        for run_id in self._runs.list_run_ids():
            meta = self._runs.meta(run_id)
            if not meta:
                continue
            name = str(meta.get("workflow_name") or meta.get("pipeline_name") or "").strip()
            if not name:
                continue
            grouped[name].append((run_id, meta))

        workflows: list[WorkflowInfo] = []
        for name, entries in grouped.items():
            entries.sort(key=lambda item: str(item[1].get("start_time") or ""), reverse=True)
            workflows.append(self._describe_workflow(name, entries))

        workflows.sort(key=lambda w: w.last_run_at, reverse=True)
        return workflows

    def _describe_workflow(
        self,
        name: str,
        entries: list[tuple[str, dict[str, Any]]],
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

        for run_id, _ in entries[: self.WORKFLOW_SAMPLE_RUNS]:
            names_in_run: set[str] = set()
            for span in self._runs.spans(run_id):
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

    # ── 모델 매트릭스 ────────────────────────────────────────────

    def get_matrix(self) -> MatrixResponse:
        """현재 등록된 모델 매트릭스 및 라우팅 설정 반환."""
        described = self._matrix.describe()
        return MatrixResponse(
            primary_provider=described["primary_provider"],
            fallback_provider=described["fallback_provider"],
            models=[MatrixModelInfo(**item) for item in described["models"]],
        )

    # ── 소스 조회 ────────────────────────────────────────────────

    def get_source_code(
        self,
        file_path: Optional[str] = None,
        symbol: Optional[str] = None,
        module: Optional[str] = None,
    ) -> Optional[SourceCodeResponse]:
        """지정된 코드 지점의 원본을 반환합니다."""
        found = self._sources.read(file_path=file_path, symbol=symbol, module=module)
        return SourceCodeResponse(**found) if found else None
