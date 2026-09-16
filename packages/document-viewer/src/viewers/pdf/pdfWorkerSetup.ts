import { pdfjs } from 'react-pdf';

// Stable PDF.js worker setup using matching version CDN worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// 컴포넌트 언마운트나 페이지 라우트 이동 시 PDF.js 워커가 정상 종료(terminate)되면서
// 미완료 태스크 프로미스가 거부되어 발생하는 Uncaught 'Worker was terminated' 에러를 전역 차원에서 안전하게 흡수합니다.
if (typeof window !== 'undefined') {
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      const msg =
        typeof reason === 'string'
          ? reason
          : (reason as { message?: string; name?: string } | undefined)?.message ||
            (reason as { message?: string; name?: string } | undefined)?.name ||
            String(reason || '');
      if (
        msg.includes('Worker was terminated') ||
        msg.includes('Rendering cancelled') ||
        msg.includes('ensureNotTerminated')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'error',
    (event) => {
      const msg = event.message || String(event.error || '');
      if (
        msg.includes('Worker was terminated') ||
        msg.includes('Rendering cancelled') ||
        msg.includes('ensureNotTerminated')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

export { pdfjs };
