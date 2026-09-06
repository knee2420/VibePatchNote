import type { ScaffoldExtractResult } from '../types';

/**
 * 1단계 [가장 쉬운 성공 사례]: Atticus LLC Invoice (인보이스/청구서)
 * 특징:
 * - 상단: 2단 분할 (좌측: 공급자 로고/주소 칸, 우측: 인보이스 번호/날짜/청구 칸)
 * - 중간: 품목 견적 테이블 (Description / Amount / Total)
 * - 하단: 소계 및 총계 (Subtotal / Total)
 *
 * *모든 실제 금액과 인물명 등 내용은 싹 빠지고 '틀'과 빈 슬롯만 남김!*
 */
export function extractAtticusInvoiceScaffold(): ScaffoldExtractResult {
  const htmlContent = `
<div data-type="column-group" data-cols="2" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.25rem;">
  <div data-type="column" style="display: flex; flex-direction: column; justify-content: center; min-height: 130px; border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 1.25rem;">
    <span style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">[ LOGO / BRAND ]</span>
    <h1 style="margin: 0; font-size: 2.5rem; font-weight: 800; color: #2563eb; font-family: serif; letter-spacing: -0.03em;">
      <span data-type="scaffold-slot" data-mapping-num="1" data-bbox="[83, 101, 154, 535]" data-placeholder="상호 / 로고명 (예: Atticus)"></span>
    </h1>
  </div>
  <div data-type="column" style="text-align: right; border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 1rem; font-size: 12px; color: #475569; line-height: 1.5;">
    <p style="margin: 0 0 6px 0; font-weight: 600; color: #1e293b;">
      <span data-type="scaffold-slot" data-mapping-num="2" data-bbox="[35, 460, 48, 535]" data-placeholder="August 25th 2026"></span>
    </p>
    <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: bold;">Company info</p>
    <p style="margin: 2px 0 0 0; font-weight: 700; color: #0f172a;">
      <span data-type="scaffold-slot" data-mapping-num="2" data-bbox="[62, 470, 75, 535]" data-placeholder="공급자 회사명 (예: Atticus LLC)"></span>
    </p>
    <p style="margin: 2px 0 0 0;">
      <span data-type="scaffold-slot" data-mapping-num="2" data-bbox="[74, 399, 86, 535]" data-placeholder="도로명 주소 (예: 1309 Coffeen Ave. Ste. 2513)"></span>
    </p>
    <p style="margin: 2px 0 0 0;">
      <span data-type="scaffold-slot" data-mapping-num="2" data-bbox="[86, 454, 122, 535]" data-placeholder="도시 / 주 / 우편번호 / 국가"></span>
    </p>
    <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b;">
      Sales Tax ID: <span data-type="scaffold-slot" data-mapping-num="2" data-bbox="[125, 355, 134, 535]" data-placeholder="EU / UK / 사업자등록번호"></span>
    </p>
    <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 700; color: #1e293b;">
      Invoice <span data-type="scaffold-slot" data-mapping-num="2" data-bbox="[147, 444, 159, 535]" data-placeholder="000081709"></span>
    </p>
  </div>
</div>

<div data-type="column-group" data-cols="2" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
  <div data-type="column" style="border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 1rem; font-size: 12px; color: #334155; line-height: 1.6;">
    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Billing info</p>
    <p style="margin: 0; font-weight: 600; color: #0f172a;">
      <span data-type="scaffold-slot" data-mapping-num="3" data-bbox="[197, 60, 210, 120]" data-placeholder="수신자 회사/단체명 (예: qround)"></span>
    </p>
    <p style="margin: 0; font-weight: 600; color: #0f172a;">
      <span data-type="scaffold-slot" data-mapping-num="3" data-bbox="[210, 60, 222, 120]" data-placeholder="수신자 담당자명 (예: SEO MINGYU)"></span>
    </p>
    <p style="margin: 0;">
      <span data-type="scaffold-slot" data-mapping-num="3" data-bbox="[222, 60, 234, 120]" data-placeholder="수신자 상세 주소 (예: seoul, 40-6)"></span>
    </p>
    <p style="margin: 0;">
      <span data-type="scaffold-slot" data-mapping-num="3" data-bbox="[234, 60, 246, 120]" data-placeholder="도시 / 국가 (예: South Korea)"></span>
    </p>
  </div>
  <div data-type="column" style="text-align: right; border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; justify-content: center;">
    <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b;">Total (USD)</p>
    <h1 style="margin: 4px 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
      $<span data-type="scaffold-slot" data-mapping-num="4" data-bbox="[194, 464, 214, 535]" data-placeholder="147.00"></span>
    </h1>
    <p style="margin: 0; font-size: 11px; color: #64748b;">
      Paid via <span data-type="scaffold-slot" data-mapping-num="4" data-bbox="[216, 461, 226, 535]" data-placeholder="credit card"></span>
    </p>
  </div>
</div>

<div style="border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 1rem; background-color: #ffffff; margin-bottom: 2rem;">
  <hr style="border: none; border-top: 2px solid #3b82f6; margin: 0 0 1rem 0;" />
  <table class="scaffold-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
    <thead>
      <tr style="border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
        <th style="padding: 8px 4px; text-align: left; width: 60%; font-weight: 600;">Description</th>
        <th style="padding: 8px 4px; text-align: right; width: 20%; font-weight: 600;">Amount</th>
        <th style="padding: 8px 4px; text-align: right; width: 20%; font-weight: 600;">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 4px;">
          <p style="margin: 0; font-weight: 600; color: #1e293b;">
            <span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[318, 63, 330, 160]" data-placeholder="품목 또는 서비스명 (예: Atticus)"></span>
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">
            <span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[332, 63, 340, 162]" data-placeholder="추가 세부설명 (예: One-time payment ($147.00))"></span>
          </p>
        </td>
        <td style="padding: 12px 4px; text-align: right; vertical-align: top; font-weight: 500; color: #334155;">
          $<span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[318, 421, 330, 532]" data-placeholder="147.00"></span>
        </td>
        <td style="padding: 12px 4px; text-align: right; vertical-align: top; font-weight: 600; color: #0f172a;">
          $<span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[318, 421, 330, 532]" data-placeholder="147.00"></span>
        </td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td colspan="2" style="padding: 10px 4px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">Subtotal:</td>
        <td style="padding: 10px 4px; text-align: right; font-weight: 600; color: #1e293b;">
          $<span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[358, 428, 368, 532]" data-placeholder="147.00"></span>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding: 10px 4px; text-align: right; font-size: 12px; color: #0f172a; font-weight: 700;">Total:</td>
        <td style="padding: 10px 4px; text-align: right; font-weight: 800; font-size: 14px; color: #0f172a;">
          $<span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[382, 442, 392, 532]" data-placeholder="147.00"></span>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.8; margin-top: 2rem;">
  <p style="margin: 0;">
    Contact support: <span data-type="scaffold-slot" data-mapping-num="6" data-bbox="[583, 222, 594, 373]" data-placeholder="support@atticus.io"></span>
  </p>
  <p style="margin: 0; text-decoration: underline; color: #6366f1;">
    <span data-type="scaffold-slot" data-mapping-num="6" data-bbox="[600, 182, 608, 413]" data-placeholder="Click here to manage your billing details and view purchase history"></span>
  </p>
  <p style="margin: 8px 0 0 0; font-size: 10px; color: #cbd5e1;">
    Your order was processed by <span data-type="scaffold-slot" data-mapping-num="6" data-bbox="[627, 159, 636, 435]" data-placeholder="ThriveCart. Copyright © 2026. All rights reserved."></span>
  </p>
</div>
`.trim();

  const markdownContent = `
:::column-group
:::column
# [ 상호 / 로고명 (예: Atticus) ]
:::
:::column
[ August 25th 2026 ]  
**Company info**  
**[ 공급자 회사명 (예: Atticus LLC) ]**  
[ 도로명 주소 (예: 1309 Coffeen Ave. Ste. 2513) ]  
[ 도시 / 주 / 우편번호 / 국가 ]  
Sales Tax ID: [ EU / UK / 사업자등록번호 ]  
**Invoice [ 000081709 ]**  
:::
:::

:::column-group
:::column
**Billing info**  
**[ 수신자 회사/단체명 (예: qround) ]**  
[ 수신자 담당자명 (예: SEO MINGYU) ]  
[ 수신자 상세 주소 (예: seoul, 40-6) ]  
[ 도시 / 국가 (예: South Korea) ]  
:::
:::column
**Total (USD)**  
# $[ 147.00 ]  
Paid via [ credit card ]  
:::
:::

| Description | Amount | Total |
| :--- | :---: | :---: |
| **[ 품목 또는 서비스명 (예: Atticus) ]**<br>([ 추가 세부설명 (예: One-time payment ($147.00)) ]) | $[ 147.00 ] | $[ 147.00 ] |
| **Subtotal:** | | $[ 147.00 ] |
| **Total:** | | **$[ 147.00 ]** |

---
Contact support: [ support@atticus.io ]  
[ Click here to manage your billing details and view purchase history ]  
Your order was processed by [ ThriveCart. Copyright © 2026. All rights reserved. ]
`.trim();

  return {
    meta: {
      id: 'atticus-invoice',
      title: 'Atticus LLC Invoice 정밀 와이어프레임 틀',
      targetDoc: 'atticus-invoice',
      sourcePdfFileName: 'Atticus LLC_ Invoice 000081709.pdf',
      description: '원본 인보이스의 5개 영역(로고/회사정보, 청구지/총액, 견적표, 푸터) 배치와 1:1 일치하는 정밀 와이어프레임',
      difficulty: 'easy',
    },
    htmlContent,
    markdownContent,
  };
}

