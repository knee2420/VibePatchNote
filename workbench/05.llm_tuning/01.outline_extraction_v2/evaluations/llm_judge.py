"""[01.outline_extraction_v2] 인간 인지 기준 LLM-as-a-Judge 채점기."""
import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, Optional

# 윈도우 콘솔 UTF-8 강제
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

V2_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(V2_ROOT))


from harness.cli_client import AntigravityCLIClient, CLIExecutionResult
from prompts.context_builder import DocumentContextBuilder
from schemas.judge_schema import LLMJudgeResult


class OutlineLLMJudge:
    """기계적 글자 매칭 대신 인간의 상식적 인지 기준에 맞추어 아웃라인 품질을 채점하는 심사위원 LLM."""

    def __init__(
        self,
        client: Optional[AntigravityCLIClient] = None,
        model: str = "gemini-3.8-flash-low",
        effort: str = "low",
    ) -> None:
        self.client = client or AntigravityCLIClient(default_model=model, default_effort=effort)
        self.context_builder = DocumentContextBuilder()
        self.schema_path = V2_ROOT / "schemas" / "judge_schema.json"

    def evaluate(
        self,
        pdf_path: Path,
        pred_outlines: Dict[str, Any],
    ) -> Dict[str, Any]:
        pdf_path = Path(pdf_path).resolve()
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF 파일 미존재: {pdf_path}")

        # 1. 원본 문서 텍스트 및 레이아웃 컨텍스트 빌드
        doc_ctx = self.context_builder.build_context(pdf_path)

        # 2. 심사위원 프롬프트 작성
        prompt = (
            "당신은 문서 레이아웃 분석 및 정보 구조화 전문 심사위원(LLM Judge)입니다.\n"
            "기계적인 글자 수나 엄격한 트리 깊이 잣대를 버리고, **'실제 사람이 문서를 훑어보며 파악하는 상식적인 인지 기준'**으로 아래 추출된 아웃라인 트리를 평가하십시오.\n\n"
            "======================================================================\n"
            f"[분석 대상 문서 정보: {doc_ctx['filename']} (총 {doc_ctx['total_pages']}페이지)]\n"
            f"[문서 추출 텍스트 및 시각 레이아웃 요약]\n"
            f"{doc_ctx['context_text'][:6000]}\n"
            "======================================================================\n"
            f"[평가 대상 추출 아웃라인 트리 (Prediction)]\n"
            f"{json.dumps(pred_outlines.get('outlines', []), ensure_ascii=False, indent=2)}\n"
            "======================================================================\n\n"
            "[인간 인지 평가 지침]\n"
            "1. **핵심 랜드마크 구역 커버리지(Core Landmark Coverage)**: 사람이 볼 때 문서를 대표하는 주요 시각 구역(예: 회사 정보, 청구 대상, 결제 총액, 품목 명세, 회의 안건, 주요 서식 헤더 등)을 어바웃하게라도 빠짐없이 잘 짚었는가?\n"
            "2. **과추출 및 본문 오염 억제**: 표의 세부 데이터 행, 서술형 긴 문단, 단순 Key-Value 값이 목차로 무분별하게 남발되지 않고 깔끔하게 정돈되었는가?\n"
            "3. **가상 라벨 강박 배제**: 문서에 인쇄되지 않은 인위적인 명칭을 요구하지 말고, 실제 인쇄된 구획을 상식적으로 묶었으면 긍정적으로 평가할 것.\n\n"
            "지정된 JSON Schema 규격에 맞추어 점수(1~100점)와 요약 총평을 작성하십시오."
        )

        # 3. CLI 구조화 호출
        res: CLIExecutionResult = self.client.run_structured(
            prompt=prompt,
            schema_path=self.schema_path,
        )

        if res.status != "SUCCESS" or not res.structured_output:
            return {
                "success": False,
                "error": res.error or "LLM Judge evaluation failed",
            }

        try:
            validated = LLMJudgeResult.model_validate(res.structured_output)
            return {
                "success": True,
                "document": pdf_path.stem,
                "judge_result": validated.model_dump(),
                "telemetry": {
                    "duration": res.duration_seconds,
                    "tokens": res.total_tokens,
                },
            }
        except Exception as e:
            return {
                "success": True,
                "document": pdf_path.stem,
                "judge_result": res.structured_output,
                "telemetry": {
                    "duration": res.duration_seconds,
                    "tokens": res.total_tokens,
                },
            }


def main():
    parser = argparse.ArgumentParser(description="LLM-as-a-Judge Outline Evaluator")
    parser.add_argument("--doc", default="Atticus_LLC_Invoice_000081709")
    args = parser.parse_args()

    v1_root = V2_ROOT.parent / "01.outline_extraction"
    pdf_path = v1_root / "01.dataset" / "raw" / f"{args.doc}.pdf"
    pred_file = V2_ROOT / "staging" / "step1_outline" / f"output_{args.doc}.json"

    if not pred_file.exists():
        print(f"[!] Prediction file not found: {pred_file}")
        return

    pred_data = json.loads(pred_file.read_text(encoding="utf-8"))
    judge = OutlineLLMJudge()
    print(f"[*] Running LLM-as-a-Judge on {args.doc}...")
    result = judge.evaluate(pdf_path, pred_data)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
