"""
LangSmith 사상을 벤치마킹한 LLM 및 도메인 엔진 정밀 관제 트레이서(Tracer).
모든 파이프라인의 실행 과정(I/O, CLI 명령어, 서브프로세스, 세부 단계별 지연 시간, 토큰)을
계층적 Trace / Span 구조로 기록하고 파일에 영속화합니다.
"""
from __future__ import annotations

from contextlib import contextmanager
import contextvars
from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import time
from typing import Any, Dict, Generator, List, Optional
import uuid

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# 현재 비동기/스레드 컨텍스트의 활성 Trace 및 Span 추적
_active_trace: contextvars.ContextVar[Optional[LlmTrace]] = contextvars.ContextVar(
    "active_trace", default=None
)
_active_span: contextvars.ContextVar[Optional[LlmSpan]] = contextvars.ContextVar(
    "active_span", default=None
)


# index.jsonl 이 이 크기를 넘으면 .1 로 밀어내고 새로 시작한다 (무한 증가 방지).
MAX_INDEX_BYTES = 5 * 1024 * 1024


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _rotate_index_if_needed(index_path: Path) -> None:
    """요약 인덱스가 상한을 넘으면 한 세대만 보관하고 회전시킨다."""
    try:
        if index_path.exists() and index_path.stat().st_size >= MAX_INDEX_BYTES:
            backup = index_path.with_suffix(index_path.suffix + ".1")
            if backup.exists():
                backup.unlink()
            index_path.rename(backup)
            logger.info("[LlmTracer] index.jsonl 회전: %s", backup.name)
    except OSError as e:
        logger.warning("[LlmTracer] index.jsonl 회전 실패: %s", e)


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
        base_logs_dir: Optional[Path] = None,
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

        self.save(base_logs_dir)

    def save(self, base_logs_dir: Optional[Path] = None) -> Optional[Path]:
        """LangSmith 스타일 Trace JSON 및 index.jsonl 파일을 기록합니다."""
        try:
            if base_logs_dir is None:
                base_logs_dir = Path(__file__).resolve().parents[3] / "logs"

            traces_dir = base_logs_dir / "traces"
            # start_time 이 UTC 이므로 폴더 날짜도 UTC 로 맞춘다. 로컬시각을 쓰면
            # 자정 근처에서 파일의 타임스탬프와 폴더 날짜가 어긋난다.
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            runs_dir = traces_dir / "runs" / today_str
            runs_dir.mkdir(parents=True, exist_ok=True)

            doc_slug = (self.document_name or "general").replace(" ", "_").replace(".", "_")
            file_name = f"{self.trace_id}_{doc_slug}.json"
            trace_path = runs_dir / file_name

            with open(trace_path, "w", encoding="utf-8") as f:
                json.dump(self.model_dump(), f, ensure_ascii=False, indent=2)

            # 2. 빠른 조회를 위한 index.jsonl 요약 인덱스 기록
            index_path = traces_dir / "index.jsonl"
            _rotate_index_if_needed(index_path)
            summary_entry = {
                "trace_id": self.trace_id,
                "name": self.name,
                "status": self.status,
                "document_name": self.document_name,
                "start_time": self.start_time,
                "duration_seconds": self.duration_seconds,
                "total_spans": len(self.spans),
                "total_tokens": sum(s.tokens.get("total", 0) for s in self.spans),
                "cache_read_tokens": sum(s.tokens.get("cache_read", 0) for s in self.spans),
                "error": bool(self.error),
                "relative_path": f"runs/{today_str}/{file_name}",
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
    base_logs_dir: Optional[Path] = None,
) -> Generator[LlmTrace, None, None]:
    """
    LangSmith Trace 세션을 시작하는 컨텍스트 매니저.
    블록 종료 시 자동으로 종료 시간 계산 및 Trace JSON 영속화를 수행합니다.
    """
    trace = LlmTrace(
        name=name,
        inputs=inputs or {},
        document_name=document_name,
        metadata=metadata or {},
    )
    token = _active_trace.set(trace)
    t0 = time.time()
    try:
        yield trace
        if trace.status == "RUNNING":
            trace.finish(status="SUCCESS", base_logs_dir=base_logs_dir)
    except Exception as e:
        trace.finish(status="FAILED", error=str(e), base_logs_dir=base_logs_dir)
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


def list_traces(limit: int = 50, base_logs_dir: Optional[Path] = None) -> List[Dict[str, Any]]:
    """index.jsonl 로부터 최근 실행 Trace 요약 목록을 역순으로 반환합니다."""
    if base_logs_dir is None:
        base_logs_dir = Path(__file__).resolve().parents[3] / "logs"

    index_path = base_logs_dir / "traces" / "index.jsonl"
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


def get_trace(trace_id: str, base_logs_dir: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """지정된 trace_id 에 해당하는 Full Trace JSON 데이터를 검색하여 반환합니다."""
    if base_logs_dir is None:
        base_logs_dir = Path(__file__).resolve().parents[3] / "logs"

    runs_dir = base_logs_dir / "traces" / "runs"
    if not runs_dir.exists():
        return None

    for json_file in runs_dir.glob(f"**/{trace_id}*.json"):
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error("[LlmTracer] Trace 파일 읽기 실패 (%s): %s", json_file, e)

    return None
