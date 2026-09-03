import { useCallback, useEffect, useState } from 'react';

import { fetchApiHealth, type HealthStatus } from '../api/healthApi';

/** 백엔드 연결 상태를 조회하고 수동 재시도를 제공합니다. */
export function useApiHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setHealth(await fetchApiHealth());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend connection failed');
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { health, isLoading, error, isConnected: health !== null, check };
}
