import { useCallback, useEffect, useState } from 'react';

import { llmConfigurationApi, type AgyUsage } from '@/entities/llm-configuration';

/** AGY CLI 가 알려 주는 계정 quota. CLI 로그인이 끊겼으면 오류 문구를 돌려줍니다. */
export function useCliUsage() {
  const [usage, setUsage] = useState<AgyUsage>();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const next = await llmConfigurationApi.usage();
      setUsage(next);
      setError('');
    } catch {
      setError('AGY/CLI 현황을 읽지 못했습니다. CLI 로그인 상태를 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    void load();
  }, [load]);

  return { usage, error, isLoading, refresh };
}
