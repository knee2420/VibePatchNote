"""Scaffold Engine — Outline & Element Extraction Prompts.

Step 1 (Outline Tree 계층 목차 추출)과 Step 2 (Elements 컴포넌트 바인딩) 프롬프트 템플릿입니다.
"""
from __future__ import annotations


def build_outline_prompt(filename: str, text_context: str) -> str:
    """Step 1: 문서 대주제(Level 1) 및 세부 항목(Level 2) 목차 트리 추출 프롬프트."""
    return f"""당신은 고정밀 비즈니스 문서 구조화 전문가입니다.
문서 '{filename}'의 내용을 분석하여, 목차(Outline Tree)와 세부 항목들을 계층적으로 빠짐없이 추출하세요.

[핵심 추출 지침]
1. 문서의 대단락(Level 1: 회의 차수, 주요 장 등)뿐만 아니라, 표/서식 내부의 세부 항목(Level 2: 일 시, 장 소, 참석자, 안 건, 회의내용, 지출금액, 증빙자료 등)을 반드시 하위 목차로 세분화하여 계층적으로 추출하세요.
2. [순수 항목명 유지] 제목(title)에는 괄호로 일자나 장소 등 값을 임의로 덧붙이지 마세요 (예: '일 시 (2018.11.08)' ❌ -> '일 시' ⭕, '장 소 (6공학관)' ❌ -> '장 소' ⭕). 실제 값은 purpose나 세부 엘리먼트에 들어가므로 제목은 순수 항목 라벨만 기재하세요.
3. 영수증이나 지출금액에만 매몰되지 말고 문서에 기재된 주요 기술 논의, 진행 안건, 의결 사항을 빠짐없이 보존하세요.
4. 각 섹션의 비즈니스 목적(purpose)을 명확하게 1줄로 기술하세요.
5. 각 섹션의 페이지 번호(page, 1-based)와 추정 구역 box_2d [ymin, xmin, ymax, xmax] (0~1000 상대 비율)를 기재하세요.

[문서 실측 텍스트 정보]
{text_context}

반드시 아래 JSON 스키마 규격으로만 응답하세요:
{{
  "document_title": "{filename}",
  "total_pages": 1,
  "outlines": [
    {{
      "id": "out-1",
      "level": 1,
      "title": "1차 회의 (2018.11.08) - 회의비 사용 내역",
      "page": 1,
      "box_2d": [70, 80, 700, 920],
      "purpose": "1차 회의 기본 정보 및 회의비 집행 내역",
      "children": [
        {{
          "id": "out-1-1",
          "level": 2,
          "title": "일 시",
          "page": 1,
          "box_2d": [110, 90, 160, 900],
          "purpose": "회의 일시 확인",
          "children": []
        }}
      ]
    }}
  ]
}}
"""


def build_elements_prompt(filename: str, outline_summary: str, geometry_summary: str) -> str:
    """Step 2: 각 아웃라인 노드에 소속된 세부 컴포넌트(Element) 추출 및 바인딩 프롬프트."""
    return f"""당신은 고정밀 문서 컴포넌트 분석 엔진입니다.
문서 '{filename}'의 실측 기하 데이터와 앞서 정립된 [아웃라인 목차]를 바탕으로,
각 아웃라인에 소속된 세부 컴포넌트(Element)들을 정밀 추출하고 outline_id로 연결하세요.

[기존 추출된 아웃라인 목록]
{outline_summary}

[실측 기하 데이터]
{geometry_summary}

지침:
1. 추출할 엘리먼트 타입:
   - 'table': 표/데이터 테이블
   - 'form_field': 인적사항, 일시/장소, 서명란 등 Key-Value 입력칸
   - 'list': 개조식 글머리 기호 목록
   - 'paragraph': 서술형 핵심 문단
   - 'media': 영수증/증빙/도장 첨부 영역
2. 각 엘리먼트가 어떤 아웃라인에 속하는지 반드시 정확한 'outline_id'(예: out-1-1)를 지정하세요.
3. [원문 보존 원칙] 문서에 기재된 숫자, 인명, 호실, 고유명사는 임의로 요약·의역(Abstractive)하지 말고 원문 텍스트 그대로(Literal Extractive) 추출하세요. (예: '6공학관 6108-1호', '4명', '₩40,000' 등 원문 값 유지)
4. box_2d는 [ymin, xmin, ymax, xmax] 0~1000 상대 좌표로 지정하세요.

반드시 다음 JSON 형식으로만 응답하세요:
{{
  "elements": [
    {{
      "id": "elem-1",
      "outline_id": "out-1-1",
      "type": "form_field",
      "label": "일 시",
      "page": 1,
      "box_2d": [121, 122, 160, 878],
      "content_summary": "2018.11.08",
      "structured_data": {{"key": "일 시", "value": "2018.11.08"}}
    }}
  ]
}}
"""
