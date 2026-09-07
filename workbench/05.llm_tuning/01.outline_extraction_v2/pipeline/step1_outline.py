"""[01.outline_extraction_v2] Step 1: 인지적 레이아웃 분해 기반 아웃라인 추출 파이프라인."""
import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, Optional

# V2 내부 모듈 경로 등록
V2_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(V2_ROOT))

from harness.cli_client import AntigravityCLIClient, CLIExecutionResult
from prompts.context_builder import DocumentContextBuilder
from schemas.models import OutlineOutput


class OutlineExtractionStep:
    """PDF 시각 기하 + 원문 텍스트 융합 멀티모달 아웃라인 추출기."""

    def __init__(
        self,
        client: Optional[AntigravityCLIClient] = None,
        schema_path: Optional[Path] = None,
        system_instructions_path: Optional[Path] = None,
    ) -> None:
        self.client = client or AntigravityCLIClient()
        self.context_builder = DocumentContextBuilder()
        self.schema_path = schema_path or (V2_ROOT / "schemas" / "outline_schema.json")
        self.system_instructions_path = system_instructions_path or (
            V2_ROOT / "prompts" / "system_instructions.md"
        )

    def execute(
        self,
        pdf_path: Path,
        model: Optional[str] = None,
        effort: Optional[str] = None,
    ) -> Dict[str, Any]:
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일이 존재하지 않습니다: {pdf_path}")

        # 1. 시스템 프롬프트 지침 로드
        instructions = ""
        if self.system_instructions_path.exists():
            instructions = self.system_instructions_path.read_text(encoding="utf-8")

        # 2. 3중 멀티모달 컨텍스트 추출 (표 기하 + 타이포그래피 블록 + 원문 텍스트 흐름)
        t0 = time.time()
        doc_ctx = self.context_builder.build_context(pdf_path)
        ctx_duration = round(time.time() - t0, 3)

        # 3. 통합 프롬프트 빌드
        prompt = (
            f"{instructions}\n\n"
            f"======================================================================\n"
            f"[분석 대상 문서 정보]\n"
            f"- 대상 파일 경로: {doc_ctx['resolved_path']}\n"
            f"- 파일명: {doc_ctx['filename']}\n"
            f"- 총 페이지: {doc_ctx['total_pages']}페이지\n\n"
            f"[추출된 멀티모달 기하 및 원문 텍스트 컨텍스트]\n"
            f"{doc_ctx['context_text']}\n"
            f"======================================================================\n\n"
            f"위 문서의 시각적 레이아웃과 텍스트 정보를 종합 분석하여, 지정된 JSON Schema에 맞추어 계층적 목차(Outline Tree)를 추출하십시오.\n"
            f"반드시 지침의 '목차 vs 본문 분리 기준(Stopping Criteria)'을 엄격히 준수하여 본문 데이터 행이나 세부 불릿 문단이 목차로 잘못 수집되지 않도록 하십시오."
        )

        # 4. CLI 네이티브 구조화 실행
        exec_res: CLIExecutionResult = self.client.run_structured(
            prompt=prompt,
            schema_path=self.schema_path,
            model=model,
            effort=effort,
        )

        if exec_res.status != "SUCCESS" or not exec_res.structured_output:
            return {
                "success": False,
                "status": exec_res.status,
                "error": exec_res.error or "No structured output returned",
                "telemetry": {
                    "ctx_duration": ctx_duration,
                    "cli_duration": exec_res.duration_seconds,
                    "tokens": {
                        "input": exec_res.input_tokens,
                        "output": exec_res.output_tokens,
                        "thinking": exec_res.thinking_tokens,
                        "total": exec_res.total_tokens,
                    },
                },
            }

        # 5. 스키마 유효성 검증 및 표준화
        raw_output = exec_res.structured_output
        try:
            validated = OutlineOutput.model_validate(raw_output)
            validated_dict = validated.model_dump(by_alias=True)
        except Exception as ve:
            # 관대하게 fallback
            validated_dict = raw_output

        # 6. 결과 저장 (staging 디렉터리)
        staging_dir = V2_ROOT / "staging" / "step1_outline"
        staging_dir.mkdir(parents=True, exist_ok=True)
        output_file = staging_dir / f"output_{pdf_path.stem}.json"
        output_file.write_text(
            json.dumps(validated_dict, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        return {
            "success": True,
            "document_title": pdf_path.name,
            "output_file": str(output_file),
            "data": validated_dict,
            "telemetry": {
                "ctx_duration": ctx_duration,
                "cli_duration": exec_res.duration_seconds,
                "tokens": {
                    "input": exec_res.input_tokens,
                    "output": exec_res.output_tokens,
                    "thinking": exec_res.thinking_tokens,
                    "total": exec_res.total_tokens,
                },
            },
        }


def main():
    parser = argparse.ArgumentParser(description="V2 Outline Extraction Step")
    parser.add_argument("--pdf", required=True, help="PDF file path")
    parser.add_argument("--model", default="gemini-3.8-flash-low", help="CLI model name")
    parser.add_argument("--effort", default="low", help="Effort level (low/medium/high)")
    args = parser.parse_args()

    step = OutlineExtractionStep()
    res = step.execute(pdf_path=Path(args.pdf), model=args.model, effort=args.effort)
    if res["success"]:
        print(f"[*] Success! Output saved to: {res['output_file']}")
        print(f"[*] Telemetry: {res['telemetry']}")
    else:
        print(f"[!] Extraction failed: {res['error']}")
        sys.exit(1)


if __name__ == "__main__":
    main()
