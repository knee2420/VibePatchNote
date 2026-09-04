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
<!-- [행 1: 헤더 영역] 좌: 대형 로고/상호 와이어프레임, 우: 날짜/회사정보/인보이스 번호 (우측 정렬) -->
<div data-type="column-group" data-cols="2" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.25rem;">
  <!-- 좌측 상단: 로고 & 상호 와이어프레임 블록 -->
  <div data-type="column" style="display: flex; flex-direction: column; justify-content: center; min-height: 130px; border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 1.25rem;">
    <span style="font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">[ LOGO / BRAND ]</span>
    <h1 style="margin: 0; font-size: 2.5rem; font-weight: 800; color: #2563eb; font-family: serif; letter-spacing: -0.03em;">
      <span data-type="scaffold-slot" data-placeholder="상호 / 로고명"></span>
      <span style="color: #ef4444;">•</span>
    </h1>
  </div>

  <!-- 우측 상단: 발행일자 + 공급자 회사 정보 + 인보이스 번호 (우측 정렬 1:1 복제) -->
  <div data-type="column" style="text-align: right; border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 1rem; font-size: 12px; color: #475569; line-height: 1.5;">
    <p style="margin: 0 0 6px 0; font-weight: 600; color: #1e293b;">
      <span data-type="scaffold-slot" data-placeholder="August 25th 2026"></span>
    </p>
    <p style="margin: 0; font-size: 11px; color: #94a3b8; font-weight: bold;">Company info</p>
    <p style="margin: 2px 0 0 0; font-weight: 700; color: #0f172a;">
      <span data-type="scaffold-slot" data-placeholder="공급자 회사명 (예: Atticus LLC)"></span>
    </p>
    <p style="margin: 2px 0 0 0;">
      <span data-type="scaffold-slot" data-placeholder="도로명 주소 (예: 1309 Coffeen Ave. Ste. 2513)"></span>
    </p>
    <p style="margin: 2px 0 0 0;">
      <span data-type="scaffold-slot" data-placeholder="도시 / 주 / 우편번호 / 국가"></span>
    </p>
    <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b;">
      Sales Tax ID: <span data-type="scaffold-slot" data-placeholder="EU / UK / 사업자등록번호"></span>
    </p>
    <p style="margin: 10px 0 0 0; font-size: 13px; font-weight: 700; color: #1e293b;">
      Invoice <span data-type="scaffold-slot" data-placeholder="000081709"></span>
    </p>
  </div>
</div>

<!-- [행 2: 중간 영역] 좌: Billing info(청구지), 우: Total (USD) & 결제수단 -->
<div data-type="column-group" data-cols="2" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
  <!-- 좌측 중간: 청구 대상 (Billing info) -->
  <div data-type="column" style="border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 1rem; font-size: 12px; color: #334155; line-height: 1.6;">
    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">Billing info</p>
    <p style="margin: 0; font-weight: 600; color: #0f172a;">
      <span data-type="scaffold-slot" data-placeholder="수신자 회사/단체명"></span>
    </p>
    <p style="margin: 0; font-weight: 600; color: #0f172a;">
      <span data-type="scaffold-slot" data-placeholder="수신자 담당자명 (예: SEO MINGYU)"></span>
    </p>
    <p style="margin: 0;">
      <span data-type="scaffold-slot" data-placeholder="수신자 상세 주소"></span>
    </p>
    <p style="margin: 0;">
      <span data-type="scaffold-slot" data-placeholder="도시 / 국가 (예: Seoul, South Korea)"></span>
    </p>
  </div>

  <!-- 우측 중간: 총 청구금액 및 결제상태 (우측 정렬 1:1 복제) -->
  <div data-type="column" style="text-align: right; border: 1.5px dashed #cbd5e1; background-color: #f8fafc; border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; justify-content: center;">
    <p style="margin: 0; font-size: 11px; font-weight: bold; color: #64748b;">Total (USD)</p>
    <h1 style="margin: 4px 0; font-size: 2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
      $<span data-type="scaffold-slot" data-placeholder="147.00"></span>
    </h1>
    <p style="margin: 0; font-size: 11px; color: #64748b;">
      Paid via <span data-type="scaffold-slot" data-placeholder="credit card"></span>
    </p>
  </div>
</div>

<!-- [행 3: 하단 견적 품목 테이블] 헤더 상단 구분선 + 라인형 데이터 그리드 + Subtotal / Total -->
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
      <!-- 품목 1번 행 -->
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 4px;">
          <p style="margin: 0; font-weight: 600; color: #1e293b;">
            <span data-type="scaffold-slot" data-placeholder="품목 또는 서비스명 (예: Atticus)"></span>
          </p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">
            <span data-type="scaffold-slot" data-placeholder="추가 세부설명 (예: One-time payment ($147.00))"></span>
          </p>
        </td>
        <td style="padding: 12px 4px; text-align: right; vertical-align: top; font-weight: 500; color: #334155;">
          $<span data-type="scaffold-slot" data-placeholder="147.00"></span>
        </td>
        <td style="padding: 12px 4px; text-align: right; vertical-align: top; font-weight: 600; color: #0f172a;">
          $<span data-type="scaffold-slot" data-placeholder="147.00"></span>
        </td>
      </tr>
      <!-- 소계 (Subtotal) 행 -->
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td colspan="2" style="padding: 10px 4px; text-align: right; font-size: 12px; color: #64748b; font-weight: 600;">Subtotal:</td>
        <td style="padding: 10px 4px; text-align: right; font-weight: 600; color: #1e293b;">
          $<span data-type="scaffold-slot" data-placeholder="147.00"></span>
        </td>
      </tr>
      <!-- 최종 합계 (Total) 행 -->
      <tr>
        <td colspan="2" style="padding: 10px 4px; text-align: right; font-size: 12px; color: #0f172a; font-weight: 700;">Total:</td>
        <td style="padding: 10px 4px; text-align: right; font-weight: 800; font-size: 14px; color: #0f172a;">
          $<span data-type="scaffold-slot" data-placeholder="147.00"></span>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- [행 4: 푸터 영역] 문의처 및 결제 시스템 안내 (중앙 정렬 작은 글씨) -->
