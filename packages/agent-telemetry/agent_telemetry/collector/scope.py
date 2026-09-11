from __future__ import annotations
from typing import Any, Dict, List, Optional
from agent_telemetry.contracts.attempt import ModelAttemptRecord
from agent_telemetry.contracts.snapshot import StageSnapshotRecord
from agent_telemetry.contracts.span import SpanRecord


class StepScope:
    """단일 실행 단계(Span)의 계측 컨텍스트 스코프"""

    def __init__(self, span: SpanRecord, collector: Any) -> None:
        self.span = span
        self._collector = collector

    def set_inputs(self, inputs: Dict[str, Any]) -> None:
        """해당 단계의 입력 매개변수 기록"""
        self.span.inputs.update(inputs)

    def set_outputs(self, outputs: Dict[str, Any]) -> None:
        """해당 단계의 정상 산출물 기록"""
        if self.span.outputs is None:
            self.span.outputs = {}
        self.span.outputs.update(outputs)

    def set_label(
        self,
        display_label: Optional[str] = None,
        description: Optional[str] = None,
        summary_pill: Optional[str] = None,
        phase: Optional[Any] = None,
        data_in: Optional[str] = None,
        data_out: Optional[str] = None,
        data_via: Optional[List[str]] = None,
    ) -> None:
        """이용자 친화적 라벨, 설명, 요약 뱃지 및 데이터 입출력/경유 체인 설정"""
        if display_label is not None:
            self.span.display_label = display_label
        if description is not None:
            self.span.description = description
        if summary_pill is not None:
            self.span.summary_pill = summary_pill
        if phase is not None:
            self.span.phase = phase
        if data_in is not None:
            self.span.data_in = data_in
        if data_out is not None:
            self.span.data_out = data_out
        if data_via is not None:
            self.span.data_via = list(data_via)

    def set_data_flow(
        self,
        data_in: Optional[str] = None,
        data_out: Optional[str] = None,
        data_via: Optional[List[str]] = None,
    ) -> None:
        """데이터 흐름 칩용 입력 파일/객체, 경유 클래스/파일 및 출력 파일/객체 명칭 설정"""
        if data_in is not None:
            self.span.data_in = data_in
        if data_out is not None:
            self.span.data_out = data_out
        if data_via is not None:
            self.span.data_via = list(data_via)

    def attach_harness_result(self, exec_res: Any) -> None:
        """LLM 하네스 실행 결과(토큰, attempts, CLI 메타)를 스팬에 결합"""
        # tokens
        tokens = getattr(exec_res, "tokens", None)
        if isinstance(tokens, dict):
            self.span.usage.prompt_tokens = tokens.get("input", 0)
            self.span.usage.completion_tokens = tokens.get("output", 0)
            self.span.usage.reasoning_tokens = tokens.get("thinking")
            self.span.usage.total_tokens = tokens.get("total", 0)
        elif hasattr(exec_res, "input_tokens"):
            self.span.usage.prompt_tokens = getattr(exec_res, "input_tokens", 0)
            self.span.usage.completion_tokens = getattr(exec_res, "output_tokens", 0)
            self.span.usage.reasoning_tokens = getattr(exec_res, "thinking_tokens", None)
            self.span.usage.total_tokens = getattr(exec_res, "total_tokens", 0)

        # metadata
        meta = getattr(exec_res, "telemetry_metadata", {})
        if isinstance(meta, dict):
            self.span.metadata.extra.update(meta)
        if hasattr(exec_res, "duration_seconds"):
            self.span.metadata.extra["cli_reported_duration"] = exec_res.duration_seconds
        if hasattr(exec_res, "model") and exec_res.model:
            self.span.metadata.model_name = exec_res.model

        # attempts (누적)
        attempts = getattr(exec_res, "attempts", None)
        if isinstance(attempts, list):
            for att in attempts:
                if isinstance(att, ModelAttemptRecord):
                    self._collector.attempts.append(att)

    def snapshot(self, stage_id: str, stage_name: str, payload: Dict[str, Any]) -> None:
        """[FR-02, FR-07-3] 해당 단계의 도메인 상태를 스냅샷으로 캡처"""
        snap = StageSnapshotRecord(
            stage_id=stage_id,
            stage_name=stage_name,
            payload=payload,
        )
        self._collector.snapshots.append(snap)
