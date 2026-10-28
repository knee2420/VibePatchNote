import { useCallback, useEffect, useState } from 'react';

import {
  llmConfigurationApi,
  type GoogleApiModel,
  type GoogleProjectUsage,
  type GoogleQuotaStatus,
  type RuntimeDashboard,
} from '@/entities/llm-configuration';
import { notifyLlmSettingsChanged } from '@/shared/lib/llmSettingsEvent';

const GOOGLE_PROVIDER_ID = 'google-api';

/**
 * 보조 API(Google) 설정 탭의 통신과 상태.
 *
 * 한도 표는 두 가지가 모두 있어야 채워집니다 — 이 앱에 저장된 API 키(쓸 수 있는 모델 목록)와
 * Google 프로젝트 OAuth 연결(프로젝트 한도). 빠진 것이 있으면 화면이 그 단계를 안내합니다.
 */
export function useGoogleFallbackSettings() {
  const [runtime, setRuntime] = useState<RuntimeDashboard>();
  const [catalog, setCatalog] = useState<GoogleApiModel[]>([]);
  const [status, setStatus] = useState<GoogleQuotaStatus>();
  const [usage, setUsage] = useState<GoogleProjectUsage>();
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshUsage = useCallback(async () => {
    setIsUsageLoading(true);
    try {
      const next = await llmConfigurationApi.googleProjectUsage();
      setUsage(next);
      setError('');
    } catch {
      setError('Google 프로젝트 한도를 읽지 못했습니다. 프로젝트 연결과 API 키를 확인해 주세요.');
    } finally {
      setIsUsageLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    try {
      const [nextRuntime, nextStatus] = await Promise.all([
        llmConfigurationApi.runtime(),
        llmConfigurationApi.googleQuotaStatus(),
      ]);
      setRuntime(nextRuntime);
      setStatus(nextStatus);
      setError('');

      const hasKey = nextRuntime.providers.some(
        (provider) => provider.id === GOOGLE_PROVIDER_ID && provider.configured,
      );
      if (!hasKey) {
        setCatalog([]);
        setUsage(undefined);
        return;
      }
      const { models } = await llmConfigurationApi.googleModels();
      setCatalog(models);
      if (nextStatus.connected) await refreshUsage();
    } catch {
      setError('보조 API 설정을 읽지 못했습니다. API 서버 연결을 확인해 주세요.');
    }
  }, [refreshUsage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // OAuth 는 팝업 창에서 끝납니다. 연결 전이라면, 사용자가 이 창으로 돌아올 때 상태를 다시 읽습니다.
  const isConnected = status?.connected ?? false;
  useEffect(() => {
    if (isConnected) return;
    const recheck = () => {
      void reload();
    };
    window.addEventListener('focus', recheck);
    return () => window.removeEventListener('focus', recheck);
  }, [isConnected, reload]);

  const saveApiKey = useCallback(
    async (apiKey: string) => {
      try {
        await llmConfigurationApi.saveGoogleApiKey(apiKey);
      } catch {
        setError('Google API 키를 저장하지 못했습니다. 키를 확인한 뒤 다시 시도해 주세요.');
        return false;
      }
      notifyLlmSettingsChanged();
      await reload();
      return true;
    },
    [reload],
  );

  const removeApiKey = useCallback(async () => {
    try {
      await llmConfigurationApi.removeGoogleApiKey();
    } catch {
      setError('Google API 키를 제거하지 못했습니다.');
      return;
    }
    notifyLlmSettingsChanged();
    await reload();
  }, [reload]);

  const saveClientSecret = useCallback(async (clientSecret: string) => {
    try {
      setStatus(await llmConfigurationApi.saveGoogleOAuthClientSecret(clientSecret));
      return true;
    } catch {
      setError('OAuth 클라이언트 보안 비밀번호를 저장하지 못했습니다.');
      return false;
    }
  }, []);

  const connectProject = useCallback(async () => {
    // 팝업 차단을 피하려고 클릭 직후 빈 창을 열고, 인증 주소를 받으면 그 창을 옮깁니다.
    const popup = window.open('', 'vibe-google-oauth', 'popup,width=520,height=700');
    try {
      const { authorizationUrl } = await llmConfigurationApi.startGoogleQuotaAuthorization();
      if (popup) popup.location.href = authorizationUrl;
      else window.location.assign(authorizationUrl);
    } catch {
      popup?.close();
      setError('Google 프로젝트 연결을 시작하지 못했습니다.');
    }
  }, []);

  const changeFallbackModel = useCallback(
    async (fallbackModel: string) => {
      if (!runtime) return;
      try {
        await llmConfigurationApi.updatePolicy({ ...runtime.policy, fallbackModel });
        setRuntime(await llmConfigurationApi.runtime());
      } catch {
        setError('보조 모델을 변경하지 못했습니다.');
      }
    },
    [runtime],
  );

  return {
    runtime,
    google: runtime?.providers.find((provider) => provider.id === GOOGLE_PROVIDER_ID),
    catalog,
    status,
    usage,
    isUsageLoading,
    error,
    refreshUsage,
    saveApiKey,
    removeApiKey,
    saveClientSecret,
    connectProject,
    changeFallbackModel,
  };
}

export type GoogleFallbackSettings = ReturnType<typeof useGoogleFallbackSettings>;
