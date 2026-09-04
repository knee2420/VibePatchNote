"""Scaffold Engine CLI Interface.

터미널에서 직접 PDF를 넣고 즉시 스캐폴딩을 추출/검증할 수 있는 CLI 도구입니다.
"""
import argparse
import json
import logging
import sys
from pathlib import Path

from scaffold_engine.pipeline import ScaffoldPipeline
from scaffold_engine.harness.client import DEFAULT_MODEL

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scaffold Engine - Document Layout to Tiptap Wireframe")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # extract 서브명령어
    extract_parser = subparsers.add_parser("extract", help="PDF 문서로부터 Tiptap 스캐폴드 추출")
    extract_parser.add_argument("pdf_path", type=str, help="대상 PDF 파일 경로")
    extract_parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="사용할 agy-cli 모델")
    extract_parser.add_argument("--output", "-o", type=str, default=None, help="결과 JSON 저장 파일 경로")
    extract_parser.add_argument("--print-md", action="store_true", help="추출된 마크다운을 콘솔에 출력")
    extract_parser.add_argument("--print-html", action="store_true", help="추출된 HTML을 콘솔에 출력")

    args = parser.parse_args()

    if args.command == "extract":
        pdf_path = Path(args.pdf_path).resolve()
        if not pdf_path.exists():
            logger.error("파일이 존재하지 않습니다: %s", pdf_path)
            sys.exit(1)

        pipeline = ScaffoldPipeline(model=args.model)
        try:
            result = pipeline.run(pdf_path)
            logger.info("추출 성공: %s", result.meta.title)

            out_dict = result.model_dump(by_alias=True)

            if args.output:
                out_file = Path(args.output).resolve()
                out_file.parent.mkdir(parents=True, exist_ok=True)
                with open(out_file, "w", encoding="utf-8") as f:
                    json.dump(out_dict, f, ensure_ascii=False, indent=2)
                logger.info("결과 파일 저장 완료: %s", out_file)

            if args.print_md:
                print("\n=== MARKDOWN CONTENT ===")
                print(result.markdown_content)

            if args.print_html:
                print("\n=== HTML CONTENT ===")
                print(result.html_content)

            if not args.output and not args.print_md and not args.print_html:
                # 기본으로 JSON 표준출력
                print(json.dumps(out_dict, ensure_ascii=False, indent=2))

        except Exception as exc:
            logger.error("추출 중 오류 발생: %s", exc, exc_info=True)
            sys.exit(1)


if __name__ == "__main__":
    main()
