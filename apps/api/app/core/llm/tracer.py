"""
LangSmith 사상을 벤치마킹한 LLM 및 도메인 엔진 정밀 관제 트레이서(Tracer).
모든 파이프라인의 실행 과정(I/O, CLI 명령어, 서브프로세스, 세부 단계별 지연 시간, 토큰)을
계층적 Trace / Span 구조로 기록하고 파일에 영속화합니다.

트레이스는 **디버그 자료**다. 프롬프트에 문서 본문이 실리므로 크고 민감하며,
같은 실행의 비용·토큰 집계는 원장(`data/ledger/`)이 따로 갖는다. 그래서 트레이스는
`state/` 에 두고 보존기간이 지나면 정리한다. 앱이 스스로 파일을 회전시키지 않고,
보존정책 한 곳에서 일괄 정리한다.

문서를 삭제하면 그 문서의 트레이스도 함께 지워야 한다. 그러려면 트레이스가
`doc_id` 를 알아야 한다 — 파일명 문자열로는 역추적할 수 없다.
"""
from __future__ import annotations

import contextvars
import json
import logging
import shutil
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# 현재 비동기/스레드 컨텍스트의 활성 Trace 및 Span 추적
_active_trace: contextvars.ContextVar[Optional[LlmTrace]] = contextvars.ContextVar(
    "active_trace", default=None
)
_active_span: contextvars.ContextVar[Optional[LlmSpan]] = contextvars.ContextVar(
    "active_span", default=None
)


INDEX_FILE = "index.jsonl"
RUNS_DIR = "runs"


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _default_traces_dir() -> Path:
    """트레이스 루트. 경로를 아는 것은 저장 게이트뿐이다."""
    from app.core.config import settings

    return settings.storage.traces


class LlmSpan(BaseModel):
    """실행 단위의 세부 단계(Span/Child Run)."""

    span_id: str = Field(default_factory=lambda: f"span-{uuid.uuid4().hex[:8]}")
    parent_span_id: Optional[str] = Field(
        default=None, description="상위 Span. None 이면 Trace 직속"
    )
    name: str
    run_type: str = Field(description="tool | llm | parser | chain")
    status: str = "RUNNING"  # RUNNING | SUCCESS | FAILED | TIMEOUT
    start_time: str = Field(default_factory=_iso_now)
    end_time: Optional[str] = None
    duration_seconds: float = 0.0
    inputs: Dict[str, Any] = Field(default_factory=dict)
    outputs: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tokens: Dict[str, int] = Field(
        default_factory=lambda: {
            "input": 0,
            "output": 0,
            "thinking": 0,
            "cache_read": 0,
            "total": 0,
        }
    )
    error: Optional[str] = None


