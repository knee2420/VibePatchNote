"""Stage B 프롬프트 (Wireframe 비전 멀티모달 트랙).

첨부된 페이지 고해상도 이미지와 실측 기하 힌트 매트릭스를 대조하여,
각 블록의 역할(role)과 한국어 슬롯 라벨(slot_label)을 정밀하게 판정합니다.
"""
from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from scaffold_engine.wireframe.preprocess.extract.hint_builder import HintBuilder

if TYPE_CHECKING:  # pragma: no cover
    from scaffold_engine.tools import PageGeometry

TEXT_PREVIEW_CHARS = 80

VISION_CLASSIFICATION_PROMPT = """당신은 고정밀 문서 구조 분석 및 서식 재구성 전문가(Layout & Form Architect)입니다.
함께 제공된 [문서 페이지 고해상도 이미지]와 아래 [실측된 표/블록 기하 힌트 매트릭스]를 융합 분석하여,
이 문서를 누구나 재사용할 수 있는 '완벽한 Tiptap 와이어프레임(빈 서식 틀)'으로 분해 및 라벨링하십시오.

[핵심 역할(Role) 정의]
- title       : 문서 최상단의 공식 대제목 (예: "창의미래설계 지원신청서", "Invoice")
- label       : 서식에 늘 인쇄되어 있는 고정 항목명/머리글 (예: "팀명", "성명", "연락처", "소속", "일 시", "Billing info", "Description")
- value       : 블록/셀 전체가 이 문서 한 부에만 작성된 고유 기입값 (반드시 빈칸 슬롯이 되어야 함)
                (예: 날짜, 사람/회사 이름, 주소, 전화번호, 이메일, 문서번호, 금액, 본문 서술 내용, 회사 로고 등)
- mixed       : 한 블록/셀 안에 고정 라벨과 기입값이 함께 적혀 있는 경우
                (예: "전화번호 : 010-1234-5678" -> '전화번호 :'는 라벨, 번호만 value)
                (예: "Invoice 000081709" -> 'Invoice'는 고정, '000081709'는 value)
- decoration  : 페이지 번호, 저작권/약관 상용구 등 서식 틀과 무관한 장식 요소
- ignore      : 표 내부 셀에 이미 텍스트가 포함되어 있어 독립 블록으로 렌더링하면 중복 오버레이되는 잔여 블록, 또는 제거해야 할 불필요한 노이즈 블록

[필드 작성 원칙]
1. value_text : role 이 value 또는 mixed 일 때, 블록 텍스트에서 **비워야 할 데이터 부분만** 원문 그대로 복사하십시오.
                - value : 블록 텍스트 전체를 복사
                - mixed : 데이터 부분만 정확히 복사 (고정 라벨 제외)
                - 그 외 : 빈 문자열 ("")
                반드시 원문에 실제로 존재하는 문자열이어야 하며 요약하거나 바꾸지 마십시오.

2. slot_label : 사용자가 그 빈칸에 무엇을 채워 넣어야 하는지 명확하고 직관적인 한국어 라벨을 부여하십시오.
                (예: "회사 로고", "팀명", "과제명", "팀장 성명", "연락처", "이메일", "대학", "학과(부)", "학년", "학번", "지원요청금액", "회의 일시", "회의 장소", "회의 안건", "회의 내용", "지출 금액", "인보이스 번호", "청구처 회사명" 등)
                value/mixed 가 아니면 빈 문자열 ("").

[가장 중요한 판단 기준 — 서식 틀(Template)로써의 동작]
이 서식은 **원본을 만든 당사자가 아니라, 전혀 다른 사람·다른 조직이 자기 문서를 만들 때** 재사용되는 '빈 양식 틀'입니다. 그러므로:
- 표 내부의 작성 내용(이름 "김태진", 연락처, 이메일, 소속 학교/학과, 학번, 과제명, 사업계획 요약 본문 서술 등)은 이 특정 신청자가 채워 넣은 인스턴스 값이므로 **반드시 value (또는 mixed)로 분류하여 빈 슬롯으로 비워야 합니다.** 글자가 그대로 박히면 서식 템플릿이 될 수 없습니다!
- 문서를 발행한 쪽(발신자·공급자·주최자·작성자) **자신의** 이름, 회사명, 주소, 전화·이메일, 사업자/세금 등록번호, 로고도 전부 새로 채워야 하는 value 입니다.
- label 은 **어느 회사가 쓰든 글자 그대로 인쇄되는 항목명**뿐입니다.

[규칙]
- 입력 기하 힌트에 있는 모든 표 셀 id(예: "t0-r0c0", "t0-r0c1")와 외곽 블록 id(예: "L0", "img0")를 빠짐없이 1:1로 분류하십시오.
- 좌표·크기·비율은 절대 출력하지 마십시오. 이미 정밀 실측되어 있습니다.
- 첨부된 페이지 이미지의 시각적 형태(테두리, 빈 여백, 정렬)를 힌트와 대조하여 판단하십시오.

[문서: {source} / 유형: {doc_type}]
{hint_text}
"""


def render_blocks(page: "PageGeometry") -> str:
    """단순 텍스트 블록 목록 렌더링 (하위 호환용)."""
    lines = []
    for b in page.classifiable():
        position = f"r{b.row}c{b.col}" if b.row is not None else b.align
        preview = b.text[:TEXT_PREVIEW_CHARS]
        lines.append(f'{b.id} | {b.kind} | {position} | size={b.size} | "{preview}"')
    return "\n".join(lines)


def build_classification_prompt(
    source: str,
    page: "PageGeometry",
    hint_text: Optional[str] = None,
) -> str:
    """비전 멀티모달 프롬프트 문자열을 생성합니다."""
    effective_hint = hint_text or HintBuilder.build_hint_text(page)
    return VISION_CLASSIFICATION_PROMPT.format(
        source=source,
        doc_type=page.doc_type,
        hint_text=effective_hint,
    )
