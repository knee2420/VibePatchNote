import { useCallback, useEffect, useRef, useState } from 'react';


import { scaffoldArchiveApi, type ScaffoldArchiveDetail } from '../api/scaffoldArchiveApi';
import type { ScaffoldArchiveSyncState } from './useScaffoldArchive';

const SAVE_DEBOUNCE_MS = 1200;

interface UseScaffoldDocumentDetailReturn {
  detail: ScaffoldArchiveDetail | null;
  isLoading: boolean;
  error: Error | null;
  syncState: ScaffoldArchiveSyncState;
  liveHtml: string;
  liveMarkdown: string;
  setLiveHtml: (html: string) => void;
  setLiveMarkdown: (md: string) => void;
  saveImmediately: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * ReactFlow 캔버스 컨텍스트 없이 단독 페이지나 위젯에서
 * 백엔드 스캐폴드 아카이브(SSOT) 문서를 조회하고 실시간 편집·저장할 수 있는 Headless 훅.
 */
export function useScaffoldDocumentDetail(
  scaffoldId: string | undefined
): UseScaffoldDocumentDetailReturn {
  const [detail, setDetail] = useState<ScaffoldArchiveDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(scaffoldId));
  const [error, setError] = useState<Error | null>(null);
  const [syncState, setSyncState] = useState<ScaffoldArchiveSyncState>('idle');

  const [liveHtml, setLiveHtmlState] = useState<string>('');
  const [liveMarkdown, setLiveMarkdownState] = useState<string>('');

  const syncedHtmlRef = useRef<string | null>(null);
  const syncedMarkdownRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const savedStateResetTimerRef = useRef<number | null>(null);

  const fetchDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    setSyncState('hydrating');
    setError(null);
    try {
      const data = await scaffoldArchiveApi.get(id);
      setDetail(data);
      setLiveHtmlState(data.htmlContent || '');
      setLiveMarkdownState(data.markdownContent || '');
      syncedHtmlRef.current = data.htmlContent || '';
      syncedMarkdownRef.current = data.markdownContent || '';
      setSyncState('idle');
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setSyncState('error');
      console.error(`[useScaffoldDocumentDetail] Failed to load scaffold archive: ${id}`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!scaffoldId) {
      setDetail(null);
      setLiveHtmlState('');
      setLiveMarkdownState('');
      setIsLoading(false);
      return;
    }

    void fetchDetail(scaffoldId);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (savedStateResetTimerRef.current !== null) {
        window.clearTimeout(savedStateResetTimerRef.current);
      }
    };
  }, [scaffoldId, fetchDetail]);

  const saveImmediately = useCallback(async () => {
    if (!scaffoldId || syncedHtmlRef.current === null) return;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setSyncState('saving');
    try {
      await scaffoldArchiveApi.saveRender(scaffoldId, liveHtml, liveMarkdown);
      syncedHtmlRef.current = liveHtml;
      syncedMarkdownRef.current = liveMarkdown;
      setSyncState('saved');

      if (savedStateResetTimerRef.current !== null) {
        window.clearTimeout(savedStateResetTimerRef.current);
      }
      savedStateResetTimerRef.current = window.setTimeout(() => {
        setSyncState('idle');
      }, 2000);
    } catch (err) {
      console.error('[useScaffoldDocumentDetail] Failed to save document:', err);
      setSyncState('error');
    }
  }, [scaffoldId, liveHtml, liveMarkdown]);

  // 실시간 디바운스 저장 트리거
  const triggerDebouncedSave = useCallback(
    (nextHtml: string, nextMarkdown: string) => {
      if (!scaffoldId || syncedHtmlRef.current === null) return;
      if (nextHtml === syncedHtmlRef.current && nextMarkdown === syncedMarkdownRef.current) return;

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      setSyncState('saving');
      saveTimerRef.current = window.setTimeout(async () => {
        try {
          await scaffoldArchiveApi.saveRender(scaffoldId, nextHtml, nextMarkdown);
          syncedHtmlRef.current = nextHtml;
          syncedMarkdownRef.current = nextMarkdown;
          setSyncState('saved');

          if (savedStateResetTimerRef.current !== null) {
            window.clearTimeout(savedStateResetTimerRef.current);
          }
          savedStateResetTimerRef.current = window.setTimeout(() => {
            setSyncState('idle');
          }, 2000);
        } catch (err) {
          console.error('[useScaffoldDocumentDetail] Debounced save failed:', err);
          setSyncState('error');
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [scaffoldId]
  );

  const setLiveHtml = useCallback(
    (html: string) => {
      setLiveHtmlState(html);
      triggerDebouncedSave(html, liveMarkdown);
    },
    [liveMarkdown, triggerDebouncedSave]
  );

  const setLiveMarkdown = useCallback(
    (md: string) => {
      setLiveMarkdownState(md);
      triggerDebouncedSave(liveHtml, md);
    },
    [liveHtml, triggerDebouncedSave]
  );

  const reload = useCallback(async () => {
    if (scaffoldId) {
      await fetchDetail(scaffoldId);
    }
  }, [scaffoldId, fetchDetail]);

  return {
    detail,
    isLoading,
    error,
    syncState,
    liveHtml,
    liveMarkdown,
    setLiveHtml,
    setLiveMarkdown,
    saveImmediately,
    reload,
  };
}
