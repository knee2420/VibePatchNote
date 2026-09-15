"""Host-independent LLM distillation of an authoring Recipe."""
from __future__ import annotations

import json
from typing import Any

from agent_telemetry import SpanPhase, SpanType, StepCollector, current_collector, model_source, source_of

from ..utils.json_runner import JsonPromptRunner


class RecipePipeline:
    def __init__(self, runner: JsonPromptRunner) -> None:
        self._runner = runner

    def distill(self, snapshot: dict[str, Any]) -> dict[str, Any]:
        target_name = str(snapshot.get("documentTitle") or snapshot.get("docId") or "document")
        collector = current_collector() or StepCollector(
            pipeline_name="RecipePipeline",
            domain="recipe",
            workflow_name="recipes.distill",
            workflow_label="저작 규격 추출",
            target_name=target_name,
        )
        with collector.step(
            "RecipePrompt",
            span_type=SpanType.CHAIN,
            phase=SpanPhase.PRE_LLM,
            display_label="저작 규격 입력 조립",
            sources=[source_of(self._prompt)],
        ) as scope:
            prompt = self._prompt(snapshot)
            scope.set_inputs({"sourceIds": snapshot.get("sourceAnchors", {})})
            scope.set_outputs({"promptChars": len(prompt)})
        with collector.step(
            "LlmInference",
            span_type=SpanType.LLM,
            phase=SpanPhase.LLM,
            display_label="저작 규격 구조 추론",
            sources=[source_of(JsonPromptRunner.run), model_source(self._runner.model)],
        ) as scope:
            raw = self._runner.run(prompt, list_key="blocks")
            scope.set_outputs({"responseKind": type(raw).__name__})
        with collector.step(
            "RecipeValidation",
            span_type=SpanType.PARSER,
            phase=SpanPhase.POST_LLM,
            display_label="저작 규격 정규화",
            sources=[source_of(self._normalise)],
        ) as scope:
            result = self._normalise(raw, target_name)
            scope.set_outputs({"blockCount": len(result.get("blocks") or [])})
            return result

    @staticmethod
    def _normalise(raw: Any, title: str) -> dict[str, Any]:
        if not isinstance(raw, dict):
            raw = {"blocks": raw if isinstance(raw, list) else []}
        return {
            "purpose": raw.get("purpose") or "",
            "audience": raw.get("audience") or "",
            "tone": raw.get("tone") or "",
            "rhythm": raw.get("rhythm") or {},
            "blocks": raw.get("blocks") or raw.get("__engine_payload__") or [],
            "couplingRules": raw.get("couplingRules") or [],
            "directives": raw.get("directives") or [],
            "validationRubric": raw.get("validationRubric") or [],
            "title": raw.get("title") or title,
        }

    @staticmethod
    def _prompt(snapshot: dict[str, Any]) -> str:
        return """You extract a reusable authoring specification, not source copies. Return JSON only: purpose, audience, tone, rhythm, blocks, couplingRules, directives, validationRubric. Blocks require id, name, role, required, repeatPolicy, and elementIds. Do not invent IDs.\nINPUT:\n""" + json.dumps(snapshot, ensure_ascii=False)
