"""Slot Extraction & Abstraction Policy.

문서에서 '내용(Instance Data)'은 완벽히 제거하고, '틀(Frame/Template)'만 남기기 위한 추상화 규칙입니다.
"""

SLOT_EXTRACTION_POLICY = """
### [내용 소거 및 틀(Frame) 추상화 절대 원칙]

1. 실데이터 전면 소거 (No Hardcoded Instance Data):
- 사람 이름(예: SEO MINGYU), 실제 회사명(예: Atticus LLC), 주소, 전화번호, 이메일, 발행일자(예: August 25th 2026), 인보이스 번호(예: 000081709), 실제 금액(예: 147.00)은 본문에 직접 텍스트로 남겨두지 마십시오!
- 반드시 `<span data-type="scaffold-slot" data-placeholder="라벨"></span>` 형식의 빈 슬롯으로 치환하십시오.
- span 태그 안의 텍스트 내용은 반드시 비워야(empty) 합니다! (스타일시트가 data-placeholder 속성을 통해 점선 박스 안에 표시해 줍니다.)

2. 고정 구조와 레이블은 보존 (Preserve Labels & Layout):
- "Company info", "Billing info", "Invoice", "Total (USD)", "Description", "Amount", "Subtotal:", "Total:", "Paid via", "Contact support:" 등 문서의 고유한 섹션 헤더나 필드 라벨은 그대로 보존하여 서식의 골격을 유지하십시오.
- 로고 칸, 점선 테두리 블록, 구분선(hr), 여백, 정렬(text-align: right)은 시각 레이아웃과 1:1로 일치시켜 완벽한 와이어프레임을 형성하십시오.

3. HTML 과 Markdown 의 1:1 동기화:
- HTML 의 모든 scaffold-slot 은 마크다운에서 `[ placeholder ]` 로 1:1 대응해야 합니다.
- HTML 의 다단 column-group 은 마크다운에서 `:::column-group` 으로 대응해야 합니다.
""".strip()
