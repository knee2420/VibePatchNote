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
    if (!scaffoldId || hydratedIdRef.current === scaffoldId) return;
    if (data.archiveMissing) return; // 이미 없는 것으로 판명난 보관본
    hydratedIdRef.current = scaffoldId;

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

    void hydrate(scaffoldId);
  }, [scaffoldId, nodeId, data.archiveMissing, setNodes]);

  // 2) 노드 -> 아카이브 (편집 되쓰기 및 스냅샷 갱신)
  useEffect(() => {
    if (!scaffoldId || data.archiveMissing) return;
    if (syncedHtmlRef.current === null) return; // 하이드레이션 전 편집은 있을 수 없다
    if (html === syncedHtmlRef.current) return; // 실제 변경분만 보낸다

    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      setSyncState('saving');
      scaffoldArchiveApi
        .saveRender(scaffoldId, html, markdown)
        .then(() => {
          syncedHtmlRef.current = html;
          setSyncState('saved');
          // 편집 저장 완료 후 DOM이 업데이트되면 실제 화면 스냅샷 업로드
          window.setTimeout(() => {
            void uploadSnapshot(scaffoldId);
          }, 400);
        })
        .catch((error) => {
          console.error('[useScaffoldArchive] Failed to save render', scaffoldId, error);
          setSyncState('error');
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [scaffoldId, html, markdown, data.archiveMissing, uploadSnapshot]);

  // 3) 초기 렌더링 완료 후 실제 브라우저 DOM 스냅샷을 백엔드에 1회 동기화
  //    (백엔드가 생성한 간이 렌더러 결과물을 실제 브라우저 렌더링 스냅샷으로 교체)
  useEffect(() => {
    if (!scaffoldId || syncState === 'hydrating' || !data.htmlContent || data.archiveMissing) return;
    if (initialSnapshotTakenRef.current === scaffoldId) return;

    if (snapshotTimerRef.current !== null) window.clearTimeout(snapshotTimerRef.current);

    // 폰트 로딩 및 Tiptap DOM 마운트가 안정화된 후 캡처
    snapshotTimerRef.current = window.setTimeout(() => {
      initialSnapshotTakenRef.current = scaffoldId;
      void uploadSnapshot(scaffoldId);
    }, 1000);

    return () => {
      if (snapshotTimerRef.current !== null) {
        window.clearTimeout(snapshotTimerRef.current);
        snapshotTimerRef.current = null;
      }
    };
  }, [scaffoldId, syncState, data.htmlContent, data.archiveMissing, uploadSnapshot]);

  return { syncState, isHydrating: syncState === 'hydrating' };
}

