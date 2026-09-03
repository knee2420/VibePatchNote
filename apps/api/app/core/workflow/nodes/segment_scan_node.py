"""
SegmentScanNode: agy-cli를 서브프로세스로 호출하여 문서 내 표, 목록, 섹션 세그먼트를 탐지합니다.
Rule 준수: .agents/rules/50-develop/agy-cli/01_scripting_guide/rule.md
"""
import json
import logging
import subprocess
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class SegmentScanNode:
    """
    agy-cli Headless 실행을 통해 PDF/문서의 논리적 영역(표, 개조식 목록, 섹션)을
    분석하고 정규화된 2D Bounding Box 좌표(0~1000)를 추출하는 노드.
    """

    def __init__(self, timeout_seconds: int = 45) -> None:
        self.timeout_seconds = timeout_seconds

    def execute(self, file_path: Path) -> Dict[str, Any]:
        """
        문서 파일을 agy-cli로 분석하여 세그먼트 목록을 반환합니다.
        """
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        prompt = (
            f"당신은 고정밀 문서 구조 분석 엔진입니다.\n"
            f"다음 문서 파일의 내용을 정밀 분석하세요: {file_path.resolve()}\n\n"
            f"목표:\n"
            f"1. 문서의 페이지별로 표(table), 개조식 목록(list), 섹션/제목(section), 핵심 본문(paragraph) 영역을 분할하세요.\n"
            f"2. 각 영역의 페이지 번호(page, 1부터 시작), 블록 타입(type), 블록 제목/라벨(label), 핵심 요약(content_summary)을 추출하세요.\n"
            f"3. 각 영역의 상대 위치 Bounding Box(box_2d)를 [ymin, xmin, ymax, xmax] 형식의 0~1000 사이 정수 비율로 추정하세요.\n"
            f"   (예: 상단 5%~25%, 좌측 8%~92%면 [50, 80, 250, 920])\n\n"
            f"반드시 다음 JSON 형식으로만 응답하고, 마크다운 코드블록이나 불필요한 서술은 일체 제외하세요:\n"
            f'{{\n'
            f'  "document_title": "{file_path.name}",\n'
            f'  "total_pages": 1,\n'
            f'  "segments": [\n'
            f'    {{\n'
            f'      "id": "seg-1",\n'
            f'      "page": 1,\n'
            f'      "type": "table",\n'
            f'      "label": "회의비 사용 내역 표",\n'
            f'      "box_2d": [150, 80, 750, 920],\n'
            f'      "content_summary": "일시, 장소, 참석자, 안건, 회의내용, 지출금액 등이 포함된 사용 내역 표"\n'
            f'    }}\n'
            f'  ]\n'
            f'}}\n'
        )

        cmd = [
            "agy",
            "-p",
            prompt,
            "--model",
            "gemini-3.8-flash-low",
            "--dangerously-skip-permissions",
        ]

        logger.info(f"Executing agy-cli for file: {file_path.name}")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=self.timeout_seconds,
                check=False,
            )

            raw_output = result.stdout.strip()

            if result.returncode != 0:
                logger.warning(
                    f"agy-cli returned non-zero ({result.returncode}): {result.stderr}"
                )

            # JSON 파싱 시도
            parsed_data = self._parse_json_response(raw_output, file_path.name)
            if parsed_data and "segments" in parsed_data:
                return parsed_data

        except subprocess.TimeoutExpired:
            logger.error(f"agy-cli timed out after {self.timeout_seconds}s for {file_path.name}")
        except Exception as exc:
            logger.error(f"Error executing agy-cli: {exc}", exc_info=True)

        # 폴백(Fallback): CLI 파싱 불가 시 기본 구조 반환
        return self._generate_fallback_segments(file_path)

    def _parse_json_response(self, raw_output: str, fallback_title: str) -> Dict[str, Any] | None:
        """agy-cli 응답 텍스트에서 JSON 객체를 안전하게 추출합니다."""
        if not raw_output:
            return None

        # 1. 원본 전체가 순수 JSON인 경우
        try:
            return json.loads(raw_output)
        except json.JSONDecodeError:
            pass

        # 2. agy-cli wrapper 응답({"response": "..."}) 형태 처리
        try:
            wrapped = json.loads(raw_output)
            if isinstance(wrapped, dict) and "response" in wrapped:
                inner_text = wrapped["response"]
                try:
                    return json.loads(inner_text)
                except json.JSONDecodeError:
                    pass
        except Exception:
            pass

        # 3. 마크다운 코드블록 내 JSON 추출 (```json ... ```)
        try:
            start_idx = raw_output.find("{")
            end_idx = raw_output.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_candidate = raw_output[start_idx : end_idx + 1]
                return json.loads(json_candidate)
        except Exception:
            pass

        return None

    def _generate_fallback_segments(self, file_path: Path) -> Dict[str, Any]:
        """안전한 폴백 세그먼트 생성 (서버 중단 방지)."""
        logger.info(f"Generating fallback structural segments for {file_path.name}")
        return {
            "document_title": file_path.name,
            "total_pages": 1,
            "segments": [
                {
                    "id": "seg-fb-1",
                    "page": 1,
                    "type": "section",
                    "label": "문서 헤더 및 기본 개요",
                    "box_2d": [50, 80, 180, 920],
                    "content_summary": f"{file_path.name} 상단 섹션",
                },
                {
                    "id": "seg-fb-2",
                    "page": 1,
                    "type": "table",
                    "label": "핵심 내용 및 데이터 표",
                    "box_2d": [200, 80, 780, 920],
                    "content_summary": "주요 항목 및 상세 본문 영역",
                },
            ],
        }
