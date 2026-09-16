/**
 * PDF.js Web Worker 언마운트/재마운트 라이프사이클 가드.
 * React 19 StrictMode 더블 마운트, 캔버스 패닝/줌 화면 이동, 라우트 이동 시
 * PDF.js 워커가 취소/정상 종료('Worker was terminated', 'Worker task was terminated')되면서 발생하는
 * Uncaught Promise Rejection 및 비동기 노이즈를 캡처링 단계에서 안전하게 차단합니다.
 */
if (typeof window !== 'undefined') {
  const IGNORED_PATTERNS = [
    'Worker was terminated',
    'Worker task was terminated',
    'Rendering cancelled',
    'ensureNotTerminated',
    'getTextContent - ignoring errors',
  ];

  const shouldIgnore = (text: string) =>
    IGNORED_PATTERNS.some((pattern) => text.includes(pattern));

  // 1. Unhandled Promise Rejection 방어 (캡처링 모드)
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

      if (shouldIgnore(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  // 2. Global Error 방어 (캡처링 모드)
  window.addEventListener(
    'error',
    (event) => {
      const msg = event.message || String(event.error || '');
      if (shouldIgnore(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  // 3. 콘솔 직접 출력 노이즈 필터링
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    const combined = args
      .map((a) => (typeof a === 'string' ? a : (a as Error)?.message || String(a || '')))
      .join(' ');
    if (shouldIgnore(combined)) {
      return;
    }
    origError.apply(console, args);
  };

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const combined = args
      .map((a) => (typeof a === 'string' ? a : (a as Error)?.message || String(a || '')))
      .join(' ');
    if (shouldIgnore(combined)) {
      return;
    }
    origWarn.apply(console, args);
  };
}

export {};
