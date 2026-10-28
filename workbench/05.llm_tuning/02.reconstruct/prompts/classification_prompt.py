"""
[02.reconstruct] Stage B — 실측 블록 역할 분류 및 슬롯 라벨 판정 프롬프트.
모델에게 좌표나 HTML 작성을 요구하지 않고,
실측된 블록 목록에서 '고정 서식(label)'과 '새로 채울 데이터(value/mixed)'를 갈라내고,
정확한 한국어 안내 라벨(slot_label)을 부여하도록 지시합니다.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from schemas.geometry import PageGeometry

TEXT_PREVIEW_CHARS = 80

CLASSIFICATION_PROMPT_TEMPLATE = """당신은 고정밀 문서 서식 분석기입니다. 아래는 PDF 에서 기계적으로 실측 추출한 블록 목록입니다.
목표: 이 문서를 '내용을 비운 재사용 가능한 빈 서식(Wireframe)'으로 만들기 위해, 각 블록에서
'항상 인쇄되어 있는 고정 부분'과 '매번 새로 채우는 값(슬롯)'을 갈라내는 것입니다.

role 정의:
- title       : 문서 전체 제목 (예: "회의비 사용 내역", "Invoice")
- label       : 서식에 늘 인쇄된 항목명/머리글만 있는 블록 (예: "일 시", "Billing info", "Description")
- value       : 블록 전체가 이 문서 한 부에만 해당하는 인스턴스 데이터 (슬롯이 됨)
                (날짜, 사람/회사 이름, 주소, 금액, 문서번호, 본문 내용, 로고 이미지 등)
- mixed       : 한 블록 안에 고정 라벨과 인스턴스 데이터가 **함께** 있는 경우
                (예: "Invoice 000081709" -> 'Invoice'는 고정, '000081709'는 데이터)
                (예: "Contact support: a@b.io" -> 이메일만 데이터)
- decoration  : 페이지 번호, 저작권/약관 상용구 등 서식과 무관한 장식

value_text : role 이 value 또는 mixed 일 때, 블록 텍스트에서 **비워야 할 부분만** 원문 그대로 복사.
             - value  : 블록 텍스트 전체를 그대로 복사
             - mixed  : 데이터 부분만 정확히 복사 (고정 라벨은 제외)
             - 그 외  : 빈 문자열
             반드시 원문에 실제로 존재하는 문자열이어야 합니다. 요약하거나 바꾸지 마세요.

slot_label : 그 자리에 무엇을 넣어야 하는지 설명하는 명확하고 친절한 짧은 한국어 라벨
             (예: "회의 일시", "회의 장소", "참석자 수 및 명단", "회의 안건", "회의 내용", "지출 금액",
                  "증빙자료 첨부란", "회사 로고", "공급자 회사명", "인보이스 번호", "청구 총금액" 등).
             value/mixed 가 아니면 빈 문자열.

[가장 중요한 판단 기준 — 누가 이 서식을 다시 쓰는가]
이 서식은 원본을 만든 당사자가 아니라, **전혀 다른 사람·다른 조직이 자기 문서를 만들 때** 재사용됩니다.
- 발행처(공급자·주최자·작성자) 자신의 이름, 회사명, 주소, 전화/이메일, 등록번호, 로고도 전부 새로 채워야 하는 value/mixed 입니다.
- 수신자 정보뿐만 아니라 발신자 정보도 다른 사람이 쓸 때는 바꿔야 하므로 value 입니다.
- label 은 어느 회사가 쓰든 글자 그대로 인쇄되는 항목명뿐입니다 (예: "Company info", "Billing info", "일 시").

규칙:
- 입력에 주어진 id 만 사용하고, 모든 블록을 빠짐없이 분류하세요.
- 좌표, 크기, 비율은 절대 출력하지 마세요 (이미 정밀 측정되어 있습니다).
- 텍스트가 [IMAGE] 라면 role="value", slot_label="회사 로고" 등으로 판정하세요.

[문서: {doc_name} (p.{page_num}) / 유형: {doc_type}]
{blocks_text}
"""


def render_blocks_for_prompt(page: "PageGeometry") -> str:
    lines = []
    for b in page.classifiable():
        pos = f"r{b.row}c{b.col}" if b.row is not None else b.align
        preview = b.text[:TEXT_PREVIEW_CHARS]
        lines.append(f'{b.id} | {b.kind} | {pos} | size={b.size} | "{preview}"')
    return "\n".join(lines)


def build_classification_prompt(doc_name: str, page: "PageGeometry") -> str:
    return CLASSIFICATION_PROMPT_TEMPLATE.format(
        doc_name=doc_name,
        page_num=page.page,
        doc_type=page.doc_type,
        blocks_text=render_blocks_for_prompt(page),
    )
