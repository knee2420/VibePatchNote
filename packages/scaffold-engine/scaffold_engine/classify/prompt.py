"""Stage B 프롬프트.

옛 `dsl/` 프롬프트와 결정적으로 다른 점: 모델에게 HTML 도, 좌표도 요구하지 않는다.
실측된 블록 목록을 주고 **"이 글자는 새 문서를 쓸 때 지우고 다시 쓰는가?"** 하나만
판정시킨다. 그래서 문서 종류가 바뀌어도 프롬프트를 갈아엎을 필요가 없다.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover
    from scaffold_engine.extract.geometry import PageGeometry

# 블록 텍스트 미리보기 길이 (프롬프트 비대화 방지)
TEXT_PREVIEW_CHARS = 80

CLASSIFICATION_PROMPT = """당신은 문서 서식 분석기입니다. 아래는 PDF 에서 기계적으로 추출한 블록 목록입니다.
목표: 이 문서를 '내용을 비운 재사용 가능한 빈 서식'으로 만들기 위해, 각 블록에서
'항상 인쇄되어 있는 고정 부분'과 '매번 새로 채우는 값'을 갈라내는 것입니다.

role 정의:
- title       : 문서 전체 제목 (예: "회의비 사용 내역")
- label       : 서식에 늘 인쇄된 항목명/머리글만 있는 블록 (예: "일 시", "Billing info", "Description")
- value       : 블록 전체가 이 문서 한 부에만 해당하는 인스턴스 데이터
                (날짜, 사람/회사 이름, 주소, 금액, 문서번호, 본문 내용, 로고 이미지)
- mixed       : 한 블록 안에 고정 라벨과 인스턴스 데이터가 **함께** 있는 경우
                (예: "Invoice 000081709" -> 'Invoice'는 고정, '000081709'는 데이터)
                (예: "Contact support: a@b.io" -> 이메일만 데이터)
- decoration  : 페이지 번호, 저작권/약관 상용구 등 서식과 무관한 장식

value_text : role 이 value 또는 mixed 일 때, 블록 텍스트에서 **비워야 할 부분만** 원문 그대로 복사.
             - value  : 블록 텍스트 전체를 그대로 복사
             - mixed  : 데이터 부분만 정확히 복사 (고정 라벨은 제외)
             - 그 외  : 빈 문자열
             반드시 원문에 실제로 존재하는 문자열이어야 합니다. 요약하거나 바꾸지 마세요.

slot_label : 그 자리에 무엇을 넣어야 하는지 설명하는 짧은 한국어 라벨
             (예: "회의 일시", "공급자 회사명", "인보이스 번호"). value/mixed 가 아니면 빈 문자열.

[가장 중요한 판단 기준 — 누가 이 서식을 다시 쓰는가]
이 서식은 **원본을 만든 당사자가 아니라, 전혀 다른 사람·다른 조직이 자기 문서를
만들 때** 재사용됩니다. 그러므로:
- 문서를 발행한 쪽(발신자·공급자·주최자·작성자) **자신의** 이름, 회사명, 주소,
  전화·이메일, 사업자/세금 등록번호, 로고도 전부 새로 채워야 하는 value 입니다.
  "이 회사 문서에서는 늘 같은 값이니 고정 서식이다" 라고 판단하면 **틀립니다.**
  발행처 상호·주소·등록번호는 서식을 물려받는 쪽에서 자기 것으로 바꿔 넣습니다.
- 수신자 정보만 value 로 보고 발신자 정보는 고정으로 두는 실수를 하지 마십시오.
  양쪽 다 value 입니다.
- label 은 **어느 회사가 쓰든 글자 그대로 인쇄되는 항목명**뿐입니다.
  (예: "Company info", "Billing info", "Description", "일 시", "지출금액")

규칙:
- 입력에 있는 id 만 사용하고, 모든 블록을 빠짐없이 분류하세요.
- 좌표·크기·비율은 절대 출력하지 마세요. 이미 정밀 측정되어 있습니다.
- 텍스트가 비어 있어도 '채워 넣을 자리'라면 value 입니다.
- 판단 기준은 "새 문서를 이 서식으로 쓸 때 이 글자를 지우고 다시 쓰는가?" 입니다.

[문서: {source} / 유형: {doc_type}]
{blocks}
"""


def render_blocks(page: "PageGeometry") -> str:
    """모델에게 보여줄 블록 목록. 좌표는 주지 않고 위치 힌트만 준다."""
    lines = []
    for b in page.classifiable():
        position = f"r{b.row}c{b.col}" if b.row is not None else b.align
        preview = b.text[:TEXT_PREVIEW_CHARS]
        lines.append(f'{b.id} | {b.kind} | {position} | size={b.size} | "{preview}"')
    return "\n".join(lines)


def build_classification_prompt(source: str, page: "PageGeometry") -> str:
    return CLASSIFICATION_PROMPT.format(
        source=source, doc_type=page.doc_type, blocks=render_blocks(page)
    )