/**
 * 2단계: 11월 디딤돌 회의록 (표 중심 행정 서식)
 */
export function extractMeetingMinutesScaffold(): ScaffoldExtractResult {
  const htmlContent = `
<h2 style="text-align: center; margin: 0 0 1.5rem 0; font-size: 1.35rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">회의비 사용 내역</h2>

<table class="scaffold-table" style="width: 100%; border-collapse: collapse; table-layout: fixed; border: 1.5px solid #cbd5e1; font-size: 13px;">
  <colgroup>
    <col style="width: 19%;" />
    <col style="width: 81%;" />
  </colgroup>
  <tbody>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: 700; color: #334155; text-align: center; border-right: 1px solid #e2e8f0;">일 시</th>
      <td style="padding: 10px 14px;">
        <span data-type="scaffold-slot" data-mapping-num="1" data-bbox="[121, 266, 166, 878]" data-placeholder="YYYY.MM.DD (예: 2018.11.08)"></span>
      </td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: 700; color: #334155; text-align: center; border-right: 1px solid #e2e8f0;">장 소</th>
      <td style="padding: 10px 14px;">
        <span data-type="scaffold-slot" data-mapping-num="2" data-bbox="[166, 266, 207, 878]" data-placeholder="회의 장소 (예: 6공학관 6108-1호)"></span>
      </td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: 700; color: #334155; text-align: center; border-right: 1px solid #e2e8f0;">참 석 자</th>
      <td style="padding: 10px 14px;">
        <span data-type="scaffold-slot" data-mapping-num="3" data-bbox="[207, 266, 265, 878]" data-placeholder="참석 인원 및 명단 (예: 4명)"></span>
      </td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: 700; color: #334155; text-align: center; border-right: 1px solid #e2e8f0;">안 건</th>
      <td style="padding: 10px 14px;">
        <span data-type="scaffold-slot" data-mapping-num="4" data-bbox="[265, 266, 313, 878]" data-placeholder="회의 주요 안건 (예: GPS + 동영상 촬영 및 프로그램 테스트 최종 확인)"></span>
      </td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 12px; background-color: #f8fafc; font-weight: 700; color: #334155; text-align: center; vertical-align: middle; border-right: 1px solid #e2e8f0;">회의내용</th>
      <td style="padding: 14px; min-height: 140px; height: 140px; vertical-align: top;">
        <p style="margin: 0 0 6px 0;"><span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[313, 266, 360, 878]" data-placeholder="1. 회의 안건 1 관련 논의 및 결정 사항"></span></p>
        <p style="margin: 0 0 6px 0;"><span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[360, 266, 410, 878]" data-placeholder="2. 회의 안건 2 관련 논의 및 결정 사항"></span></p>
        <p style="margin: 0;"><span data-type="scaffold-slot" data-mapping-num="5" data-bbox="[410, 266, 479, 878]" data-placeholder="3. 추후 진행 사항 및 결과보고 회의 내용"></span></p>
      </td>
    </tr>
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <th style="padding: 10px 12px; background-color: #f8fafc; font-weight: 700; color: #334155; text-align: center; border-right: 1px solid #e2e8f0;">지출금액</th>
      <td style="padding: 10px 14px;">
        ₩ <span data-type="scaffold-slot" data-mapping-num="6" data-bbox="[479, 266, 520, 878]" data-placeholder="0,000 (예: 40,000)"></span>
      </td>
    </tr>
    <tr>
      <th style="padding: 16px 12px; background-color: #f8fafc; font-weight: 700; color: #334155; text-align: center; vertical-align: middle; border-right: 1px solid #e2e8f0; line-height: 1.5;">
        증빙자료<br />(신용카드<br />영수증,<br />현금영수증 등)
      </th>
      <td style="padding: 24px 16px; min-height: 280px; height: 280px; vertical-align: middle; text-align: center; background-color: #fafafa;">
        <div style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 28px; background-color: #ffffff; color: #64748b;">
          <p style="margin: 0 0 8px 0; font-weight: 700; color: #475569;">[ 영수증 및 증빙자료 첨부 영역 ]</p>
          <span data-type="scaffold-slot" data-mapping-num="7" data-bbox="[520, 121, 854, 878]" data-placeholder="증빙자료 이미지 첨부 또는 영수증 부착"></span>
        </div>
      </td>
    </tr>
  </tbody>
</table>

<div style="text-align: center; margin-top: 1.5rem; font-size: 11px; color: #94a3b8;">
  - 1 -
</div>
`.trim();

  const markdownContent = `
# 회의비 사용 내역

| 구분 | 내용 |
| :--- | :--- |
| **일 시** | [ YYYY.MM.DD (예: 2018.11.08) ] |
| **장 소** | [ 회의 장소 (예: 6공학관 6108-1호) ] |
| **참 석 자** | [ 참석 인원 및 명단 (예: 4명) ] |
| **안 건** | [ 회의 주요 안건 (예: GPS + 동영상 촬영 및 프로그램 테스트 최종 확인) ] |
| **회의내용** | 1. [ 회의 안건 1 관련 논의 및 결정 사항 ]<br>2. [ 회의 안건 2 관련 논의 및 결정 사항 ]<br>3. [ 추후 진행 사항 및 결과보고 회의 내용 ] |
| **지출금액** | ₩ [ 0,000 (예: 40,000) ] |
| **증빙자료** | [ 영수증 및 증빙자료 첨부 영역 ] |

<center>- 1 -</center>
`.trim();

  return {
    meta: {
      id: 'meeting-minutes',
      title: '11월 디딤돌 회의록 정밀 와이어프레임 서식',
      targetDoc: 'meeting-minutes',
      sourcePdfFileName: '11월 디딤돌 회의록.pdf',
      description: '원본 회의록의 19%:81% 정밀 열 너비와 대형 증빙부착 영역(세로 45%)을 완벽히 모사한 행정 서식 와이어프레임',
      difficulty: 'medium',
    },
    slots: [
      { id: 'slot-1', number: 1, label: '일시 (YYYY.MM.DD)', box_2d: [121, 266, 166, 878], pageNumber: 1 },
      { id: 'slot-2', number: 2, label: '회의 장소', box_2d: [166, 266, 207, 878], pageNumber: 1 },
      { id: 'slot-3', number: 3, label: '참석자 인원 및 명단', box_2d: [207, 266, 265, 878], pageNumber: 1 },
      { id: 'slot-4', number: 4, label: '회의 주요 안건', box_2d: [265, 266, 313, 878], pageNumber: 1 },
      { id: 'slot-5', number: 5, label: '상세 회의 내용 (개조식 목록)', box_2d: [313, 266, 479, 878], pageNumber: 1 },
      { id: 'slot-6', number: 6, label: '총 지출 금액 (원)', box_2d: [479, 266, 520, 878], pageNumber: 1 },
      { id: 'slot-7', number: 7, label: '영수증 및 증빙자료 첨부란 (대형 공간)', box_2d: [520, 121, 854, 878], pageNumber: 1 },
    ],
    htmlContent,
    markdownContent,
  };
}


