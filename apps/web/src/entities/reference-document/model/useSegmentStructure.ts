import { useCallback, useEffect, useState } from 'react';

import { referenceDocumentApi } from '../api/referenceDocumentApi';
import type { SegmentStructureResponse } from './types';

export function useSegmentStructure(docId?: string, enabled = false) {
  const [structure, setStructure] = useState<SegmentStructureResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!docId) return;
    setIsLoading(true);
    setError(null);
    try {
      setStructure(await referenceDocumentApi.getSegmentStructure(docId));
    } catch (cause) {
      console.error('[useSegmentStructure] 구조 조회 실패:', cause);
      setError('세그먼트 구조를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const assign = useCallback(
    async (
      targetKind: 'outline_element' | 'wireframe_block',
      targetId: string,
      primarySegmentId: string | null,
    ) => {
      if (!docId) return;
      await referenceDocumentApi.setSegmentRelationship(docId, targetKind, targetId, primarySegmentId);
      await refresh();
    },
    [docId, refresh],
  );

  return { structure, isLoading, error, refresh, assign };
}
