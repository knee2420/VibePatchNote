"""Stage 1-B: 프롬프트 조립기 (PromptAssembler).

시스템 지침(Instructions)과 실측 기하/텍스트 컨텍스트(DocumentContext)를 결합하여
멀티모달 1-Stage 인지 분해용 통합 프롬프트를 생성합니다.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

SYSTEM_INSTRUCTIONS_PATH = Path(__file__).resolve().parent / "system_instructions.md"


class OutlinePromptAssembler:
    """통합 프롬프트 조립기."""

    def __init__(self, system_instructions_path: Optional[Path] = None) -> None:
        self.system_instructions_path = system_instructions_path or SYSTEM_INSTRUCTIONS_PATH

    def load_instructions(self) -> str:
        """시스템 지침서 마크다운을 로드합니다."""
        if self.system_instructions_path.exists():
            return self.system_instructions_path.read_text(encoding="utf-8")
        return ""

    def assemble(
        self,
        instructions: str,
        doc_ctx: Dict[str, Any],
        target_display_name: str,
        resolved_file_path: str,
    ) -> str:
        """분석 대상 문서 메타데이터, 실측 기하 컨텍스트, 시스템 지침을 결합합니다."""
        context_text = doc_ctx.get("context_text", "")
        total_pages = doc_ctx.get("total_pages", 1)

        return (
            f"{instructions}\n\n"
            f"======================================================================\n"
            f"[분석 대상 원본 문서]\n"
            f"- 파일명: {doc_ctx.get('filename', target_display_name)}\n"
            f"- 원본 파일 경로: {resolved_file_path}\n"
            f"- 총 페이지: {total_pages}페이지\n\n"
            f"[중요 지침: 실측 기하 메타데이터 및 멀티모달 컨텍스트 활용]\n"
            f"1. [시각적 비전 (PDF 직접 열람)]: 환경에서 도구(view/inspect)가 제공되는 경우 위 원본 파일 경로('{resolved_file_path}')를 직접 확인하여 전체적인 시각 레이아웃(여백, 박스 테두리, 심미적 위계, 서식 표 구획)을 파악하세요.\n"
            f"2. [실측 기하 메타데이터 엄격 바인딩 (핵심)]: 아래 제공된 표(Table), 미디어(Media), 그리고 [3. 실측 텍스트 블록 기하 메타데이터]의 각 블록 '상대좌표=[ymin, xmin, ymax, xmax]'는 문서 엔진이 정밀 측정한 0~1000 정규화 좌표입니다.\n"
            f"   - 좌표(box_2d)를 절대로 임의로 추측(Hallucination)하지 마십시오.\n"
            f"   - 목차 노드는 해당 라벨/헤더의 실측 블록 상대좌표를, elements는 값/내용이 위치한 실측 블록 상대좌표를 직접 바인딩하거나 여러 줄인 경우 해당 블록들을 온전히 감싸도록 병합(Union)하여 지정해야 합니다.\n"
            f"   - 특히 문서 최하단의 유의사항, 문의처/푸터(Contact/Notice/Footer), 서명란 등은 아래 실측 목록 하단(Y: 800~1000 범위)에 위치한 블록 상대좌표를 엄격히 참조하여 실제 위치에 정확히 일치시키십시오.\n"
            f"3. [원문 텍스트 전문 (Raw Text Flow)]: 좌표 숫자 노이즈 없이 연속된 문장 흐름이 보존된 깨끗한 원문 텍스트를 읽고, 항목명과 세부 라벨의 정확한 명칭을 오타나 누락 없이 파악하세요.\n\n"
            f"[추출된 멀티모달 기하 및 원문 텍스트 컨텍스트]\n"
            f"{context_text}\n"
            f"======================================================================\n\n"
            f"위 문서의 시각적 레이아웃과 텍스트 정보를 종합 분석하여, 지정된 JSON Schema에 맞추어 계층적 목차(Outline Tree, L1~L4)와 각 구획별 컴포넌트 분류(classify: header, key_value, table, list, paragraph, media) 및 실측 기입값(elements)을 1-Stage로 빠짐없이 전수 추출하십시오.\n"
            f"특히 한국형 서식 표(Table)는 내부의 헤더 및 세부 필드명(대학, 학과(부), 학년, 학번 등)까지 L4 단계까지 전수 분해하여 목차 트리로 구성하고, 각 필드 노드의 elements에 실제 기입된 값을 매핑하십시오.\n"
            f"좌표(box_2d) 지정 시, 목차 노드는 해당 라벨/헤더 텍스트 영역을, elements는 내용/본문 리스트/입력값/영수증 부착란 전체 사각 영역을 정확히 감싸도록 역할에 맞게 정밀 지정하십시오."
        )