/**
 * 3단계: 24082026164355-0001 (브로셔 / 다단 카탈로그)
 */
export function extractBrochureScaffold(): ScaffoldExtractResult {
  const htmlContent = `
<div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 1.5rem;">
  <h1 style="margin:0; color: #a5b4fc;">[ 제품 / 브랜드 메인 타이틀 ]</h1>
  <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">
    <span data-type="scaffold-slot" data-placeholder="브랜드 핵심 캐치프레이즈 및 슬로건을 입력하세요"></span>
  </p>
</div>

<div data-type="column-group" data-cols="3">
  <div data-type="column">
    <h3 style="margin-top:0; color: #4338ca;">01. 제품 특징</h3>
    <p><span data-type="scaffold-slot" data-placeholder="핵심 기술 및 특허 정보 요약 작성"></span></p>
    <p><span data-type="scaffold-slot" data-placeholder="생체이용률 / 흡수율 등 효능 설명"></span></p>
  </div>
  <div data-type="column">
    <h3 style="margin-top:0; color: #4338ca;">02. 원료 및 성분</h3>
    <p><strong>주원료:</strong> <span data-type="scaffold-slot" data-placeholder="핵심 유효 성분명"></span></p>
    <p><strong>포장단위:</strong> <span data-type="scaffold-slot" data-placeholder="예: 400mg x 100정"></span></p>
  </div>
  <div data-type="column">
    <h3 style="margin-top:0; color: #4338ca;">03. 섭취 방법</h3>
    <p><strong>권장용법:</strong> <span data-type="scaffold-slot" data-placeholder="1일 1회, 1회 1정 물과 함께 섭취"></span></p>
    <p><strong>주의사항:</strong> <span data-type="scaffold-slot" data-placeholder="보관 시 직사광선을 피할 것"></span></p>
  </div>
</div>

<table class="scaffold-table" style="margin-top: 1.5rem;">
  <thead>
    <tr>
      <th>연령 구분</th>
      <th>1회 권장량</th>
      <th>복용 간격</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>성인 (15세 이상)</td>
      <td><span data-type="scaffold-slot" data-placeholder="1정"></span></td>
      <td><span data-type="scaffold-slot" data-placeholder="취침 전 1회"></span></td>
    </tr>
    <tr>
      <td>청소년 (12~14세)</td>
      <td><span data-type="scaffold-slot" data-placeholder="1/2정"></span></td>
      <td><span data-type="scaffold-slot" data-placeholder="취침 전 1회"></span></td>
    </tr>
  </tbody>
</table>
`.trim();

  const markdownContent = `
# [ 제품 / 브랜드 메인 타이틀 ]
* [ 브랜드 핵심 캐치프레이즈 및 슬로건을 입력하세요 ]

:::column-group
:::column
### 01. 제품 특징
[ 핵심 기술 및 특허 정보 요약 작성 ]
:::
:::column
### 02. 원료 및 성분
* **주원료:** [ 핵심 유효 성분명 ]
* **포장단위:** [ 예: 400mg x 100정 ]
:::
:::column
### 03. 섭취 방법
* **권장용법:** [ 1일 1회 섭취 ]
:::
:::

| 연령 구분 | 1회 권장량 | 복용 간격 |
| :--- | :--- | :--- |
| 성인 (15세 이상) | [ 1정 ] | [ 취침 전 1회 ] |
| 청소년 (12~14세) | [ 1/2정 ] | [ 취침 전 1회 ] |
`.trim();

  return {
    meta: {
      id: 'brochure-2408',
      title: '코레디티 제품 카탈로그 다단 틀',
      targetDoc: 'brochure-2408',
      sourcePdfFileName: '24082026164355-0001.pdf',
      description: '배경 헤더 + 3단 컬럼 특징/원료/용법 블록 + 하단 용법 표 카탈로그 틀',
      difficulty: 'hard',
    },
    htmlContent,
    markdownContent,
  };
}
