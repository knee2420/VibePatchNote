"""LLM 중앙 관리자 (Dify ModelManager 패턴).

모든 도메인 서비스의 단일 진입점이다. 하는 일은 세 가지뿐이다.

1. 호스트 전용 어댑터를 `HarnessFactory` 에 등록한다 (프로바이더 확장).
2. 앱 설정(`settings.agent_cli_*`)을 어댑터 생성에 주입한다.
3. 모델명만 받아 적합한 하네스를 돌려준다.

프롬프트 내용이나 도메인 규칙은 이 계층이 알지 못하며, 알아서도 안 된다.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from scaffold_engine.harness import (
    AgyCliHarness,
    BaseLlmHarness,
    HarnessFactory,
    LlmExecutionResult,
    ModelSpec,
    get_model_spec,
)

from app.core.config import settings
from app.core.llm.adapters import GoogleGenAiHarness, LocalGemmaHarness

logger = logging.getLogger(__name__)


class LlmManager:
    """백엔드 중앙 LLM 진입점."""

    def __init__(self) -> None:
        self._default_model: str = settings.agent_cli_model
        self._default_timeout: int = settings.agent_cli_timeout_seconds
        self._executable: str = settings.agent_cli_bin
        self._register_providers()

    # --- 프로바이더 등록 -------------------------------------------------

    def _register_providers(self) -> None:
        """엔진 팩토리에 호스트 어댑터를 얹는다.

        `agy_cli` 는 엔진에도 기본 빌더가 있지만, 실행 파일 경로(`settings.agent_cli_bin`)를
        아는 것은 호스트뿐이므로 여기서 덮어쓴다.
        """
        HarnessFactory.register("agy_cli", self._build_agy_cli)
        HarnessFactory.register("local_serving", self._build_local_gemma)
        HarnessFactory.register("google_api", self._build_google_genai)

    def _build_agy_cli(
        self, spec: ModelSpec, effort: Optional[str], timeout_seconds: int
    ) -> BaseLlmHarness:
        return AgyCliHarness(
            model=spec.name,
            effort=effort,
            timeout_seconds=timeout_seconds,
            executable=self._executable,
        )

    def _build_local_gemma(
        self, spec: ModelSpec, effort: Optional[str], timeout_seconds: int
    ) -> BaseLlmHarness:
        return LocalGemmaHarness(model=spec.name, timeout_seconds=timeout_seconds)

    def _build_google_genai(
        self, spec: ModelSpec, effort: Optional[str], timeout_seconds: int
    ) -> BaseLlmHarness:
        return GoogleGenAiHarness(model=spec.name, timeout_seconds=timeout_seconds)

    # --- 공개 API --------------------------------------------------------

    def get_harness(
        self,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        timeout: Optional[int] = None,
        executable: Optional[str] = None,
    ) -> BaseLlmHarness:
        """모델 프로필에 맞는 하네스를 돌려준다."""
        target_model = model or self._default_model
        timeout_seconds = timeout or self._default_timeout

        # 호출부가 실행 파일을 직접 지정한 경우에만 팩토리를 우회한다.
        if executable:
            spec = get_model_spec(target_model)
            if spec.provider == "agy_cli":
                return AgyCliHarness(
                    model=spec.name,
                    effort=effort,
                    timeout_seconds=timeout_seconds,
                    executable=executable,
                )
            logger.warning(
                "[LlmManager] executable 지정은 agy_cli 프로바이더에만 적용됩니다 (model=%s, provider=%s)",
                target_model, spec.provider,
            )

        return HarnessFactory.create(
            model=target_model, effort=effort, timeout_seconds=timeout_seconds
        )

    def run_structured(
        self,
        prompt: str,
        *,
        json_schema: Optional[Dict[str, Any]] = None,
        schema_path: Optional[Any] = None,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> LlmExecutionResult:
        """구조화 실행 단일 창구."""
        harness = self.get_harness(model=model, effort=effort, timeout=timeout)
        return harness.run_structured(
            prompt,
            json_schema=json_schema,
            schema_path=schema_path,
            conversation_id=conversation_id,
        )

    def run_text(
        self,
        prompt: str,
        *,
        model: Optional[str] = None,
        effort: Optional[str] = None,
        conversation_id: Optional[str] = None,
        timeout: Optional[int] = None,
    ) -> LlmExecutionResult:
        """텍스트 실행 단일 창구."""
        harness = self.get_harness(model=model, effort=effort, timeout=timeout)
        return harness.run_text(prompt, conversation_id=conversation_id)


# 싱글톤 전역 인스턴스
llm_manager = LlmManager()
