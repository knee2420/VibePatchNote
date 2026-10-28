import { useCallback, useState } from 'react';

import { agentRunClient, type Agreement } from '@/shared/api';

/**
 * 사람의 결정을 기다리는 항목 목록.
 *
 * 이 목록은 서버가 갖고 있습니다. 브라우저 메모리에 두면 새로고침 한 번에 사라지고,
 * 사용자는 "승인했는데 아무 일도 일어나지 않는" 상태를 만나게 됩니다.
 *
 * **언제 읽을지는 호출부가 정합니다.** 훅이 마운트 시점에 스스로 불러오면 화면에
 * 보이지도 않는 패널이 요청을 만들고, 그 시점을 호출부가 통제할 수 없습니다.
 */
export function usePendingAgreements() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setAgreements(await agentRunClient.listPendingAgreements());
    } catch (error) {
      console.error('[usePendingAgreements] 대기 목록을 불러오지 못했습니다:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const decide = useCallback(
    async (agreementId: string, approved: boolean) => {
      const decided = await agentRunClient.decideAgreement(agreementId, approved);
      await refresh();
      return decided;
    },
    [refresh]
  );

  return { agreements, isLoading, refresh, decide };
}
