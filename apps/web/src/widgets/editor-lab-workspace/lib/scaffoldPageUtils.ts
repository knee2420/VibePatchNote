/**
 * scaffoldPageUtils.ts
 *
 * 서식 와이어프레임(A4 다단 그리드) HTML에서
 * 특정 페이지(Page 1, Page 2 등)만을 안전하게 분할 추출하고,
 * 특정 페이지에서 수정된 내용을 전체 서식 HTML(SSOT)에 병합하는 DOM 유틸리티입니다.
 */

/**
 * 전체 HTML에서 특정 페이지(pageNumber)에 해당하는 DOM 블록만 추출합니다.
 */
export function extractPageHtml(fullHtml: string, pageNumber?: number): string {
  if (!pageNumber || !fullHtml || !fullHtml.includes('data-type="scaffold-page"')) {
    return fullHtml;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtml, 'text/html');
    const pageEl = doc.querySelector(`[data-type="scaffold-page"][data-page="${pageNumber}"]`);
    if (pageEl) {
      return pageEl.outerHTML;
    }
  } catch (err) {
    console.error(`[extractPageHtml] Failed to extract page ${pageNumber}:`, err);
  }

  return fullHtml;
}

/**
 * 특정 페이지(pageNumber)에서 편집된 HTML을 전체 HTML(SSOT) 내의 해당 위치로 교체 병합합니다.
 */
export function updatePageInFullHtml(
  fullHtml: string,
  pageNumber: number | undefined,
  updatedPageHtml: string
): string {
  if (!pageNumber || !fullHtml || !fullHtml.includes('data-type="scaffold-page"')) {
    return updatedPageHtml;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtml, 'text/html');
    const pageEl = doc.querySelector(`[data-type="scaffold-page"][data-page="${pageNumber}"]`);

    if (pageEl) {
      const updatedDoc = parser.parseFromString(updatedPageHtml, 'text/html');
      // 교체 대상 페이지 엘리먼트 탐색
      const newPageEl =
        updatedDoc.querySelector(`[data-type="scaffold-page"][data-page="${pageNumber}"]`) ||
        updatedDoc.querySelector('[data-type="scaffold-page"]') ||
        updatedDoc.body.firstElementChild;

      if (newPageEl) {
        pageEl.replaceWith(newPageEl);
        return doc.body.innerHTML;
      }
    }
  } catch (err) {
    console.error(`[updatePageInFullHtml] Failed to merge page ${pageNumber}:`, err);
  }

  return fullHtml;
}

/**
 * 전체 HTML에서 모든 페이지 DOM 엘리먼트 및 번호 목록을 추출합니다.
 */
export function extractAllPages(fullHtml: string): Array<{ pageNumber: number; html: string }> {
  if (!fullHtml || !fullHtml.includes('data-type="scaffold-page"')) {
    return [{ pageNumber: 1, html: fullHtml }];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtml, 'text/html');
    const pageEls = doc.querySelectorAll('[data-type="scaffold-page"]');
    if (pageEls.length > 0) {
      return Array.from(pageEls).map((el, idx) => {
        const pNum = parseInt(el.getAttribute('data-page') || String(idx + 1), 10);
        return {
          pageNumber: isNaN(pNum) ? idx + 1 : pNum,
          html: el.outerHTML,
        };
      });
    }
  } catch (err) {
    console.error('[extractAllPages] Error parsing pages:', err);
  }

  return [{ pageNumber: 1, html: fullHtml }];
}

/**
 * 전체 HTML 내의 특정 슬롯(slotId)의 텍스트 내용을 주입/교체합니다.
 */
export function injectSlotValueInHtml(fullHtml: string, slotId: string, value: string): string {
  if (!fullHtml) return fullHtml;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtml, 'text/html');
    const slotEl = doc.querySelector(`span[data-type="scaffold-slot"][data-slot-id="${slotId}"]`);
    if (slotEl) {
      slotEl.textContent = value;
      return doc.body.innerHTML;
    }
  } catch (err) {
    console.error(`[injectSlotValueInHtml] Failed to inject slot ${slotId}:`, err);
  }
  return fullHtml;
}

/**
 * 전체 HTML 내의 여러 슬롯을 한 번에 일괄 주입/교체합니다 (전체 추천 적용 등).
 */
export function injectMultipleSlotsInHtml(fullHtml: string, updates: Record<string, string>): string {
  if (!fullHtml) return fullHtml;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtml, 'text/html');
    let hasChanges = false;
    Object.entries(updates).forEach(([slotId, val]) => {
      const slotEl = doc.querySelector(`span[data-type="scaffold-slot"][data-slot-id="${slotId}"]`);
      if (slotEl) {
        slotEl.textContent = val;
        hasChanges = true;
      }
    });
    if (hasChanges) {
      return doc.body.innerHTML;
    }
  } catch (err) {
    console.error('[injectMultipleSlotsInHtml] Error:', err);
  }
  return fullHtml;
}

/**
 * 전체 HTML에서 각 슬롯(slotId)에 현재 채워져 있는 텍스트 내용을 추출합니다.
 */
export function extractSlotValuesFromHtml(fullHtml: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!fullHtml) return result;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtml, 'text/html');
    const slotEls = doc.querySelectorAll('span[data-type="scaffold-slot"][data-slot-id]');
    slotEls.forEach((el) => {
      const id = el.getAttribute('data-slot-id');
      if (id) {
        result[id] = el.textContent?.trim() || '';
      }
    });
  } catch (err) {
    console.error('[extractSlotValuesFromHtml] Error:', err);
  }
  return result;
}

