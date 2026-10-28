import { useCallback, useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';

import { HttpError } from '@/shared/api';

import { scaffoldArchiveApi } from '../api/scaffoldArchiveApi';
import { captureScaffoldSnapshot } from '../lib/captureScaffoldSnapshot';

import type { ScaffoldDocumentData } from './types';

/** 편집이 멎은 뒤 작업본을 아카이브에 되쓰기까지의 대기 시간(ms). */
const SAVE_DEBOUNCE_MS = 1200;

export type ScaffoldArchiveSyncState = 'idle' | 'hydrating' | 'saving' | 'saved' | 'error';

/**
 * 스캐폴드 본문을 아카이브(SSOT)와 동기화합니다.
 *
 * - **하이드레이션**: 노드가 들고 있는 `scaffoldId` 로 본문을 아카이브에서 읽어 노드에 채웁니다.
 *   세션 DB/localStorage 에는 본문이 저장되지 않으므로, 복원 경로는 언제나 이쪽입니다.
 * - **되쓰기**: Tiptap 편집으로 노드 본문이 바뀌면 디바운스 후 작업본을 아카이브에 저장합니다.
 * - **DOM 스냅샷 갱신**: 사용자가 보고 있는 실제 브라우저 렌더링 화면을 `html-to-image`로
 *   캡처하여 백엔드의 `vision/render_p1.png` 에 보관합니다 (초기 마운트 및 편집 저장 완료 시).
 *
 * `scaffoldId` 가 없는 구(舊) 노드는 아무 것도 하지 않습니다. 그 노드의 본문은 아직
 * 세션에 그대로 들어 있고, 그것이 유일한 출처이기 때문입니다.
 */
function readArchivePointer(data: ScaffoldDocumentData): string | undefined {
  const legacy = (data.archive as { scaffold_id?: unknown } | undefined)?.scaffold_id;
  return data.scaffoldId ?? data.archive?.scaffoldId ?? (typeof legacy === 'string' ? legacy : undefined);
}

export function useScaffoldArchive(
  nodeId: string,
  data: ScaffoldDocumentData,
  containerRef?: React.RefObject<HTMLDivElement | null>
) {
  const { setNodes } = useReactFlow();
  const scaffoldId = readArchivePointer(data);

  const [syncState, setSyncState] = useState<ScaffoldArchiveSyncState>('idle');

  /** 이미 하이드레이션을 시도한 아카이브 ID. 중복 요청과 재시도 루프를 막습니다. */
  const hydratedIdRef = useRef<string | null>(null);
  /** 아카이브에 반영된 것으로 확인된 마지막 HTML. null 이면 아직 하이드레이션 전. */
  const syncedHtmlRef = useRef<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const snapshotTimerRef = useRef<number | null>(null);

  /** 중복 스냅샷 업로드 방지 플래그 */
  const isUploadingSnapshotRef = useRef<boolean>(false);
  /** 이번 세션에서 초기 DOM 스냅샷을 보낸 아카이브 ID */
  const initialSnapshotTakenRef = useRef<string | null>(null);

  const html = data.htmlContent;
  const markdown = data.markdownContent;

  /** 브라우저가 실제로 렌더링한 서식 지면을 캡처하여 아카이브에 저장 */
  const uploadSnapshot = useCallback(async (targetId: string) => {
    const container = containerRef?.current;
    if (!container || isUploadingSnapshotRef.current) return;

    isUploadingSnapshotRef.current = true;
    try {
      const blob = await captureScaffoldSnapshot(container);
      if (blob) {
        await scaffoldArchiveApi.saveRenderImage(targetId, blob);
      }
    } catch (err: unknown) {
      if (err instanceof HttpError && err.status === 404) {
        setNodes((nds) =>
          nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, archiveMissing: true } } : n))
        );
      } else {
        console.warn('[useScaffoldArchive] Failed to upload DOM snapshot:', err);
      }
    } finally {
      isUploadingSnapshotRef.current = false;
    }
  }, [containerRef, nodeId, setNodes]);

  // 1) 아카이브 -> 노드 (하이드레이션)
  useEffect(() => {
    if (data.archiveMissing) return; // 이미 없는 것으로 판명난 보관본
    if (data.status === 'generating') return; // AI 신규 생성 중인 노드는 이전 아카이브를 불러오지 않고 작업 완료를 대기

    async function hydrate(id: string) {
      setSyncState('hydrating');
      try {
        const detail = await scaffoldArchiveApi.get(id);

        const {
          htmlContent,
          markdownContent,
          originHtmlContent: _originHtml,
          originMarkdownContent: _originMd,
          promptSpecMd: _spec,
          slots,
          ...meta
        } = detail;

        syncedHtmlRef.current = htmlContent;
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    scaffoldId: id,
                    htmlContent,
                    markdownContent,
                    slots,
                    archive: meta,
                    status: 'completed',
                  },
                }
              : n
          )
        );
        setSyncState('idle');
      } catch (error) {
        if (error instanceof HttpError && error.status === 404) {
          console.info(
            `[useScaffoldArchive] 보관본 없음(${id}). 세션에 남은 본문으로 렌더링합니다.`
          );
          setNodes((nds) =>
            nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, archiveMissing: true } } : n))
          );
          setSyncState('idle');
          return;
        }
        console.error('[useScaffoldArchive] Failed to hydrate', id, error);
        setSyncState('error');
      }
    }

    if (scaffoldId) {
      if (hydratedIdRef.current === scaffoldId) return;
      hydratedIdRef.current = scaffoldId;
      void hydrate(scaffoldId);
      return;
    }

    // scaffoldId 포인터가 결손되었으나 docId 가 있고 본문이 비어있다면,
    // 백엔드 아카이브에서 해당 문서의 최신 보관본을 찾아 자동 복구합니다.
    const docId = typeof data.docId === 'string' ? data.docId : undefined;
    if (docId && !data.htmlContent && !hydratedIdRef.current) {
      hydratedIdRef.current = `doc-${docId}`;
      async function resolveByDoc(targetDocId: string) {
        try {
          const archives = await scaffoldArchiveApi.listByDocument(targetDocId);
          if (archives.length > 0) {
            const latest = archives[0];
            hydratedIdRef.current = latest.scaffoldId;
            void hydrate(latest.scaffoldId);
          } else {
            setNodes((nds) =>
              nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, archiveMissing: true } } : n))
            );
          }
        } catch (error) {
          console.warn('[useScaffoldArchive] Failed to list archives for docId', targetDocId, error);
        }
      }
      void resolveByDoc(docId);
    }
  }, [scaffoldId, nodeId, data.docId, data.htmlContent, data.status, data.archiveMissing, setNodes]);

  // 2) 노드 -> 아카이브 (편집 되쓰기 및 스냅샷 갱신)
  useEffect(() => {
    if (!scaffoldId || data.archiveMissing) return;
    if (syncedHtmlRef.current === null) return; // 하이드레이션 전 편집은 있을 수 없다
    if (html === undefined || html === syncedHtmlRef.current) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(async () => {
      setSyncState('saving');
      try {
        await scaffoldArchiveApi.saveRender(scaffoldId, html, markdown);
        syncedHtmlRef.current = html;
        setSyncState('saved');

        // 저장 성공 후 브라우저 DOM 렌더링 화면을 스냅샷으로 캡처
        if (snapshotTimerRef.current !== null) {
          window.clearTimeout(snapshotTimerRef.current);
        }
        snapshotTimerRef.current = window.setTimeout(() => {
          void uploadSnapshot(scaffoldId);
        }, 500);
      } catch (error) {
        console.error('[useScaffoldArchive] Failed to save render', scaffoldId, error);
        setSyncState('error');
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      if (snapshotTimerRef.current !== null) {
        window.clearTimeout(snapshotTimerRef.current);
      }
    };
  }, [scaffoldId, html, markdown, data.archiveMissing, uploadSnapshot]);

  // 3) 초기 로드 완료 시 1회 초기 DOM 스냅샷 자동 업로드 (백엔드 에셋 최신화)
  useEffect(() => {
    if (!scaffoldId || syncState === 'hydrating' || !data.htmlContent || data.archiveMissing) return;
    if (initialSnapshotTakenRef.current === scaffoldId) return;

    // 초기 렌더링 안정화를 위해 살짝 지연 후 캡처
    const timer = window.setTimeout(() => {
      if (initialSnapshotTakenRef.current === scaffoldId) return;
      initialSnapshotTakenRef.current = scaffoldId;
      void uploadSnapshot(scaffoldId);
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [scaffoldId, syncState, data.htmlContent, data.archiveMissing, uploadSnapshot]);

  return { syncState };
}