class LlmTrace(BaseModel):
    """전체 실행 파이프라인을 총괄하는 루트 엔벨로프(Trace/Root Run)."""

    trace_id: str = Field(default_factory=lambda: f"tr-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}")
    name: str
    run_type: str = "chain"
    document_name: Optional[str] = None
    # 문서 삭제가 트레이스까지 연쇄되려면 사람이 읽는 이름이 아니라 식별자가 필요하다.
    doc_id: Optional[str] = None
    run_id: Optional[str] = None
    status: str = "RUNNING"  # RUNNING | SUCCESS | FAILED | TIMEOUT
    start_time: str = Field(default_factory=_iso_now)
    end_time: Optional[str] = None
    duration_seconds: float = 0.0
    inputs: Dict[str, Any] = Field(default_factory=dict)
    outputs: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    spans: List[LlmSpan] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def create_span(
        self,
        name: str,
        run_type: str = "tool",
        inputs: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> LlmSpan:
        """새 하위 Span을 생성하고 Trace에 등록합니다.

        현재 활성 Span이 있으면 그 아래로 매답니다(계층 구성).
        """
        parent = get_current_span()
        span = LlmSpan(
            name=name,
            run_type=run_type,
            parent_span_id=parent.span_id if parent is not None else None,
            inputs=inputs or {},
            metadata=metadata or {},
        )
        self.spans.append(span)
        return span

    def finish_span(
        self,
        span: LlmSpan,
        outputs: Optional[Dict[str, Any]] = None,
        tokens: Optional[Dict[str, int]] = None,
        status: str = "SUCCESS",
        error: Optional[str] = None,
        duration_seconds: Optional[float] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
    ) -> None:
        """Span 실행을 종료하고 소요 시간을 확정합니다.

        기본은 start/end 타임스탬프 차이로 계산하지만, 이미 다른 곳에서 실측한 구간
        (예: 엔진이 스레드 안에서 잰 시간)은 `duration_seconds` / `start_time` /
        `end_time` 으로 **실측값을 직접 주입**해야 합니다. 그러지 않으면 사후에
        생성한 Span 은 start==end 가 되어 duration 이 0 으로 박힙니다.
        """
        if start_time is not None:
            span.start_time = start_time
        span.end_time = end_time or _iso_now()
        span.status = status
        span.error = error
        if outputs is not None:
            span.outputs = outputs
        if tokens is not None:
            span.tokens.update(tokens)

        if duration_seconds is not None:
            span.duration_seconds = round(float(duration_seconds), 3)
            return

        try:
            t_start = datetime.fromisoformat(span.start_time)
            t_end = datetime.fromisoformat(span.end_time)
            span.duration_seconds = round((t_end - t_start).total_seconds(), 3)
        except Exception:
            pass

    def add_step(
        self,
        name: str,
        run_type: str = "tool",
        *,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        duration_seconds: Optional[float] = None,
        inputs: Optional[Dict[str, Any]] = None,
        outputs: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        tokens: Optional[Dict[str, int]] = None,
        status: str = "SUCCESS",
        error: Optional[str] = None,
    ) -> LlmSpan:
        """**이미 끝난** 단계를 실측 시각 그대로 Span 으로 기록합니다.

        엔진이 자기 스레드 안에서 잰 구간을 호스트가 사후에 옮겨 담는 통로입니다.
        엔진은 tracer 를 import 하지 않고 순수 dict 만 방출하므로 의존 방향(P1)이 유지됩니다.
        """
        span = self.create_span(name=name, run_type=run_type, inputs=inputs, metadata=metadata)
        if start_time:
            span.start_time = start_time
        self.finish_span(
            span,
            outputs=outputs,
            tokens=tokens,
            status=status,
            error=error,
            duration_seconds=duration_seconds,
            end_time=end_time,
        )
        return span

    def replay_steps(self, steps: Optional[List[Dict[str, Any]]]) -> List[LlmSpan]:
        """엔진이 방출한 단계 목록을 순서대로 Span 으로 복원합니다.

        엔진 쪽에 키가 늘어나도 깨지지 않도록 아는 키만 골라 씁니다.
        """
        known = {
            "run_type", "start_time", "end_time", "duration_seconds",
            "inputs", "outputs", "metadata", "tokens", "status", "error",
        }
        created: List[LlmSpan] = []
        for step in steps or []:
            if not isinstance(step, dict) or not step.get("name"):
                continue
            kwargs = {k: v for k, v in step.items() if k in known}
            created.append(self.add_step(step["name"], **kwargs))
        return created

    def finish(
        self,
        outputs: Optional[Dict[str, Any]] = None,
        status: str = "SUCCESS",
        error: Optional[str] = None,
        traces_dir: Optional[Path] = None,
    ) -> None:
        """Trace 전체를 종료하고 디스크에 영속화합니다."""
        self.end_time = _iso_now()
        self.status = status
        if error:
            self.error = {"message": error, "timestamp": self.end_time}
        if outputs is not None:
            self.outputs = outputs

        try:
            t_start = datetime.fromisoformat(self.start_time)
            t_end = datetime.fromisoformat(self.end_time)
            self.duration_seconds = round((t_end - t_start).total_seconds(), 3)
        except Exception:
            pass

        self.save(traces_dir)

    def save(self, traces_dir: Optional[Path] = None) -> Optional[Path]:
        """LangSmith 스타일 Trace JSON 및 index.jsonl 파일을 기록합니다."""
        try:
            if traces_dir is None:
                traces_dir = _default_traces_dir()

            # start_time 이 UTC 이므로 폴더 날짜도 UTC 로 맞춘다. 로컬시각을 쓰면
            # 자정 근처에서 파일의 타임스탬프와 폴더 날짜가 어긋난다.
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            runs_dir = traces_dir / RUNS_DIR / today_str
            runs_dir.mkdir(parents=True, exist_ok=True)

            # 파일명은 식별자만으로 짓는다. 문서 이름을 파일명에 넣으면 원문 조각이
            # 파일 목록에 그대로 노출되고, 삭제 연쇄도 문자열 매칭에 기대게 된다.
            file_name = f"{self.trace_id}.json"
            trace_path = runs_dir / file_name

            with open(trace_path, "w", encoding="utf-8") as f:
                json.dump(self.model_dump(), f, ensure_ascii=False, indent=2)

            # 2. 빠른 조회를 위한 index.jsonl 요약 인덱스 기록
            index_path = traces_dir / INDEX_FILE
            summary_entry = {
                "trace_id": self.trace_id,
                "name": self.name,
                "status": self.status,
                "document_name": self.document_name,
                "doc_id": self.doc_id,
                "run_id": self.run_id,
                "start_time": self.start_time,
                "duration_seconds": self.duration_seconds,
                "total_spans": len(self.spans),
                "total_tokens": sum(s.tokens.get("total", 0) for s in self.spans),
                "cache_read_tokens": sum(s.tokens.get("cache_read", 0) for s in self.spans),
                "error": bool(self.error),
                "relative_path": f"{RUNS_DIR}/{today_str}/{file_name}",
            }
            with open(index_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(summary_entry, ensure_ascii=False) + "\n")

            logger.info(
                "[LlmTracer] Trace 저장 완료: %s (status=%s, duration=%.2fs, spans=%d)",
                file_name,
                self.status,
                self.duration_seconds,
                len(self.spans),
            )
            return trace_path

        except Exception as e:
            logger.error("[LlmTracer] Trace 저장 실패: %s", e)
            return None


def ingest_pipeline_telemetry(
    telemetry_data: Any,
    run_id: Optional[str] = None,
    doc_id: Optional[str] = None,
    base_dir: Optional[Path] = None,
    target_name: Optional[str] = None,
    primary_provider: Optional[str] = None,
) -> Optional[Path]:
    """엔진이 방출한 PipelineTelemetry 객체를 apps/api/data/runs/{run_id}/ 에 영속화합니다 (60-data 헌법 준수)."""
    try:
        from agent_telemetry.contracts import PipelineTelemetry

        if isinstance(telemetry_data, dict):
            telemetry = PipelineTelemetry.model_validate(telemetry_data)
        elif isinstance(telemetry_data, PipelineTelemetry):
            telemetry = telemetry_data
        else:
            return None

        actual_run_id = run_id or telemetry.trace_id
        if base_dir is None:
            from app.core.config import settings
            # data/runs/ 에 원본 보존
            run_dir = settings.storage.data / RUNS_DIR / actual_run_id
        else:
            run_dir = base_dir / actual_run_id

        run_dir.mkdir(parents=True, exist_ok=True)

        # 1. ledger.jsonl (Append-Only 불변 원장)
        ledger_path = run_dir / "ledger.jsonl"
        with open(ledger_path, "w", encoding="utf-8") as f:
            for sp in telemetry.spans:
                entry = {
                    "event_type": "span",
                    "timestamp": sp.start_time.isoformat(),
                    "data": sp.model_dump(mode="json"),
                }
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")

            for att in telemetry.attempts:
                entry = {
                    "event_type": "attempt",
                    "data": att.model_dump(mode="json"),
                }
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")

        # 2. snapshots.json (단계별 중간 상태 덤프)
        snapshots_path = run_dir / "snapshots.json"
        snapshots_payload = [snap.model_dump(mode="json") for snap in telemetry.snapshots]
        with open(snapshots_path, "w", encoding="utf-8") as f:
            json.dump(snapshots_payload, f, ensure_ascii=False, indent=2)

        # primary_provider 및 primary_model 추출
        primary_model = None
        if primary_provider is None:
            if telemetry.attempts:
                succ_att = next((a for a in telemetry.attempts if getattr(a, "status", None) == "success"), telemetry.attempts[0])
                primary_provider = succ_att.provider
                primary_model = succ_att.model_name
            elif telemetry.provenance:
                primary_provider = telemetry.provenance.get("provider")
                primary_model = telemetry.provenance.get("model")

        if not primary_model and telemetry.provenance:
            primary_model = telemetry.provenance.get("model")

        # 스팬 목록에서 llm 스팬의 provider 및 model_name 탐색 (스팬 메타데이터 파싱)
        if not primary_provider or not primary_model:
            for sp in telemetry.spans:
                sp_type = getattr(sp, "span_type", "")
                if sp_type == "llm" or "LLM" in getattr(sp, "name", ""):
                    sp_meta = getattr(sp, "metadata", {}) or {}
                    if not primary_provider:
                        p_candidate = (
                            sp_meta.get("provider")
                            or sp_meta.get("extra", {}).get("provider")
                        )
                        if p_candidate and p_candidate != "unknown":
                            primary_provider = p_candidate
                    if not primary_model:
                        m_candidate = (
                            sp_meta.get("model_name")
                            or getattr(sp, "model_name", None)
                            or sp_meta.get("extra", {}).get("model")
                        )
                        if m_candidate and m_candidate != "unknown":
                            primary_model = m_candidate

        # 모델명 기반 폴백 공급자 판정
        if not primary_provider and primary_model:
            mod_l = str(primary_model).lower()
            if "low" in mod_l or "cli" in mod_l or "agy" in mod_l:
                primary_provider = "agy_cli"
            elif "local" in mod_l or "gemma" in mod_l:
                primary_provider = "local"
            else:
                primary_provider = "google_genai"

        raw_target = getattr(telemetry, "target_name", None)
        resolved_target = (
            target_name
            if (raw_target in (None, "", "source.pdf") and target_name)
            else (raw_target or target_name)
        )

        meta_path = run_dir / "meta.json"
        meta_payload = {
            "run_id": actual_run_id,
            "doc_id": doc_id,
            "domain": getattr(telemetry, "domain", "documents"),
            "workflow_name": getattr(telemetry, "workflow_name", "pipeline"),
            "workflow_label": getattr(telemetry, "workflow_label", "") or ("\ubb38\uc11c \ubaa9\ucc28 \ucd94\ucd9c" if "outline" in (telemetry.pipeline_name or "").lower() else ""),
            "target_name": resolved_target,
            "primary_provider": primary_provider,
            "primary_model": primary_model,
            "pipeline_name": telemetry.pipeline_name,
            "status": telemetry.status.value,
            "start_time": telemetry.start_time.isoformat(),
            "end_time": telemetry.end_time.isoformat() if telemetry.end_time else None,
            "total_latency_ms": telemetry.total_latency_ms,
            "total_tokens": telemetry.total_usage.total_tokens,
            "prompt_tokens": telemetry.total_usage.prompt_tokens,
            "completion_tokens": telemetry.total_usage.completion_tokens,
            "spans_count": len(telemetry.spans),
            "snapshots_count": len(telemetry.snapshots),
            "attempts_count": len(telemetry.attempts),
            "provenance": telemetry.provenance,
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta_payload, f, ensure_ascii=False, indent=2)

        logger.info("[LlmTracer] PipelineTelemetry 저장 완료: %s (status=%s, spans=%d, snapshots=%d)", actual_run_id, telemetry.status.value, len(telemetry.spans), len(telemetry.snapshots))
        return run_dir

    except Exception as exc:
        logger.error("[LlmTracer] PipelineTelemetry 저장 실패: %s", exc)
        return None


def get_current_trace() -> Optional[LlmTrace]:
    """현재 활성화된 상위 Trace 객체를 반환합니다."""
    return _active_trace.get()


def get_current_span() -> Optional[LlmSpan]:
    """현재 활성화된 하위 Span 객체를 반환합니다."""
    return _active_span.get()


@contextmanager
def trace_session(
    name: str,
    inputs: Optional[Dict[str, Any]] = None,
    document_name: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    doc_id: Optional[str] = None,
    run_id: Optional[str] = None,
    traces_dir: Optional[Path] = None,
) -> Generator[LlmTrace, None, None]:
    """
    LangSmith Trace 세션을 시작하는 컨텍스트 매니저.
    블록 종료 시 자동으로 종료 시간 계산 및 Trace JSON 영속화를 수행합니다.
    """
    trace = LlmTrace(
        name=name,
        inputs=inputs or {},
        document_name=document_name,
        doc_id=doc_id,
        run_id=run_id,
        metadata=metadata or {},
    )
    token = _active_trace.set(trace)
    try:
        yield trace
        if trace.status == "RUNNING":
            trace.finish(status="SUCCESS", traces_dir=traces_dir)
    except Exception as e:
        trace.finish(status="FAILED", error=str(e), traces_dir=traces_dir)
        raise
    finally:
        _active_trace.reset(token)


@contextmanager
def span_context(
    name: str,
    run_type: str = "tool",
    inputs: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Generator[Optional[LlmSpan], None, None]:
    """
    하위 Span(Tool, LLM 호출, 파서 등)을 시작하는 컨텍스트 매니저.
    상위 활성 Trace가 있을 경우 자동으로 연결됩니다.
    """
    trace = get_current_trace()
    span: Optional[LlmSpan] = None
    span_token = None

    if trace is not None:
        span = trace.create_span(
            name=name,
            run_type=run_type,
            inputs=inputs or {},
            metadata=metadata or {},
        )
        span_token = _active_span.set(span)

    try:
        yield span
        if trace and span and span.status == "RUNNING":
            trace.finish_span(span, status="SUCCESS")
    except Exception as e:
        if trace and span:
            trace.finish_span(span, status="FAILED", error=str(e))
        raise
    finally:
        if span_token:
            _active_span.reset(span_token)


def list_traces(limit: int = 50, traces_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    """index.jsonl 로부터 최근 실행 Trace 요약 목록을 역순으로 반환합니다."""
    if traces_dir is None:
        traces_dir = _default_traces_dir()

    index_path = traces_dir / INDEX_FILE
    if not index_path.exists():
        return []

    results: List[Dict[str, Any]] = []
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        results.append(json.loads(line))
                    except Exception:
                        pass
    except Exception as e:
        logger.error("[LlmTracer] index.jsonl 읽기 실패: %s", e)

    # 최신순 정렬 후 limit 제한
    results.reverse()
    return results[:limit]


def get_trace(trace_id: str, traces_dir: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """지정된 trace_id 에 해당하는 Full Trace JSON 데이터를 검색하여 반환합니다."""
    if traces_dir is None:
        traces_dir = _default_traces_dir()

    runs_dir = traces_dir / RUNS_DIR
    if not runs_dir.exists():
        return None

    for json_file in runs_dir.glob(f"**/{trace_id}*.json"):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error("[LlmTracer] Trace 파일 읽기 실패 (%s): %s", json_file, e)

    return None


def purge_expired_traces(retention_days: int, traces_dir: Optional[Path] = None) -> int:
    """보존기간이 지난 트레이스를 정리한다.

    앱이 요청마다 파일을 회전시키는 대신, 보존정책이 한 곳에서 일괄 정리한다.
    트레이스는 재생성할 수 없지만 재생성할 필요도 없다 — 집계는 원장이 갖고 있다.
    """
    if traces_dir is None:
        traces_dir = _default_traces_dir()

    runs_dir = traces_dir / RUNS_DIR
    if not runs_dir.exists():
        return 0

    cutoff = (datetime.now(timezone.utc) - timedelta(days=retention_days)).strftime("%Y-%m-%d")
    removed = 0
    for day_dir in runs_dir.iterdir():
        if not day_dir.is_dir() or day_dir.name >= cutoff:
            continue
        try:
            shutil.rmtree(day_dir)
            removed += 1
        except OSError as exc:
            logger.warning("[LlmTracer] 만료 트레이스 정리 실패 (%s): %s", day_dir.name, exc)
    if removed:
        logger.info("[LlmTracer] 만료 트레이스 %d일치를 정리했습니다.", removed)
    return removed


def delete_traces_for_document(doc_id: str, traces_dir: Optional[Path] = None) -> int:
    """문서 삭제에 트레이스를 연쇄시킨다.

    프롬프트에 문서 본문이 실리므로, 문서를 지우면 그 흔적도 함께 지워야 한다.
    문서 이름이 아니라 `doc_id` 로 찾는 이유가 이것이다.
    """
    if traces_dir is None:
        traces_dir = _default_traces_dir()

    index_path = traces_dir / INDEX_FILE
    if not index_path.exists():
        return 0

    kept: List[str] = []
    removed = 0
    for line in index_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except ValueError:
            continue
        if entry.get("doc_id") != doc_id:
            kept.append(line)
            continue
        relative = entry.get("relative_path")
        if relative:
            target = traces_dir / relative
            try:
                target.unlink(missing_ok=True)
                removed += 1
            except OSError as exc:
                logger.warning("[LlmTracer] 트레이스 삭제 실패 (%s): %s", relative, exc)

    index_path.write_text("\n".join(kept) + ("\n" if kept else ""), encoding="utf-8")
    return removed
