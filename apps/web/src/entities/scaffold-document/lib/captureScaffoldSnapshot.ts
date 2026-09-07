import { toBlob } from 'html-to-image';

/**
 * Tiptap 서식 에디터 DOM에서 실제 서식 지면(A4 용지 규격)을 캡처하여 PNG Blob으로 변환합니다.
 *
 * 브라우저의 CSS 렌더링 엔진(폰트, 여백, 보라색 슬롯 점선, 표 테두리)이 실제로 그린
 * 화면 그대로를 캡처하므로, 사용자 화면과 100% 일치(WYSIWYG)하는 스냅샷이 생성됩니다.
 */
export async function captureScaffoldSnapshot(
  container: HTMLElement,
  pixelRatio = 1.5
): Promise<Blob | null> {
  // 1. .scaffold-page 가 실제 서식 지면이다.
  //    에디터 바깥 스크롤바나 여백 없이 정확한 A4 용지만 캡처한다.
  const pageElement = container.querySelector<HTMLElement>('.scaffold-page');
  const target = pageElement || container;

  const pageW = pageElement ? Number.parseFloat(pageElement.getAttribute('data-w') || '595') : 595;
  const pageH = pageElement ? Number.parseFloat(pageElement.getAttribute('data-h') || '842') : 842;

  try {
    const blob = await toBlob(target, {
      backgroundColor: '#ffffff',
      width: pageElement ? pageW : undefined,
      height: pageElement ? pageH : undefined,
      pixelRatio,
      cacheBust: true,
      style: pageElement
        ? {
            transform: 'none',
            margin: '0',
            maxWidth: 'none',
            maxHeight: 'none',
            width: `${pageW}px`,
            height: `${pageH}px`,
          }
        : undefined,
      // 인터랙션 중 발생하는 선택 하이라이트나 불필요한 컨트롤이 찍히지 않도록 방어
      filter: (node) => {
        if (node instanceof HTMLElement) {
          // React Flow 캔버스 드래그 핸들이나 노드 조작용 비-서식 요소 제외
          if (node.classList.contains('react-flow__handle')) {
            return false;
          }
        }
        return true;
      },
    });
    return blob;
  } catch (error) {
    console.warn('[captureScaffoldSnapshot] Failed to capture DOM snapshot:', error);
    return null;
  }
}
