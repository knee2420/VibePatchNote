import { useCallback, useEffect, useMemo, useState } from 'react';

import { LLM_SETTINGS_CHANGED_EVENT } from '@/shared/lib/llmSettingsEvent';

import { llmConfigurationApi, type LlmProvider } from '../api/llmConfigurationApi';

/** 화면이 한눈에 보여줄 AI 사용 가능 상태. */
export type LlmHealth = 'ok' | 'fallback' | 'blocked' | 'unknown';

export interface LlmProviderStatus {
  health: LlmHealth;
  /** 배지에 그대로 쓸 짧은 문구. */
  label: string;
  /** 툴팁에 쓸 설명. */
  detail: string;
  primary?: LlmProvider;
  fallback?: LlmProvider;
  refresh: () => void;
}

/** 30초마다, 그리고 설정이 바뀔 때마다 공급자 상태를 다시 읽습니다. */
const POLL_INTERVAL_MS = 30_000;

export function useLlmProviderStatus(): LlmProviderStatus {
  const [providers, setProviders] = useState<LlmProvider[] | null>(null);

  const refresh = useCallback(() => {
    llmConfigurationApi
      .list()
      .then(({ providers: loaded }) => setProviders(loaded))
      .catch(() => setProviders(null));
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener(LLM_SETTINGS_CHANGED_EVENT, refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(LLM_SETTINGS_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  return useMemo(() => {
    const primary = providers?.find((provider) => provider.role === 'primary');
    const fallback = providers?.find((provider) => provider.role === 'fallback');

    if (!providers) {
      return { health: 'unknown', label: 'AI 상태 확인 중', detail: '공급자 상태를 불러오는 중입니다.', refresh };
    }

    if (primary?.available) {
      return { health: 'ok', label: 'AI 정상', detail: `${primary.label} 사용 가능`, primary, fallback, refresh };
    }

    // 기본 경로가 막혔다. 보조 경로가 있으면 그쪽으로 계속 돌아갑니다.
    const recovery = primary?.recoversIn ? `${primary.recoversIn} 복구` : '복구 시점 미정';
    const reason = primary?.blockedReason === 'QUOTA_EXHAUSTED' ? '사용량 한도 소진' : '기본 AI 사용 불가';

    if (fallback?.available) {
      return {
        health: 'fallback',
        label: '백업 사용 중',
        detail: `${reason} · ${recovery} · 지금은 ${fallback.label}로 분석합니다.`,
        primary,
        fallback,
        refresh,
      };
    }

    return {
      health: 'blocked',
      label: 'AI 사용 불가',
      detail: `${reason} · ${recovery} · Google API를 설정하면 지금 이어서 분석할 수 있습니다.`,
      primary,
      fallback,
      refresh,
    };
  }, [providers, refresh]);
}
