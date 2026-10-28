import { useCallback, useEffect, useState } from 'react';

import { segmentApi } from '../api/segmentApi';
import type { RelationshipTargetKind, SegmentStructureResponse } from './types';

export function useSegmentStructure(docId?: string, enabled = false) {
  const [structure, setStructure] = useState<SegmentStructureResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!docId) return;
    setIsLoading(true);
    setError(null);
    try {
      setStructure(await segmentApi.getStructure(docId));
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
      targetKind: RelationshipTargetKind,
      targetId: string,
      primarySegmentId: string | null,
    ) => {
      if (!docId) return;
      await segmentApi.setRelationship(docId, targetKind, targetId, primarySegmentId);
      await refresh();
    },
    [docId, refresh],
  );

  /**
   * 사람이 정한 관계를 물러 **자동 분석 결과로 되돌립니다.**
   *
   * 소속 해제(`assign(..., null)`)와 다릅니다. 해제는 "어디에도 속하지 않는다"는
   * 결정이고, 이것은 그 결정 자체를 취소해 알고리즘 판단으로 돌아가는 것입니다.
   */
  const resetToAlgorithm = useCallback(
    async (targetKind: RelationshipTargetKind, targetId: string) => {
      if (!docId) return;
      await segmentApi.resetRelationship(docId, targetKind, targetId);
      await refresh();
    },
    [docId, refresh],
  );

  return { structure, isLoading, error, refresh, assign, resetToAlgorithm };
}
