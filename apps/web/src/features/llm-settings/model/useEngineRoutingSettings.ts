import { useCallback, useEffect, useState } from 'react';

import { llmConfigurationApi, type RuntimeDashboard } from '@/entities/llm-configuration';
import { notifyLlmSettingsChanged } from '@/shared/lib/llmSettingsEvent';

export type EngineProviderId = 'google-api' | 'agy-cli';

export interface EngineRoutingFormState {
  primaryProvider: EngineProviderId;
  primaryModel: string;
  primaryTimeoutSeconds: number;
  fallbackEnabled: boolean;
  fallbackProvider: EngineProviderId;
  fallbackModel: string;
  fallbackTimeoutSeconds: number;
}

export function useEngineRoutingSettings() {
  const [runtime, setRuntime] = useState<RuntimeDashboard>();
  const [form, setForm] = useState<EngineRoutingFormState>({
    primaryProvider: 'google-api',
    primaryModel: 'gemini-3.5-flash',
    primaryTimeoutSeconds: 180,
    fallbackEnabled: true,
    fallbackProvider: 'agy-cli',
    fallbackModel: 'gemini-3.8-flash-low',
    fallbackTimeoutSeconds: 180,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextRuntime = await llmConfigurationApi.runtime();
      setRuntime(nextRuntime);
      setError('');

      const isGooglePrimary =
        nextRuntime.policy.primaryProvider === 'google-api' ||
        nextRuntime.policy.primaryProvider === 'google_api';

      const primaryProvider: EngineProviderId = isGooglePrimary ? 'google-api' : 'agy-cli';
      const fallbackProvider: EngineProviderId = isGooglePrimary ? 'agy-cli' : 'google-api';

      setForm({
        primaryProvider,
        primaryModel: nextRuntime.policy.primaryModel || (isGooglePrimary ? 'gemini-3.5-flash' : 'gemini-3.8-flash-low'),
        primaryTimeoutSeconds: nextRuntime.policy.primaryTimeoutSeconds || 180,
        fallbackEnabled: Boolean(nextRuntime.policy.fallbackModel),
        fallbackProvider,
        fallbackModel: nextRuntime.policy.fallbackModel || (isGooglePrimary ? 'gemini-3.8-flash-low' : 'gemini-3.5-flash'),
        fallbackTimeoutSeconds: nextRuntime.policy.fallbackTimeoutSeconds || 180,
      });
    } catch {
      setError('AI 런타임 설정을 불러오지 못했습니다. API 서버 연결을 확인해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selectPrimaryEngine = useCallback((provider: EngineProviderId) => {
    setForm((prev) => {
      if (prev.primaryProvider === provider) return prev;
      const newFallbackProvider: EngineProviderId = provider === 'google-api' ? 'agy-cli' : 'google-api';
      return {
        ...prev,
        primaryProvider: provider,
        primaryModel: provider === 'google-api' ? 'gemini-3.5-flash' : 'gemini-3.8-flash-low',
        fallbackProvider: newFallbackProvider,
        fallbackModel: newFallbackProvider === 'google-api' ? 'gemini-3.5-flash' : 'gemini-3.8-flash-low',
      };
    });
    setMessage('');
  }, []);

  const updatePrimaryModel = useCallback((model: string) => {
    setForm((prev) => ({ ...prev, primaryModel: model }));
    setMessage('');
  }, []);

  const updatePrimaryTimeout = useCallback((timeout: number) => {
    setForm((prev) => ({ ...prev, primaryTimeoutSeconds: timeout }));
    setMessage('');
  }, []);

  const toggleFallbackEnabled = useCallback((enabled: boolean) => {
    setForm((prev) => ({ ...prev, fallbackEnabled: enabled }));
    setMessage('');
  }, []);

  const updateFallbackModel = useCallback((model: string) => {
    setForm((prev) => ({ ...prev, fallbackModel: model }));
    setMessage('');
  }, []);

  const updateFallbackTimeout = useCallback((timeout: number) => {
    setForm((prev) => ({ ...prev, fallbackTimeoutSeconds: timeout }));
    setMessage('');
  }, []);

  const googleProvider = runtime?.providers.find((p) => p.id === 'google-api');
  const googleConfigured = Boolean(googleProvider?.configured);
  const cliProvider = runtime?.providers.find((p) => p.id === 'agy-cli');
  const cliAvailable = Boolean(cliProvider?.available);

  const savePolicy = useCallback(async () => {
    if (form.primaryProvider === 'google-api' && !googleConfigured) {
      setError('Google API를 기본 엔진으로 설정하려면 먼저 Google API 키를 등록해야 합니다. [Google API & 한도] 탭에서 키를 입력해 주세요.');
      return false;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      await llmConfigurationApi.updatePolicy({
        primaryProvider: form.primaryProvider,
        primaryModel: form.primaryModel,
        primaryTimeoutSeconds: form.primaryTimeoutSeconds,
        fallbackProvider: form.fallbackEnabled ? form.fallbackProvider : '',
        fallbackModel: form.fallbackEnabled ? form.fallbackModel : '',
        fallbackTimeoutSeconds: form.fallbackTimeoutSeconds,
      });
      setMessage('엔진 및 라우팅 정책이 성공적으로 저장되었습니다. 다음 분석부터 즉시 적용됩니다.');
      notifyLlmSettingsChanged();
      await reload();
      return true;
    } catch (err: unknown) {
      const errDetail = err instanceof Error ? err.message : '정책 저장 중 오류가 발생했습니다.';
      setError(`정책을 저장하지 못했습니다: ${errDetail}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [form, googleConfigured, reload]);

  return {
    runtime,
    form,
    isLoading,
    isSaving,
    error,
    message,
    googleConfigured,
    cliAvailable,
    reload,
    selectPrimaryEngine,
    updatePrimaryModel,
    updatePrimaryTimeout,
    toggleFallbackEnabled,
    updateFallbackModel,
    updateFallbackTimeout,
    savePolicy,
  };
}