<div style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.8; margin-top: 2rem;">
  <p style="margin: 0;">
    Contact support: <span data-type="scaffold-slot" data-placeholder="support@atticus.io"></span>
  </p>
  <p style="margin: 0; text-decoration: underline; color: #6366f1;">
    <span data-type="scaffold-slot" data-placeholder="Click here to manage your billing details and view purchase history"></span>
  </p>
  <p style="margin: 8px 0 0 0; font-size: 10px; color: #cbd5e1;">
    Your order was processed by <span data-type="scaffold-slot" data-placeholder="ThriveCart. Copyright © 2026. All rights reserved."></span>
  </p>
</div>
`.trim();

  const markdownContent = `
:::column-group
:::column
# [ 상호 / 로고명 ] •
:::
:::column
[ August 25th 2026 ]  
**Company info**  
**[ 공급자 회사명 ]**  
[ 도로명 주소 ]  
[ 도시 / 주 / 우편번호 / 국가 ]  
Sales Tax ID: [ EU / UK / Tax ID ]  
**Invoice [ 000081709 ]**  
:::
:::

:::column-group
:::column
**Billing info**  
**[ 수신자 회사명 ]**  
[ 수신자 담당자명 ]  
[ 수신자 상세 주소 ]  
[ 도시 / 국가 ]  
:::
:::column
**Total (USD)**  
# $[ 147.00 ]  
Paid via [ credit card ]  
:::
:::

| Description | Amount | Total |
| :--- | :---: | :---: |
| **[ 품목 또는 서비스명 ]**<br>([ 추가 세부설명 ]) | $[ 147.00 ] | $[ 147.00 ] |
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
<h2 style="text-align: center; margin-bottom: 1.5rem; letter-spacing: -0.5px;">[ 회 의 록 ]</h2>

<table class="scaffold-table">
  <tbody>
    <tr>
      <th style="width: 20%; background-color: #f1f5f9;">일 시</th>
      <td style="width: 30%;"><span data-type="scaffold-slot" data-placeholder="YYYY년 MM월 DD일 (요일) 00:00"></span></td>
      <th style="width: 20%; background-color: #f1f5f9;">장 소</th>
      <td style="width: 30%;"><span data-type="scaffold-slot" data-placeholder="회의 장소 입력"></span></td>
    </tr>
    <tr>
      <th style="background-color: #f1f5f9;">참 석 자</th>
      <td colspan="3"><span data-type="scaffold-slot" data-placeholder="참석자 명단 기재"></span></td>
    </tr>
    <tr>
      <th style="background-color: #f1f5f9;">안 건</th>
      <td colspan="3"><span data-type="scaffold-slot" data-placeholder="주요 회의 안건 제목"></span></td>
    </tr>
    <tr>
      <th style="background-color: #f1f5f9; height: 160px; vertical-align: top;">회의 내용</th>
      <td colspan="3" style="vertical-align: top;">
        <ol style="margin: 0; padding-left: 20px;">
          <li><span data-type="scaffold-slot" data-placeholder="첫 번째 논의 및 결정 사항 작성"></span></li>
          <li><span data-type="scaffold-slot" data-placeholder="두 번째 논의 및 결정 사항 작성"></span></li>
          <li><span data-type="scaffold-slot" data-placeholder="향후 계획 및 액션 아이템 작성"></span></li>
        </ol>
      </td>
    </tr>
    <tr>
      <th style="background-color: #f1f5f9;">지출 금액</th>
      <td colspan="3"><strong>₩ <span data-type="scaffold-slot" data-placeholder="금액 입력"></span></strong></td>
    </tr>
    <tr>
      <th style="background-color: #f1f5f9; height: 180px; vertical-align: top;">증빙자료<br/>첨부란</th>
      <td colspan="3" style="vertical-align: middle; text-align: center; background-color: #f8fafc;">
        <div style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 24px; color: #94a3b8;">
          <p style="margin:0; font-weight: 500;">[ 신용카드 매출전표 또는 영수증 부착 위치 ]</p>
          <p style="margin:4px 0 0; font-size: 11px;">여기에 증빙 이미지를 붙여넣거나 첨부하세요.</p>
        </div>
      </td>
    </tr>
  </tbody>
</table>
`.trim();

  const markdownContent = `
# [ 회 의 록 ]

| 구분 | 내용 |
| :--- | :--- |
| **일시** | [ YYYY년 MM월 DD일 00:00 ] |
| **장소** | [ 회의 장소 입력 ] |
| **참석자** | [ 참석자 명단 기재 ] |
| **안건** | [ 주요 회의 안건 제목 ] |
| **회의 내용** | 1. [ 논의 및 결정 사항 1 ]<br>2. [ 논의 및 결정 사항 2 ] |
| **지출 금액** | ₩ [ 금액 입력 ] |
| **증빙자료 첨부란** | [ 영수증 또는 증빙자료 첨부 ] |
`.trim();

  return {
    meta: {
      id: 'meeting-minutes',
      title: '디딤돌 회의록 서식 틀',
      targetDoc: 'meeting-minutes',
      sourcePdfFileName: '11월 디딤돌 회의록.pdf',
      description: '일시/장소/안건/회의내용/지출금액/영수증부착란 복합 격자 표 틀',
      difficulty: 'medium',
    },
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
