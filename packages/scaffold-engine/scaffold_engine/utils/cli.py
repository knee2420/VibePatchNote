"""Scaffold Engine CLI Interface (개발자용 단독 실행 유틸리티).

터미널에서 직접 PDF를 넣고 즉시 스캐폴딩(와이어프레임) 및 목차 트리를 추출/검증할 수 있는 개발용 CLI 도구입니다.

사용 예시:
    # 1. 와이어프레임(Tiptap HTML/슬롯) 추출
    scaffold-engine extract sample.pdf --page 1 --print-html --print-md

    # 2. 계층적 목차 트리(L1~L4) 추출
    scaffold-engine outline sample.pdf --print-tree --output outline.json
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any, Optional

from scaffold_engine.outline import OutlinePipeline
from scaffold_engine.wireframe import ScaffoldPipeline

DEFAULT_MODEL = "gemini-3.8-flash"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scaffold_engine.cli")


def _resolve_harness(model_name: str) -> Any:
    """agent_core 로부터 모델 하네스를 동적 주입합니다."""
    try:
        import importlib
        mod = importlib.import_module("agent_core")
        factory = getattr(mod, "HarnessFactory", None)
        if factory and hasattr(factory, "create"):
            return factory.create(model=model_name)
    except Exception as e:
        logger.warning("agent_core 하네스 생성 실패 (%s) - 기본 하네스 탐색 시도", e)
    return None


def handle_wireframe_extract(args: argparse.Namespace) -> None:
    """PDF 지정 페이지로부터 와이어프레임 서식 및 입력 슬롯을 추출합니다."""
    pdf_path = Path(args.pdf_path).resolve()
    if not pdf_path.exists():
        logger.error("파일이 존재하지 않습니다: %s", pdf_path)
        sys.exit(1)

    harness = _resolve_harness(args.model)
    if harness is None:
        logger.error("LLM 하네스를 생성할 수 없습니다. agent-core 및 인증 환경변수를 확인하십시오.")
        sys.exit(1)

    logger.info("[Wireframe] 추출 시작: %s (p.%d, model: %s)", pdf_path.name, args.page, args.model)
    pipeline = ScaffoldPipeline(harness=harness, model=args.model)
    try:
        result = pipeline.run(pdf_path, page_number=args.page)
        logger.info("추출 완료: '%s' (슬롯 %d개)", result.meta.title, len(result.slots))

        out_dict = result.model_dump(by_alias=True)

        if args.output:
            out_file = Path(args.output).resolve()
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_text(json.dumps(out_dict, ensure_ascii=False, indent=2), encoding="utf-8")
            logger.info("결과 JSON 파일 저장 완료: %s", out_file)

        if args.print_md:
            print("\n=== MARKDOWN CONTENT ===")
            print(result.markdown_content)

        if args.print_html:
            print("\n=== HTML CONTENT ===")
            print(result.html_content)

        if not args.output and not args.print_md and not args.print_html:
            print(json.dumps(out_dict, ensure_ascii=False, indent=2))

    except Exception as exc:
        logger.error("[Wireframe] 추출 중 오류 발생: %s", exc, exc_info=True)
        sys.exit(1)


def handle_outline_extract(args: argparse.Namespace) -> None:
    """PDF 문서로부터 1-Stage 인지 분해 기반 계층적 목차 트리(L1~L4)를 추출합니다."""
    pdf_path = Path(args.pdf_path).resolve()
    if not pdf_path.exists():
        logger.error("파일이 존재하지 않습니다: %s", pdf_path)
        sys.exit(1)

    harness = _resolve_harness(args.model)
    if harness is None:
        logger.error("LLM 하네스를 생성할 수 없습니다. agent-core 및 인증 환경변수를 확인하십시오.")
        sys.exit(1)

    logger.info("[Outline] 추출 시작: %s (model: %s, effort: %s)", pdf_path.name, args.model, args.effort)
    pipeline = OutlinePipeline(harness=harness, default_model=args.model, default_effort=args.effort)
    try:
        res = pipeline.execute(pdf_path, model=args.model, effort=args.effort)
        doc = res.get("document") or res.get("fallback_document")
        success = res.get("success", False)

        status_tag = "성공" if success else "폴백"
        logger.info("[Outline] 추출 완료 [%s]: 루트 노드 %d건, 엘리먼트 %d건",
                    status_tag, len(doc.outlines), len(doc.flat_elements))

        out_dict = doc.model_dump(by_alias=True)

        if args.output:
            out_file = Path(args.output).resolve()
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_text(json.dumps(out_dict, ensure_ascii=False, indent=2), encoding="utf-8")
            logger.info("결과 JSON 파일 저장 완료: %s", out_file)

        if args.print_tree:
            print("\n=== OUTLINE HIERARCHY TREE ===")
            print(doc.markdown_outline)

        if not args.output and not args.print_tree:
            print(json.dumps(out_dict, ensure_ascii=False, indent=2))

    except Exception as exc:
        logger.error("[Outline] 추출 중 오류 발생: %s", exc, exc_info=True)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="scaffold-engine",
        description="Scaffold Engine - AI 문서 스캐폴딩 및 목차 분석 개발자 도구",
    )
    subparsers = parser.add_subparsers(dest="command", required=True, help="실행할 파이프라인 모드")

    # 1. extract 서브명령어 (Wireframe/Tiptap 조립 트랙)
    extract_parser = subparsers.add_parser("extract", help="PDF 문서로부터 Tiptap 서식 와이어프레임 및 슬롯 추출")
    extract_parser.add_argument("pdf_path", type=str, help="대상 PDF 파일 경로")
    extract_parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help=f"사용할 LLM 모델 (기본: {DEFAULT_MODEL})")
    extract_parser.add_argument("--output", "-o", type=str, default=None, help="결과 JSON 저장 파일 경로")
    extract_parser.add_argument("--print-md", action="store_true", help="추출된 마크다운을 콘솔에 출력")
    extract_parser.add_argument("--print-html", action="store_true", help="추출된 HTML을 콘솔에 출력")
    extract_parser.add_argument("--page", type=int, default=1, help="분석할 페이지 번호 (기본 1)")
    extract_parser.set_defaults(func=handle_wireframe_extract)

    # 2. outline 서브명령어 (Outline 계층 트리 트랙)
    outline_parser = subparsers.add_parser("outline", help="PDF 문서로부터 계층적 목차 트리(L1~L4) 및 컴포넌트 추출")
    outline_parser.add_argument("pdf_path", type=str, help="대상 PDF 파일 경로")
    outline_parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help=f"사용할 LLM 모델 (기본: {DEFAULT_MODEL})")
    outline_parser.add_argument("--effort", type=str, default=None, help="추론 노력 수준 (low, medium, high)")
    outline_parser.add_argument("--output", "-o", type=str, default=None, help="결과 JSON 저장 파일 경로")
    outline_parser.add_argument("--print-tree", action="store_true", help="추출된 계층 트리를 마크다운으로 콘솔에 출력")
    outline_parser.set_defaults(func=handle_outline_extract)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
