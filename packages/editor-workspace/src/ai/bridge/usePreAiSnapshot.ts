import { useState, useCallback } from 'react';
import type { PreAiSnapshotOptions, UsePreAiSnapshotReturn } from './types';

interface InternalSnapshotRecord<T = Record<string, unknown>> {
  id: string;
  timestamp: number;
  label: string;
  description?: string;
  content: string;
  extra?: T;
}

/**
 * usePreAiSnapshot (AI 파괴적 작업 전 자동 복원점 캡처 훅)
 *
 * 에이전트의 대규모 덮어쓰기나 변경 실행 직전, 현재 상태를 메모리/호스트에 저장하여
 * 작업 실패나 불만족 시 원클릭 롤백(Rollback)을 보장합니다.
 */
export function usePreAiSnapshot<T = Record<string, unknown>>(
  onRestoreContent?: (content: string, snapshot: InternalSnapshotRecord<T>) => void
): UsePreAiSnapshotReturn<T> {
  const [history, setHistory] = useState<InternalSnapshotRecord<T>[]>([]);

  const captureSnapshotBeforeAi = useCallback(
    ({ label = 'AI 작업 전 복원점', description, content, extra }: PreAiSnapshotOptions<T>): string => {
      const id = `snap-pre-ai-${Date.now()}`;
      const record: InternalSnapshotRecord<T> = {
        id,
        timestamp: Date.now(),
        label,
        description,
        content,
        extra,
      };

      setHistory((prev) => [...prev, record]);
      return id;
    },
    []
  );

  const rollbackLastAiAction = useCallback((): boolean => {
    if (history.length === 0) return false;

    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));

    if (onRestoreContent) {
      onRestoreContent(last.content, last);
      return true;
    }
    return false;
  }, [history, onRestoreContent]);

  return {
    captureSnapshotBeforeAi,
    rollbackLastAiAction,
    historyCount: history.length,
  };
}
