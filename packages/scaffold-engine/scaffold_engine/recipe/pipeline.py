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
        return (
            "당신은 원본 문서의 실측 레이아웃, 세그먼트, 아웃라인 분석 결과를 바탕으로 "
            "재사용 가능한 문서 저작 규격(DocumentRecipe)을 추출·정의하는 문서 공학 전문가입니다.\n"
            "원본 문서를 단순 복사하지 말고, 구조적이고 논리적인 저작 명세를 설계하십시오.\n\n"
            "⚠️ 언어 절대 규칙: 문서 목적(purpose), 대상 독자(audience), 문서 어조(tone), 작성 흐름(rhythm), "
            "블록명(name), 결합 규칙(couplingRules), 지시사항(directives), 검증 루브릭(validationRubric) 등 "
            "모든 설명 및 서술 값은 반드시 한국어(Korean)로 작성하십시오. 영어로 작성하지 마십시오.\n\n"
            "반드시 순수한 JSON 객체 하나만 반환하십시오. 스키마 규격은 다음과 같습니다:\n"
            "{\n"
            '  "purpose": "문서의 핵심 목적 및 작성 이유 (한국어로 서술)",\n'
            '  "audience": "문서를 열람·검토하는 대상 독자층 (한국어로 서술)",\n'
            '  "tone": "문서에 요구되는 격식과 서술 어조 (한국어로 서술)",\n'
            '  "rhythm": "문서의 작성 순서 및 세션 전개 리듬 (한국어로 서술)",\n'
            '  "blocks": [\n'
            "    {\n"
            '      "id": "블록 식별자 (예: block-header, block-session, block-expense 등)",\n'
            '      "name": "블록 명칭 (한국어, 예: 회의 기록 세션, 경비 청구 항목 등)",\n'
            '      "role": "저작 역할 (container, section, header, summary, entry, media, footer 중 하나)",\n'
            '      "required": true 또는 false,\n'
            '      "repeatPolicy": "반복 정책 (single, multiple, optional 중 하나)",\n'
            '      "elementIds": ["입력 데이터에 존재하는 실제 element ID 목록"]\n'
            "    }\n"
            "  ],\n"
            '  "couplingRules": ["요소 간 상호 수반 조건 및 결합 규칙 목록 (한국어로 서술)"],\n'
            '  "directives": ["작성 시 준수해야 할 구체적 지침 목록 (한국어로 서술)"],\n'
            '  "validationRubric": {\n'
            '    "completeness": "완전성 검증 기준 (한국어로 서술)",\n'
            '    "accuracy": "정확성 검증 기준 (한국어로 서술)"\n'
            "  }\n"
            "}\n"
            "⚠️ 주의: elementIds에는 입력 데이터에 제공된 실제 element ID만 매핑해야 하며, 존재하지 않는 임의의 ID를 지어내지 마십시오.\n"
            "\n[입력 데이터]\n"
            + json.dumps(snapshot, ensure_ascii=False)
        )

