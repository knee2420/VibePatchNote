import { useCallback, useEffect, useRef, useState } from 'react';

import {
  agentRunClient,
  followAgentRun,
  type AgentRun,
  type AgentRunStatus,
} from '@/shared/api';

interface UseAgentRunOptions<TResult> {
  onSettled?: (run: AgentRun<TResult>) => void;
}

/**
 * Agent 실행 하나를 끝(또는 보류)까지 따라가는 헤드리스 훅.
 *
 * 전송은 `shared/api` 의 프로토콜 계층이 맡고, 이 훅은 화면이 필요로 하는
 * 상태 표현만 갖습니다.
 */
export function useAgentRun<TResult = Record<string, unknown>>(
  options: UseAgentRunOptions<TResult> = {}
) {
  const [run, setRun] = useState<AgentRun<TResult> | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const unmountedRef = useRef(false);
  useEffect(
    () => () => {
      unmountedRef.current = true;
    },
    []
  );

  const follow = useCallback(async (runId: string): Promise<AgentRun<TResult>> => {
    setIsPolling(true);
    try {
      const settled = await followAgentRun<TResult>(
        runId,
        (current) => {
          if (!unmountedRef.current) setRun(current);
        },
        () => unmountedRef.current
      );
      optionsRef.current.onSettled?.(settled);
      return settled;
    } finally {
      if (!unmountedRef.current) setIsPolling(false);
    }
  }, []);

  /** 끊기거나 보류된 실행을 이어서 실행하고 다시 따라갑니다. */
  const resume = useCallback(
    async (runId: string) => {
      await agentRunClient.resume(runId);
      return follow(runId);
    },
    [follow]
  );

  const status: AgentRunStatus | 'idle' = run?.status ?? 'idle';

  return { run, status, isPolling, follow, resume, setRun };
}
