"""Stage 2: LLM 통신 및 목차 인지 추론 (Inference Track)."""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from scaffold_engine.contracts import LlmHarness

logger = logging.getLogger(__name__)


class OutlineInferencer:
    """LLM 하네스 기반 목차 구조화 추론 엔진."""

    def __init__(self, harness: LlmHarness) -> None:
        self.harness = harness
        self.last_result: Optional[Any] = None

    def infer(
        self,
        prompt: str,
        schema_path: Path,
        pdf_path: Path,
        model: str,
        effort: Optional[str] = None,
    ) -> Any:
        """하네스를 통해 스키마 강제 구조화 응답을 수신합니다."""
        exec_res = self.harness.run_structured(
            prompt=prompt,
            schema_path=schema_path,
            model=model,
            effort=effort,
            file_path=pdf_path,
        )
        self.last_result = exec_res
        return exec_res

    @staticmethod
    def build_raw_command(
        exec_res: Any,
        actual_model: str,
        actual_provider: str,
        target_effort: Optional[str],
        schema_path: Path,
        target_display_name: str,
        prompt_len: int,
    ) -> str:
        """관측 콘솔용 CLI 또는 Direct API 실행 명령어를 역구성합니다."""
        tel_meta = getattr(exec_res, "telemetry_metadata", {}) if exec_res else {}
        raw_command = tel_meta.get("raw_command")
        if not raw_command and "command" in tel_meta:
            c_list = tel_meta["command"]
            raw_command = (
                " ".join(f'"{c}"' if " " in str(c) else str(c) for c in c_list)
                if isinstance(c_list, list)
                else str(c_list)
            )
        if not raw_command:
            prov = actual_provider or "agy_cli"
            if "api" in str(prov).lower():
                clean_m = re.sub(r"-(low|medium|high)$", "", actual_model)
                raw_command = (
                    f'curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/{clean_m}:generateContent?key=$GOOGLE_API_KEY" \\\n'
                    f'  -H "Content-Type: application/json" \\\n'
                    f'  -d \'{{"generationConfig": {{"responseMimeType": "application/json", "responseSchema": "<{schema_path.name}>"}}, "contents": [{{"role": "user", "parts": [{{"inlineData": {{"mimeType": "application/pdf", "data": "<BASE64_PDF: {target_display_name}>"}}}}, {{"text": "<PROMPT_STRING ({prompt_len} chars)>"}}]}}]}}\''
                )
            else:
                effort_arg = f" --effort {target_effort}" if target_effort else ""
                raw_command = (
                    f'agy --model {actual_model}{effort_arg} --input-format stream-json --output-format stream-json '
                    f'--dangerously-skip-permissions --disable-slash-commands --json-schema "{schema_path}"'
                )
        return raw_command
