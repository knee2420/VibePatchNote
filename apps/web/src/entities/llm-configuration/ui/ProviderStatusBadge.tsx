import { Sparkles } from 'lucide-react';

import { useLlmProviderStatus } from '../model/useLlmProviderStatus';

interface ProviderStatusBadgeProps {
  /** 클릭하면 열릴 설정 창. */
  onOpenSettings?: () => void;
}

/** 상태별 색. 정상일 때는 조용하고, 막혔을 때만 눈에 띄게. */
const TONE = {
  ok: { dot: 'bg-emerald-500', text: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' },
  fallback: { dot: 'bg-amber-500', text: 'text-amber-700 bg-amber-50 hover:bg-amber-100' },
  blocked: { dot: 'bg-rose-500', text: 'text-rose-700 bg-rose-50 hover:bg-rose-100' },
  unknown: { dot: 'bg-slate-300', text: 'text-slate-400 hover:bg-slate-100' },
} as const;

/**
 * AI 공급자 상태 표시등.
 *
 * 이것이 없으면 사용자가 기본 경로가 막힌 것을 알 방법이 분석을 눌러서
 * 타임아웃까지 기다리는 것뿐입니다.
 */
export function ProviderStatusBadge({ onOpenSettings }: ProviderStatusBadgeProps) {
  const { health, label, detail } = useLlmProviderStatus();
  const tone = TONE[health];
  const needsAttention = health === 'fallback' || health === 'blocked';

  return (
    <button
      type="button"
      onClick={onOpenSettings}
      title={detail}
      aria-label={`${label}. ${detail}`}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all ${tone.text}`}
    >
      <span className="relative flex items-center justify-center">
        <Sparkles className="h-4 w-4" />
        <span
          className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${tone.dot}`}
        />
      </span>
      {/* 정상일 때는 아이콘만. 문제가 있을 때만 이유를 펼칩니다. */}
      {needsAttention && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}
