from __future__ import annotations
from typing import Any, Dict, List, Optional
from agent_telemetry.contracts.attempt import ModelAttemptRecord
from agent_telemetry.contracts.snapshot import StageSnapshotRecord
from agent_telemetry.contracts.span import SpanRecord
from agent_telemetry.contracts.usage import usage_from_product_dict


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
        """LLM 하네스 실행 결과(토큰, attempts, CLI 메타)를 스팬에 결합.

        하네스(`LlmExecutionResult`)는 제품 어휘(`input_tokens` ...)를 쓰고
        스팬은 공급자 어휘(`prompt_tokens` ...)를 쓴다. 변환은 손으로 하지 않고
        `usage_from_product_dict` 하나만 거친다 — 예전에 여기서 손으로 매핑하다가
        `cache_read_tokens` 를 통째로 흘렸다.
        """
        # tokens
        tokens = getattr(exec_res, "tokens", None)
        if isinstance(tokens, dict):
            product = {
                "input_tokens": tokens.get("input", 0),
                "output_tokens": tokens.get("output", 0),
                "thinking_tokens": tokens.get("thinking") or 0,
                "cache_read_tokens": tokens.get("cache_read", 0),
                "total_tokens": tokens.get("total", 0),
            }
        elif hasattr(exec_res, "input_tokens"):
            product = {
                key: getattr(exec_res, key, 0) or 0
                for key in (
                    "input_tokens",
                    "output_tokens",
                    "thinking_tokens",
                    "cache_read_tokens",
                    "total_tokens",
                )
            }
        else:
            product = None

        if product is not None:
            converted = usage_from_product_dict(product)
            # latency 와 비용은 아래/바깥에서 채운다. 토큰 축만 덮어쓴다.
            self.span.usage.prompt_tokens = converted.prompt_tokens
            self.span.usage.completion_tokens = converted.completion_tokens
            self.span.usage.reasoning_tokens = converted.reasoning_tokens
            self.span.usage.cache_read_tokens = converted.cache_read_tokens
            self.span.usage.total_tokens = converted.total_tokens

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
