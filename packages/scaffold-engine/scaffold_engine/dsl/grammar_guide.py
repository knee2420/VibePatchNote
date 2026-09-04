"""Tiptap Scaffold Grammar & DSL Guidelines.

에디터와 100% 호환되는 마크업 태그 규칙과 마크다운 변환 규칙입니다.
"""

TIPTAP_GRAMMAR_GUIDE = """
### [Tiptap Scaffold 허용 HTML 및 Markdown 문법 규칙]

1. 다단 컬럼 그룹 (Column Group)
- 2단 그리드:
  <div data-type="column-group" data-cols="2" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.25rem;">
    <div data-type="column">...좌측 내용...</div>
    <div data-type="column" style="text-align: right;">...우측 내용...</div>
  </div>
  *대응 Markdown:
  :::column-group
  :::column
  좌측 마크다운
  :::
  :::column
  우측 마크다운
  :::
  :::

2. 인라인 빈칸/슬롯 (Scaffold Slot) - 매우 중요!
- 사용자가 직접 채워 넣을 수 있는 입력 칸입니다. 태그 내부 텍스트는 반드시 비워두고, placeholder 로만 힌트를 줍니다.
  <span data-type="scaffold-slot" data-placeholder="플레이스홀더 텍스트"></span>
  *대응 Markdown: [ 플레이스홀더 텍스트 ]

3. 와이어프레임 표 (Scaffold Table)
- <table class="scaffold-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <thead>
      <tr style="border-bottom: 1px solid #e2e8f0; color: #64748b;">
        <th style="text-align: left;">항목명</th>
        <th style="text-align: right;">금액</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span data-type="scaffold-slot" data-placeholder="품목명"></span></td>
        <td style="text-align: right;">$<span data-type="scaffold-slot" data-placeholder="0.00"></span></td>
      </tr>
      <tr>
        <td colspan="1" style="text-align: right; font-weight: bold;">Total:</td>
        <td style="text-align: right; font-weight: bold;">$<span data-type="scaffold-slot" data-placeholder="0.00"></span></td>
      </tr>
    </tbody>
  </table>
  *대응 Markdown: 표준 마크다운 표 문법 (| ... | ... |)
""".strip()
